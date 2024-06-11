const WebSocket = require("ws");

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
    // Example: Subscribing to AAPL stock data
    const subscriptionMessage = {
      action: "subscribe",
      params: "A.AAPL",
    };

    console.log("Authenticating with message:", JSON.stringify(authMessage));
    ws.send(JSON.stringify(authMessage));
    ws.send(JSON.stringify(subscriptionMessage));
  });

  ws.on("message", function incoming(data) {
    console.log(`Received data: ${data}`);
    // SEND out to websockets of all interested clients
  });

  ws.on("error", function error(err) {
    console.error(`WebSocket error: ${err.message}`);
  });

  ws.on("close", function close() {
    console.log("WebSocket connection closed");
  });
}

interestedStocksList = [];

// Store all connected sockets
function setupWebSocket(app, WsPort) {
  const wss = new WebSocket.Server({ server: app.listen(WsPort) });

  wss.on("connection", (socket) => {
    console.log("WEBSOCKETCLIENT connected");

    socket.send("hello");

    // Add the new socket to the list
    socket.on("message", function message(data) {
      console.log(
        "Received message from client ON WEBSOCKET:",
        data.toString()
      );
      // we are going to need to separate the different use cases based on data.toString()
      ticker = data.toString();
      interestedStocksList = interestedStocksList + [ticker];
    });

    socket.on("error", function error(err) {
      console.error(`WebSocket error: ${err.message}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = { setupPolySocket, setupWebSocket };
