"use strict";

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");

const {
  setupPolySocket,
  setupWebSocket,
  changeStream,
} = require("./websockets/polysocket");

// import routes
const balanceRoutes = require("./routes/balanceRoutes");
const matchMakingRoutes = require("./routes/matchMakingRoutes");
const { portfolioInterval } = require("./intervals/portfolioSnapshots");
const plaidRoutes = require("./routes/plaidRoutes");
const stockRoutes = require("./routes/stockRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const userRoutes = require("./routes/userRoutes");
const stockDataDelayed = require("./routes/stockDataDelayed");
const feedRoutes = require("./routes/feedRoutes");
const snapshotRoutes = require("./routes/snapshot");
const waitListRoutes = require("./routes/waitListRoutes");

// initialize express app and ports
const app = express();
const PORT = process.env.PORT || 3000;
// intervals
portfolioInterval.start();

// websockets
// setupPolySocket();
changeStream();
const { Server } = require("ws");

app.use(bodyParser.json());

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

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
});

// setupWebSocket(server);
