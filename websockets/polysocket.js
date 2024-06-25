const WebSocket = require("ws");
const EventEmitter = require("events");
const Match = require("../models/Match");

const { polygonKey } = require("../config/constants");

const stockEmitter = new EventEmitter();

let interestedStocksList = {};
let clients = [];

function setupPolySocket() {
  let ws = new WebSocket("wss://delayed.polygon.io/stocks");

  ws.on("open", function open() {
    console.log("Connected to the Polygon.io WebSocket server");

    const authMessage = {
      action: "auth",
      params: polygonKey,
    };

    console.log("Authenticating with message:", JSON.stringify(authMessage));
    ws.send(JSON.stringify(authMessage));
    subscribeToStocks(ws); //investigate
  });

  ws.on("message", function incoming(data) {
    console.log(`Received data: ${data}`);

    clients.forEach((client) => {
      client.send(data);
    });

    const parsedData = JSON.parse(data);
    const ticker = parsedData.ticker;
    if (ticker && interestedStocksList[ticker]) {
      interestedStocksList[ticker].forEach((client) => {
        client.send(data);
      });
    }
  });

  ws.on("error", function error(err) {
    console.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", function close() {
    console.log("WebSocket connection closed. Reconnecting...");
    setTimeout(setupPolySocket, 5000);
  });

  stockEmitter.on("updateStocks", () => {
    console.log("Stock emitter received updateStocks event");
    subscribeToStocks(ws);
  });
}

function subscribeToStocks(ws) {
  console.log("Subscribing to stocks");
  const tickers = Object.keys(interestedStocksList);
  if (tickers.length > 0) {
    const subscriptionMessage = {
      action: "subscribe",
      params: tickers.map((ticker) => `A.${ticker}`).join(","),
    };
    console.log("Subscribing to stocks:", subscriptionMessage.params);
    ws.send(JSON.stringify(subscriptionMessage));
  } else {
    console.log("No stocks to subscribe to");
  }
}

function setupWebSocket(app, WsPort) {
  const server = app.listen(WsPort, () => {
    console.log(`WebSocket server started on port ${WsPort}`);
  });

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    console.log("WebSocket client connected");
    clients.push(socket);

    socket.send("hello");

    socket.on("message", async function message(data) {
      const object = JSON.parse(data);
      if (object.type == "match") {
        const match = await Match.findOne({ matchID: object.matchID });
        const tickerSet = new Set();

        match.user1.assets.forEach((tickerObject) =>
          tickerSet.add(tickerObject.ticker)
        );
        match.user2.assets.forEach((tickerObject) =>
          tickerSet.add(tickerObject.ticker)
        );

        if (object.status == "delete") {
          for (const ticker of tickerSet) {
            if (interestedStocksList[ticker]) {
              interestedStocksList[ticker] = interestedStocksList[
                ticker
              ].filter((client) => client !== socket);
              if (interestedStocksList[ticker].length === 0) {
                delete interestedStocksList[ticker];
              }
            }
          }
        } else if (object.status == "add") {
          for (const ticker of tickerSet) {
            if (!interestedStocksList[ticker]) {
              interestedStocksList[ticker] = [];
            }
            interestedStocksList[ticker].push(socket);
          }
        }

        stockEmitter.emit("updateStocks");
      } else {
        const ticker = object.ticker;

        if (object.status == "delete") {
          if (interestedStocksList[ticker]) {
            interestedStocksList[ticker] = interestedStocksList[ticker].filter(
              (client) => client !== socket
            );
            if (interestedStocksList[ticker].length === 0) {
              delete interestedStocksList[ticker];
            }
          }
        } else {
          //THIS IS WHAT IS RUNNING ON ADD STATUS IN STOCK DETAIL GRAPH
          if (!interestedStocksList[ticker]) {
            interestedStocksList[ticker] = [];
          }
          interestedStocksList[ticker].push(socket); //socket means client
          console.log("INTERESTED STOCKS LIST:", interestedStocksList);
        }

        stockEmitter.emit("updateStocks");
      }
    });

    socket.on("error", function error(err) {
      console.error(`WebSocket error: ${err.message}`);
    });

    socket.on("close", () => {
      clients = clients.filter((client) => client !== socket);

      Object.keys(interestedStocksList).forEach((ticker) => {
        interestedStocksList[ticker] = interestedStocksList[ticker].filter(
          (client) => client !== socket
        );
        console.log("INTERESTED STOCKS LIST:", interestedStocksList);
        if (interestedStocksList[ticker].length === 0) {
          delete interestedStocksList[ticker];
        }
      });
    });
  });
}

module.exports = { setupPolySocket, setupWebSocket };
