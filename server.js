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

// initialize express app and ports
const app = express();
const PORT = process.env.PORT || 3000;
const WsPort = 3001;

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

// intervals
portfolioInterval.start();

// websockets
setupPolySocket();
setupWebSocket(app, WsPort);
changeStream();

// listen on port
app.listen(PORT, function listening() {
  console.log("Server started on port", PORT);
});
