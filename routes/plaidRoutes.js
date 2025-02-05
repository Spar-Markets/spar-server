const express = require("express");
const router = express.Router();
const session = require("express-session");
const User = require("../models/User");


const {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  AccountsGetRequest,
} = require("plaid");

/**
 * plaidRoutes.js
 * Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment.
 * Utilizes the official Plaid node.js client library to make calls to the Plaid API.
 */

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

// Instantiate the Plaid client with the configuration
const client = new PlaidApi(config);

// Creates a link token 
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


// After the user has linked their bank the link token turns into a public token
// Exchanges the public token for an access token, which is the final token
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





// A debit payment means its coming out of the users account

router.post("/transfer", async function (req, res) {
  // Request with access_token, account_id, legal_name, amount, debit/credit, network
  // For ACH, ach_class also required.
  // idempotency_key - recommended to avoid duplicate transfers

  try {
    console.log("STARTING TRANSFER");
    const { access_token, account_id, amount } = req.body;
    const authId = await client.transferAuthorizationCreate({
      access_token: access_token,
      account_id: account_id,
      type: 'debit',
      network: 'ach',
      amount: amount,
      ach_class: 'ppd',
      user: {
        legal_name: 'Grant Drinkwater',
      },
    });

    const transferReq = {
      access_token: access_token,
      account_id: account_id,
      authorization_id: authId.data.authorization.id,
      description: "Deposit",
    };
    console.log(authId.data);
        
    const response = await client.transferCreate(transferReq);
    
    res.send(authId.data.authorization.decision);
  
  } catch (error) {
    console.error(error);
  }
});

router.post("/getTransferList", async (req, res) => {
  const request = {
    start_date: '2024-08-18T23:00:00Z',
    end_date: '2024-10-01T22:35:49Z',
    count: 5,
    origination_account_id: '8945fedc-e703-463d-86b1-dc0607b55460',
  };
  try {
    const response = await client.transferList(request);
    
    console.log("okok",response)
    
    const transfers = response.data.transfers;
    res.send(transfers)
  } catch (error) {
    console.log("error getting transfers")
  }
});

// Fetches balance for a given bank account from the access token
router.post("/getBalance", async (req, res) => {

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


// unsure of what this does 
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


router.post("/getAccount", async (req, res) => {
  const { accessToken } = req.body;

  try {
    // Create an array to hold the results for each token
    const results = await Promise.all(
      accessToken.map(async (token) => {
        const request = {
          access_token: token,
        };
        console.log("Request for access token:", request);

        try {
          const response = await client.accountsGet(request);
          const data = response.data;
          console.log("Get Account: Success for token", token);
          return { token, data }; // Include the token for reference
        } catch (error) {
          console.log("Error Getting Account for token", token);
          return { token, error: error.message }; // Handle the error for this token
        }
      })
    );
    // Send back all the results as a single array
    res.json({
      results,
    });
  } catch (error) {
    console.log("Error processing the request", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/sandbox-transfer-simulate", async (req, res) => {
  const { transfer_id } = req.body;
  const request1 = {
    transfer_id,
    event_type: 'posted',
  };
  const request7 = {
    transfer_id,
    event_type: 'settled',
  };
  try {

    const response8 = await client.sandboxTransferSimulate(request1);
    const response9 = await client.sandboxTransferSimulate(request7);

    // Empty response upon success

    console.log("posted yay!")

    res.send("done")
  
  } catch (error) {
    console.log("There was an error in transfer", error)
  }
});


module.exports = router;
