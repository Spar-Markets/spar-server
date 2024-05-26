/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment. Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/

// old imports
// TODO: move these to appropriate route files
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
const WebSocket = require("ws");
const axios = require("axios");
const polygonKey = "_4BtZn3PRCLu6fsdu7dgddb4ucmB1sfp";

// import websocket
const { setupWebSocket, broadcast, sockets } = require("./websockets/sockets");

// import routes
const balanceRoutes = require("./routes/balanceRoutes");
const matchMakingRoutes = require("./routes/matchMakingRoutes");
const plaidRoutes = require("./routes/plaidRoutes");
const stockRoutes = require("./routes/stockRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000; // Use the PORT environment variable if provided, otherwise default to 3000
const WsPort = 3001;

// app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use routes
app.use(balanceRoutes);
app.use(matchMakingRoutes);
app.use(plaidRoutes);
app.use(stockRoutes);
app.use(tradeRoutes);
app.use(userRoutes);

// websockets
setupWebSocket(app, WsPort);

app.listen(PORT, function listening() {
  console.log("Server started on port", PORT);
});
