const WebSocket = require("ws");
const EventEmitter = require("events");
const Match = require("../models/Match");

class StockEmitter extends EventEmitter {}
const stockEmitter = new StockEmitter();

let interestedStocksList = {};

// Store all connected client sockets
let clients = [];

/**
 * Polygon Websocket
 */
function setupPolySocket() {
  const ws = new WebSocket("wss://delayed.polygon.io/stocks");

  ws.on("open", function open() {
    console.log("Connected to the Polygon.io WebSocket server");

    // Send a message to the server (if necessary)
    const authMessage = {
      action: "auth",
      params: "vLyw12bgkKE1ICVMl72E4YBpJwpmmCwh",
    };

    console.log("Authenticating with message:", JSON.stringify(authMessage));
    ws.send(JSON.stringify(authMessage));

    // Subscribe to initial stocks if any
    subscribeToStocks(ws);
  });

  ws.on("message", function incoming(data) {
    console.log(`Received data: ${data}`);

    // Send out to websockets of all interested clients
    clients.forEach((client) => {
      client.send(data);
    });

    // Parse and send specific ticker data to interested clients
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
    console.log("WebSocket connection closed");
  });

  stockEmitter.on("updateStocks", () => {
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
  }
}

// Store all connected sockets
function setupWebSocket(app, WsPort) {
  const wss = new WebSocket.Server({ server: app.listen(WsPort) });

  wss.on("connection", (socket) => {
    console.log("WEBSOCKETCLIENT connected");
    clients.push(socket);

    socket.send("hello");

    socket.on("message", async function message(data) {
      const object = JSON.parse(data);

      console.log(
        "Received message from client ON WEBSOCKET:",
        data.toString()
      );

      if (object.type == "match") {
        const match = await Match.findOne({ matchID: object.matchID });
        const tickerSet = new Set();

        // add each asset owned by each user to the tickerSet
        match.user1.assets.forEach((tickerObject) =>
          tickerSet.add(tickerObject.ticker)
        );
        match.user2.assets.forEach((tickerObject) =>
          tickerSet.add(tickerObject.ticker)
        );

        // if you want to delete from interested tickers list, run this
        if (object.status == "delete") {
          for (const ticker in tickerSet) {
            // Delete data
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
          // Add to ticker list
          for (const ticker in tickerSet) {
            if (!interestedStocksList[ticker]) {
              interestedStocksList[ticker] = [];
            }
            interestedStocksList[ticker].push(socket);
          }
        } else {
          console.log(
            "polysocket, bro literally how did we get here this log should never run. give alex 100% of the company if this logs."
          );
        }

        console.log("Interested stocks list:", interestedStocksList);

        // Emit event to notify Polygon WebSocket about the change
        stockEmitter.emit("updateStocks");

        // if its not a match then do this:
      } else {
        console.log("Websocket ticker received: " + object.ticker);
        console.log("Websocket status received: " + object.status);
        const ticker = object.ticker;

        if (object.status == "delete") {
          // Delete data
          if (interestedStocksList[ticker]) {
            interestedStocksList[ticker] = interestedStocksList[ticker].filter(
              (client) => client !== socket
            );
            if (interestedStocksList[ticker].length === 0) {
              delete interestedStocksList[ticker];
            }
          }
        } else {
          // Add to ticker list
          if (!interestedStocksList[ticker]) {
            interestedStocksList[ticker] = [];
          }
          interestedStocksList[ticker].push(socket);
        }

        console.log("Interested stocks list:", interestedStocksList);

        // Emit event to notify Polygon WebSocket about the change
        stockEmitter.emit("updateStocks");
      }
    });

    socket.on("error", function error(err) {
      console.error(`WebSocket error: ${err.message}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");
      clients = clients.filter((client) => client !== socket);

      // Remove client from interestedStocksList
      Object.keys(interestedStocksList).forEach((ticker) => {
        interestedStocksList[ticker] = interestedStocksList[ticker].filter(
          (client) => client !== socket
        );
        if (interestedStocksList[ticker].length === 0) {
          delete interestedStocksList[ticker];
        }
      });
    });
  });
}

module.exports = { setupPolySocket, setupWebSocket };
