"use strict";

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const {
  setupPolySocket,
  setupWebSocket,
  changeStream,
  chatChangeStream
} = require("./websockets/polysocket");

// import routes
const balanceRoutes = require("./routes/balanceRoutes");
const matchMakingRoutes = require("./routes/matchMakingRoutes");
const { fifteenMinuteInterval, oneDayInterval, oneWeekInterval } = require("./intervals/portfolioSnapshots");
const plaidRoutes = require("./routes/plaidRoutes");
const stockRoutes = require("./routes/stockRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const userRoutes = require("./routes/userRoutes");
const stockDataDelayed = require("./routes/stockDataDelayed");
const feedRoutes = require("./routes/feedRoutes");
const snapshotRoutes = require("./routes/snapshot");
const waitListRoutes = require("./routes/waitListRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes")

// initialize express app and ports
const app = express();
const PORT = process.env.PORT || 3000;
// const WsPort = 3001;

app.use(bodyParser.json());

app.use(cors());

// Decode base64 Google Cloud encoded credentials on Heroku
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const jsonCredentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8"
  );
  const fs = require("fs");
  fs.writeFileSync("/tmp/service-account-file.json", jsonCredentials);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/service-account-file.json";
}

// use routes
app.use(balanceRoutes);
app.use(matchMakingRoutes);
app.use(plaidRoutes);
app.use(stockRoutes);
app.use(tradeRoutes);
app.use(userRoutes);
app.use(feedRoutes);
app.use(stockDataDelayed);
app.use(snapshotRoutes);
app.use(waitListRoutes);
app.use(friendRoutes);
app.use(chatRoutes)

// intervals
fifteenMinuteInterval.start();
oneDayInterval.start();
oneWeekInterval.start();

// websockets
setupPolySocket();
changeStream();
chatChangeStream();

// listen on port
const server = app.listen(PORT, function listening() {
  console.log("Server started on port", PORT);
});
// Pass the app with open port to websocket
setupWebSocket(server);
