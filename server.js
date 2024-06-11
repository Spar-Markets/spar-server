require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

// import websocket
const { setupWebSocket, broadcast, sockets } = require("./websockets/sockets");
const setupPolySocket = require("./websockets/polysocket");

// import routes
const balanceRoutes = require("./routes/balanceRoutes");
const matchMakingRoutes = require("./routes/matchMakingRoutes");
const plaidRoutes = require("./routes/plaidRoutes");
const stockRoutes = require("./routes/stockRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const userRoutes = require("./routes/userRoutes");
const stockDataDelayed = require("./routes/stockDataDelayed");
const feedRoutes = require("./routes/feedRoutes");

// initialize express app and ports
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
app.use(feedRoutes);
app.use(stockDataDelayed);

// websockets
setupWebSocket(app, WsPort);
setupPolySocket();

// listen on port
app.listen(PORT, function listening() {
  console.log("Server started on port", PORT);
});
