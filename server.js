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
// const app = express();
const PORT = process.env.PORT || 3000;

// intervals
portfolioInterval.start();

// websockets
setupPolySocket();
changeStream();

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

server.use(bodyParser.json());

// use routes
server.use(balanceRoutes);
server.use(matchMakingRoutes);
server.use(plaidRoutes);
server.use(stockRoutes);
server.use(tradeRoutes);
server.use(userRoutes);
server.use(feedRoutes);
server.use(stockDataDelayed);
server.use(snapshotRoutes);
server.use(waitListRoutes);

setupWebSocket(server);

// // listen on port
// app.listen(PORT, function listening() {
//   console.log("Server started on port", PORT);
// });
