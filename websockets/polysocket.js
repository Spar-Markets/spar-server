const WebSocket = require("ws");

function setupPolySocket() {
  const ws = new WebSocket("wss://delayed.polygon.io/stocks");

  ws.on("open", function open() {
    console.log("Connected to the Polygon.io WebSocket server");

    // Send a message to the server (if necessary)
    // Example: Subscribing to AAPL stock data
    const subscriptionMessage = {
      action: "subscribe",
      params: "T.AAPL", // Replace with your subscription parameters
    };
    ws.send(JSON.stringify(subscriptionMessage));
  });

  ws.on("message", function incoming(data) {
    console.log(`Received data: ${data}`);
  });

  ws.on("error", function error(err) {
    console.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", function close() {
    console.log("WebSocket connection closed");
  });
}

module.exports = setupPolySocket;
