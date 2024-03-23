/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment. Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  AccountsGetRequest,
} = require("plaid");
const mongoose = require("mongoose");
const crypto = require("crypto");
const plaid = require("plaid");
const WebSocket = require('ws');




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

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
  },
  users: {
    type: [String], // Array of usernames participating in the match
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // You can add more fields as needed for your specific application
});

const playerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  skillRating: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 50.0,
  },
  enteredMatchmakingAt: {
    type: Date,
    default: Date.now,
  },
  entryFee: {
    type: Number,
    required: true,
  },
  matchLength: {
    type: Number,
    required: true,
  },
});

const User = mongoose.model("users", userSchema);
const Player = mongoose.model("matchmakingPlayer", playerSchema);
const Match = mongoose.model("Match", matchSchema);

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
      products: ["auth", "transfer"],
      country_codes: ["US"],
      //redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
    };
  } else {
    //Payload if running Android *
    payload = {
      user: { client_user_id: "user" },
      client_name: "Spar",
      language: "en",
      products: ["auth", "transfer"],
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

app.post("/transfer", async function (req, res) {
  //request with access_token, account_id, legal_name, amount, debit/credit, network
  //for ACH, ach_class also required.
  //idempotency_key - recommended to avoid duplicate transfers

  try {
    console.log("STARTING TRANSFER");
    const { access_token, account_id } = req.body;
    const authId = await client.transferAuthorizationCreate(req.body);
    const transferReq = {
      access_token: access_token,
      account_id: account_id,
      authorization_id: authId.data.authorization.id,
      description: "Deposit",
    };
    console.log(authId.data);
    //console.log("transfer data:");
    //console.log(transferReq.body);
    const response = await client.transferCreate(transferReq);
    //console.log(transfer.amount + ", " + transfer.id);
    res.send(authId.data.authorization.decision);
  } catch (error) {
    console.error(error);
  }
});

app.post("/simTransfer", async function (req, res) {
  try {
    const response = await client.sandboxTransferSimulate(req.body);
    res.send("Success: " + req.body.event_type);
  } catch {
    console.error("Error Simming");
  }
});

app.post("/getPlaidBalance", async function (req, res) {
  try {
    const response = await client.transferLedgerGet({});
    const available_balance = response.data.balance.available;
    const pending_balance = response.data.balance.pending;
    res.send(
      "Available Balance: " +
        available_balance +
        ", Pending Balance: " +
        pending_balance
    );
  } catch {
    console.error("error getting plaid balance");
  }
});

app.post("/getTransferList", async (req, res) => {
  const request = {
    count: 25,
  };

  try {
    const response = await client.transferList(request);
    const transfers = response.data.transfers;
    for (const transfer of transfers) {
      console.log(transfer.amount + ", " + transfer.status);
    }
    res.send(transfers);
    //console.log(transfers);
  } catch {
    console.error("Error getting transfer list");
  }
});

// Fetches balance data using the Node client library for Plaid
app.post("/getBalance", async (req, res) => {
  //console.log("Start of bal req");

  const { newAccessToken } = req.body;

  const request = {
    access_token: newAccessToken,
  };

  try {
    const response = await client.accountsBalanceGet(request);
    const accounts = response.data.accounts;
    res.json({
      accounts,
    });
    console.log("Get Balance: Success");
  } catch (error) {
    console.log("Error Getting Balance");
  }
});

app.post("/getAccount", async (req, res) => {
  const { newAccessToken } = req.body;
  const request = {
    access_token: newAccessToken,
  };

  //console.log("Getting Account: " + request);

  try {
    const response = await client.accountsGet(request);
    const data = response.data;
    res.json({
      data,
    });
    console.log("Get Account: Success");
  } catch (error) {
    console.log("Error Getting Account");
  }
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
  console.log("going into updateacces" + email + newAccessToken);

  try {
    // Find the user by username and update the balance
    try {
      const user = await User.findOneAndUpdate(
        { email: email },
        { $set: { plaidPersonalAccess: newAccessToken } },
        { new: true } // Return the updated document
      );
    } catch (error) {
      console.log("user doesn't exist");
    }

    // Log another success message to the console
    console.log("Success in accesstokenupdating");

    res.status(201).json({ message: "User AccessToken Updated" });
  } catch (error) {
    console.error("Error AccessToken Failed to Update:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/updateUserBalanceDeposit", async (req, res) => {
  const { email, deposit } = req.body;

  try {
    try {
      await User.findOneAndUpdate(
        { email: email },
        { $inc: { balance: deposit } }
      );
    } catch (error) {
      console.log("user doesn't exist");
    }
  } catch (error) {
    console.error("Error in updating balance");
  }
});

app.post("/updateUserBalanceWithdraw", async (req, res) => {
  const { email, withdraw } = req.body;

  try {
    try {
      await User.findOneAndUpdate(
        { email: email },
        { $inc: { balance: -withdraw } }
      );
    } catch (error) {
      console.log("user doesn't exist");
    }
  } catch (error) {
    console.error("Error in updating balance");
  }
});

app.post("/getMongoAccount", async function (req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    console.log(user);
    if (user) {
      res.send(user.balance);
    }
  } catch {
    console.error("error");
  }
});

app.post("/accounts", async function (request, response, next) {
  const { newAccessToken } = request.body;
  console.log("printing" + newAccessToken);
  try {
    const accountsResponse = await client.accountsGet({
      access_token: newAccessToken,
    });
    console.log(accountsResponse);
    response.json(accountsResponse.data);
  } catch (error) {
    console.log(error);
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

app.post("/getAccessFromMongo", async function (req, res) {
  try {
    const { email } = req.body; // Destructure email from request body
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plaidPersonalAccess = user.plaidPersonalAccess;
    return res.send(plaidPersonalAccess);
  } catch (error) {
    console.error("Error retrieving user access:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/cancelMatchmaking", async (req, res) => {
  try {
    const { username } = req.body;

    // Find the player in the matchmaking collection by username
    const player = await Player.findOne({ username });

    if (!player) {
      // Player not found, send an error response
      return res.status(404).json({ error: "Player not found in matchmaking" });
    }

    // Delete the player from the matchmaking collection
    await Player.deleteOne({ username });

    // Send a success response
    res.json({ message: "Matchmaking canceled successfully" });
  } catch (error) {
    console.error("Error canceling matchmaking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/areTheyMatchmaking", async (req, res) => {
  try {
    const { username } = req.body;

    // Find the player in the matchmaking collection by username
    const Player = mongoose.model("Player", playerSchema, "matchmakingplayers");
    const player = await Player.findOne({ username });

    if (!player) {
      // Player not found, send an error response
      return res.json({
        result: false,
        message: "Player not found in matchmaking",
      });
    }

    // Send a success response
    res.json({ result: true, message: "Matchmaking Player is in matchmaking" });
  } catch (error) {
    console.error("Error checking matchmaking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function createMatch() {
  try {
    const users = await Player.find({}).exec();

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const skillDifference = Math.abs(
          users[i].skillRating - users[j].skillRating
        );
        console.log(users[i]);
        if (skillDifference <= 10) {
          // Create a unique match ID (you might want to use a more sophisticated approach)
          const matchId = generateRandomString(45);

          // Insert the matched users into the "matches" collection
          const match = new Match({
            matchId,
            users: [users[i].email, users[j].email],
          });
          await match.save();
          console.log("Updating user:", users[i].email);
          console.log("Match ID:", matchId);
          // Create an object representing the match
          console.log(users[i].email, match.matchId);
          // Add the match to both users' activematches field
          await User.findOneAndUpdate(
            { email: users[i].email },
            { $addToSet: { activematches: match.matchId } },
            { new: true } // Return the updated document
          );

          await User.findOneAndUpdate(
            { email: users[j].email },
            { $addToSet: { activematches: match.matchId } },
            { new: true } // Return the updated document
          );
          // Remove matched users from the "matchmaking" collection
          await Player.deleteMany({
            _id: { $in: [users[i]._id, users[j]._id] },
          });
          console.log(`Match found and created: ${matchId}`);
        }
      }
    }
  } finally {
    console.log("Match made. Why is this under finally");
  }
}

// // Run the matchmaking process every 10 seconds
// setInterval(async () => {
//   try {
//     await createMatch();
//     console.log("Matchmaking process completed successfully");
//   } catch (error) {
//     console.error("Error in matchmaking process:", error);
//   }
// }, 10000);

// test endpint
app.get("/ping", (req, res) => {
  res.send("pong");
});




// Websocket 

'use strict'


const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    // Handle incoming messages here
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
  });
});
