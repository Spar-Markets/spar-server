// // const WebSocket = require("ws");

// // /**
// //  * Polygon Websocket
// //  */
// // function setupPolySocket() {
// //   const ws = new WebSocket("wss://delayed.polygon.io/stocks");

// //   ws.on("open", function open() {
// //     console.log("Connected to the Polygon.io WebSocket server");

// //     // Send a message to the server (if necessary)
// //     const authMessage = {
// //       action: "auth",
// //       params: "vLyw12bgkKE1ICVMl72E4YBpJwpmmCwh",
// //     };
// //     // Example: Subscribing to AAPL stock data
// //     const subscriptionMessage = {
// //       action: "subscribe",
// //       params: "A.AAPL",
// //     };

// //     console.log("Authenticating with message:", JSON.stringify(authMessage));
// //     ws.send(JSON.stringify(authMessage));
// //     ws.send(JSON.stringify(subscriptionMessage));
// //   });

// //   ws.on("message", function incoming(data) {
// //     console.log(`Received data: ${data}`);
// //     // SEND out to websockets of all interested clients
// //   });

// //   ws.on("error", function error(err) {
// //     console.error(`WebSocket error: ${err.message}`);
// //   });

// //   ws.on("close", function close() {
// //     console.log("WebSocket connection closed");
// //   });
// // }

// // interestedStocksList = {};

// // // Store all connected sockets
// // function setupWebSocket(app, WsPort) {
// //   const wss = new WebSocket.Server({ server: app.listen(WsPort) });

// //   wss.on("connection", (socket) => {
// //     console.log("WEBSOCKETCLIENT connected");

// //     socket.send("hello");

// //     // Add the new socket to the list
// //     socket.on("message", function message(data) {
// //       console.log(
// //         "Received message from client ON WEBSOCKET:",
// //         data.toString()
// //       );
// //       const object = JSON.parse(data);
// //       console.log("Websocket ticker received: " + object.ticker);
// //       console.log("Websocket status received: " + object.status);
// //       console.log("InterestedStocksList right now: " + interestedStocksList);
// //       const ticker = object.ticker;
// //       if (object.status == "delete") {
// //         // Detete data
// //         if (interestedStocksList[ticker] == 1) {
// //           delete interestedStocksList[ticker];
// //         } else if (interestedStocksList[ticker] == undefined) {
// //           console.log(
// //             "(polysocket) bruh. we shouldn't get here. we're deleting a stock that isn't in interestedStocksList"
// //           );
// //         } else {
// //           interestedStocksList[ticker] = interestedStocksList[ticker] - 1;
// //           // Example: Subscribing to AAPL stock data
// //         }

// //         console.log(
// //           "this is what it looks like after being deleted:",
// //           interestedStocksList
// //         );
// //       } else {
// //         // Add to ticker count

// //         // function to look inside the interestedstockslist array to see if the ticker already exists in it.
// //         // if not, set count to 1. if yes, add 1 to count.
// //         if (interestedStocksList[ticker] == undefined) {
// //           interestedStocksList[ticker] = 1;
// //         } else {
// //           interestedStocksList[ticker] = interestedStocksList[ticker] + 1;
// //         }
// //         console.log("Interested stocks list:", interestedStocksList);
// //       }
// //     });

// //     socket.on("error", function error(err) {
// //       console.error(`WebSocket error: ${err.message}`);
// //     });

// //     socket.on("close", () => {
// //       console.log("Client disconnected");
// //     });
// //   });
// // }

// // module.exports = { setupPolySocket, setupWebSocket };

// const WebSocket = require("ws");
// const EventEmitter = require("events");

// class StockEmitter extends EventEmitter {}
// const stockEmitter = new StockEmitter();

// let interestedStocksList = {};

// /**
//  * Polygon Websocket
//  */
// function setupPolySocket() {
//   const ws = new WebSocket("wss://delayed.polygon.io/stocks");

//   ws.on("open", function open() {
//     console.log("Connected to the Polygon.io WebSocket server");

//     // Send a message to the server (if necessary)
//     const authMessage = {
//       action: "auth",
//       params: "KEY",
//     };

//     console.log("Authenticating with message:", JSON.stringify(authMessage));
//     ws.send(JSON.stringify(authMessage));

//     // Subscribe to initial stocks if any
//     subscribeToStocks(ws);
//   });

//   ws.on("message", function incoming(data) {
//     console.log(`Received data: ${data}`);
//     // SEND out to websockets of all interested clients

//   });

//   ws.on("error", function error(err) {
//     console.error(`WebSocket error: ${err.message}`);
//   });

//   ws.on("close", function close() {
//     console.log("WebSocket connection closed");
//   });

//   stockEmitter.on("updateStocks", () => {
//     subscribeToStocks(ws);
//   });
// }

// function subscribeToStocks(ws) {
//   console.log("workings?");
//   const tickers = Object.keys(interestedStocksList);
//   if (tickers.length > 0) {
//     const subscriptionMessage = {
//       action: "subscribe",
//       params: tickers.map((ticker) => `A.${ticker}`).join(","),
//     };
//     console.log("Subscribing to stocks:", subscriptionMessage.params);
//     ws.send(JSON.stringify(subscriptionMessage));
//   }
// }

// // Store all connected sockets
// function setupWebSocket(app, WsPort) {
//   const wss = new WebSocket.Server({ server: app.listen(WsPort) });

//   wss.on("connection", (socket) => {
//     console.log("WEBSOCKETCLIENT connected");

//     socket.send("hello");

//     socket.on("message", function message(data) {
//       console.log(
//         "Received message from client ON WEBSOCKET:",
//         data.toString()
//       );
//       const object = JSON.parse(data);
//       console.log("Websocket ticker received: " + object.ticker);
//       console.log("Websocket status received: " + object.status);
//       const ticker = object.ticker;

//       if (object.status == "delete") {
//         // Delete data
//         if (interestedStocksList[ticker] == 1) {
//           delete interestedStocksList[ticker];
//         } else if (interestedStocksList[ticker] == undefined) {
//           console.log(
//             "(polysocket) bruh. we shouldn't get here. we're deleting a stock that isn't in interestedStocksList"
//           );
//         } else {
//           interestedStocksList[ticker] = interestedStocksList[ticker] - 1;
//         }
//       } else {
//         // Add to ticker count
//         if (interestedStocksList[ticker] == undefined) {
//           interestedStocksList[ticker] = 1;
//         } else {
//           interestedStocksList[ticker] = interestedStocksList[ticker] + 1;
//         }
//       }

//       console.log("Interested stocks list:", interestedStocksList);

//       // Emit event to notify Polygon WebSocket about the change
//       stockEmitter.emit("updateStocks");
//     });

//     socket.on("error", function error(err) {
//       console.error(`WebSocket error: ${err.message}`);
//     });

//     socket.on("close", () => {
//       console.log("Client disconnected");
//     });
//   });
// }

// module.exports = { setupPolySocket, setupWebSocket };

const WebSocket = require("ws");
const EventEmitter = require("events");

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

    socket.on("message", function message(data) {
      console.log(
        "Received message from client ON WEBSOCKET:",
        data.toString()
      );
      const object = JSON.parse(data);
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
