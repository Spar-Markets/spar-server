const express = require("express");
const router = express.Router();

const {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  AccountsGetRequest,
} = require("plaid");

// define routes here
router.use(
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
router.post("/createLinkToken", async (req, res) => {
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
router.post("/exchangePublicToken", async function (request, response, next) {
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

router.post("/transfer", async function (req, res) {
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

router.post("/simTransfer", async function (req, res) {
  try {
    const response = await client.sandboxTransferSimulate(req.body);
    res.send("Success: " + req.body.event_type);
  } catch {
    console.error("Error Simming");
  }
});

router.post("/getPlaidBalance", async function (req, res) {
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

router.post("/getTransferList", async (req, res) => {
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
router.post("/getBalance", async (req, res) => {
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

router.post("/getAccount", async (req, res) => {
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

module.exports = router;
