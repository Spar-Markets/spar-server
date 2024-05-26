const WebSocket = require("ws");

// Store all connected sockets
const sockets = [];

function setupWebSocket(app, WsPort) {
  const wss = new WebSocket.Server({ server: app.listen(WsPort) });

  wss.on("connection", (socket) => {
    console.log("Client connected");

    // Add the new socket to the list
    sockets.push(socket);

    socket.on("message", (message) => {
      console.log("Received message from client:", message);
    });

    socket.on("close", () => {
      console.log("Client disconnected");

      // Remove the socket from the list when it's closed
      const index = sockets.indexOf(socket);
      if (index !== -1) {
        sockets.splice(index, 1);
      }
    });
  });
}

// Function to broadcast a message to all connected sockets
function broadcast(message) {
  sockets.forEach((socket) => {
    socket.send(message);
  });
}

module.exports = { setupWebSocket, broadcast, sockets };
