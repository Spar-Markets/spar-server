/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment. Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
const port = 3000;

// app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Mongo

mongoose
  // WE should look at saving this in a .env file which should be safer
  .connect(
    "mongodb+srv://jjquaratiello:Schoolipad1950!@cluster0.xcfppj4.mongodb.net/Spar",
    {}
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Test Error connecting", err);
  });

// Define a Song schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  skillRating: {
    type: mongoose.Schema.Types.Decimal128,
    default: 50.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  activematches: {
    type: [String],
    default: [],
    required: true,
  },
  plaidPersonalAccess: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("users", userSchema);

app.post("/createUser", async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;
    console.log("Received email:", email);

    const newUser = new User({
      username: generateRandomString(40),
      email: String(email),
    });
    await newUser.save();
    console.log("New User Created");
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.use(
  // FOR DEMO PURPOSES ONLY
  // Use an actual secret key in production
  session({ secret: "bosco", saveUninitialized: true, resave: true })
);

const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

// Configuration for the Plaid client
const config = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": "65833a47f1ae5c001b9d8fee",
      "PLAID-SECRET": "3838c18936a0e24249069c952b743a",
    },
  },
});

//Instantiate the Plaid client with the configuration
const client = new PlaidApi(config);

//Creates a Link token and return it
app.post("/createLinkToken", async (req, res) => {
  console.log("Called Link Token Process");
  let payload1 = {};
  // This needs to be fixed for ANDROID, look below for a better explaination
  let payload = {};

  console.log(req.body.address);
  //Payload if running iOS
  if (req.body.address === "localhost") {
    payload1 = {
      user: { client_user_id: "user" },
      client_name: "Spar",
      language: "en",
      products: ["auth"],
      country_codes: ["US"],
      //redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
    };
  } else {
    //Payload if running Android *
    payload = {
      user: { client_user_id: "user" },
      client_name: "Spar",
      language: "en",
      products: ["auth"],
      country_codes: ["US"],
      android_package_name: process.env.PLAID_ANDROID_PACKAGE_NAME,
    };
  }
  console.log("Got Token");
  const tokenResponse = await client.linkTokenCreate(payload1);
  console.log(tokenResponse.data);
  res.json(tokenResponse.data);
});

// Exchanges the public token from Plaid Link for an access token
app.post("/exchangePublicToken", async function (request, response, next) {
  console.log(
    "checking request body in exchange: " + request.body.public_token
  );
  const publicToken = request.body.public_token;

  try {
    const requestPayload = {
      public_token: publicToken,
    };

    const exchangeResponse = await client.itemPublicTokenExchange(
      requestPayload
    );
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    console.log("Access token: " + accessToken);

    // Send the response with the access token
    response.json({ access_token: accessToken, item_id: itemId });
  } catch (error) {
    console.log("Error exchanging link for access:", error);
    // Handle the error appropriately, e.g., send an error response
    response.status(500).json({ error: "Error exchanging link for access" });
  }
});

// Fetches balance data using the Node client library for Plaid
app.post("/Balance", async (req, res, next) => {
  const { access_token } = req.body;
  const balanceResponse = await client.accountsBalanceGet(access_token);
  const formattedResponse = balanceResponse.data; // Assuming balanceResponse is an Axios response object
  res.json({
    Balance: formattedResponse,
  });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}...`);
});

// Function for random string generation:

function generateRandomString(length) {
  // Define the characters that can be used in the random string
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let randomString = "";
  for (let i = 0; i < length; i++) {
    // Generate a random index to select a character from the charset
    const randomIndex = crypto.randomInt(0, charset.length);
    // Append the randomly selected character to the random string
    randomString += charset[randomIndex];
  }

  return randomString;
}

app.post("/updateUserAccessToken", async (req, res) => {
  // Extract username and newBalance from the request body
  const { email, newAccessToken } = req.body;
  try {
    // Find the user by username and update the balance
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { plaidPersonalAccess: newAccessToken } },
      { new: true } // Return the updated document
    );

    // Log another success message to the console
    console.log("success");

    res.status(201).json({ message: "User AccessToken Updated" });
  } catch (error) {
    console.error("Error AccessToken Failed to Update:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/accounts", async function (request, response, next) {
  const { newAccessToken } = request.body;
  try {
    const accountsResponse = await client.accountsGet({
      access_token: newAccessToken,
    });
    prettyPrintResponse(accountsResponse);
    response.json(accountsResponse.data);
  } catch (error) {
    prettyPrintResponse(error);
    return response.json(formatError(error.response));
  }
});

app.post("/checkUserExists", async function (req, res) {
  const { email } = req.body; // Destructure email from request body
  console.log(email); // Check if email is correctly received

  try {
    // Find user by email in the User collection
    const user = await User.findOne({ email: email });

    if (user) {
      // If user exists, send true
      res.send(true);
    } else {
      // If user doesn't exist, send false
      res.send(false);
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// test endpint
app.get("/ping", (req, res) => {
  res.send("pong");
});
