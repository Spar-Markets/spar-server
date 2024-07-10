const WebSocket = require("ws");
const EventEmitter = require("events");
const Match = require("../models/Match");
const { polygonKey } = require("../config/constants");
const stockEmitter = new EventEmitter();

let interestedStocksList = {};
let matchClientList = {};
// maps userIDs to socket connection
let userMatchmakingList = {};

const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://jjquaratiello:Cjwefuhijdsjdkhf2weeWu@cluster0.xcfppj4.mongodb.net";
const client = new MongoClient(uri);

function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * This is where changes are sent and this is where we distribute them to websockets
 */
stockEmitter.on("change", async (change) => {
  console.log("STEP 5: Stock emitter received CHANGES");

  // conditional for whether it is a new match or a change in assets

  // Get object id
  const objectID = change.documentKey._id;
  console.log("STEP 6: ObjectID:", objectID);

  // find the match in mongo
  const match = await Match.findOne();
  console.log("STEP 7: Match:", match);

  // get user1 assets and user2 assets in JSON format
  const updatedAssets = {
    type: "updatedAssets",
    user1Assets: match.user1.assets,
    user2Assets: match.user2.assets,
  };
  console.log("STEP 8: Updated assets about to send:", updatedAssets);
  const jsonString = JSON.stringify(updatedAssets);
  const arrayBuffer = stringToArrayBuffer(jsonString);

  if (matchClientList[match.matchID]) {
    for (socket of matchClientList[match.matchID]) {
      socket.send(arrayBuffer);
      console.log("STEP 9: Just sent updated assets to client.");
    }
  }

  /**
   * Handle new match event
   */
  stockEmitter.on("newMatch", async (change) => {
    // 1. grab the userIDs from the newly created match
    const userIDs = [
      change.fullDocument.user1.userID,
      change.fullDocument.user2.userID,
    ];

    // 2. lookup the corresponding socket connections in userMatchmakingList
    for (let userID of userIDs) {
      const activeMatchmakingSocket = userMatchmakingList[userID];
      // 3. IF any active connections: send the newly created match to them
      if (activeMatchmakingSocket) {
        // send them the match
        socket.send({
          type: "matchCreated",
          match: change.fullDocument,
        });
        // remove socket from userMatchmakingList
        userMatchmakingList[userID].splice(index, 1);

        // if no clients are currently interested in match, delete it
        if (userMatchmakingList[userID].length == 0) {
          delete userMatchmakingList[userID];
        }
      }
    }
  });

  console.log(
    "STEP 10: Done sending assets to all connected clients for this match."
  );
});

async function changeStream() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Access the database and collection
    const database = client.db("Spar");
    const matches = database.collection("matches");

    console.log("boutta run change streams with the pipeline");
    const changeStream = matches.watch(
      // Create a change stream on the collection
      {
        $match: {
          "fullDocument.user1.buyingpower": { $exists: true },
        },
      }
    );
    console.log("Ran the change streams w the pipeline");

    changeStream.on("change", (change) => {
      // check whether event is from assets
      console.log("STEP 1: Receive change from changestream.");

      console.log(
        "polysocket.js change stream change listener got a change here it is: ",
        change
      );

      // A conditional that tells whether the match was added or if it's for a change in assets,
      // Yes even though we have a pipeline for only assets it still detects if a match is created

      // check operation type
      if (change.operationType == "insert") {
        // this means new match was created
        // emit event that new match was created
        stockEmitter.emit("newMatch", change.fullDocument);
      } else {
        const key = Object.keys(change.updateDescription.updatedFields)[0];
        console.log("STEP 2: Here is change:", change);
        console.log("Key:", key);

        // CHECK 1: check for change in assets
        const firstCheck = "user1.assets";
        const secondCheck = "user2.assets";
        if (key.includes(firstCheck) || key.includes(secondCheck)) {
          console.log(
            "STEP 3: Received change:\n",
            JSON.stringify(change, null, 2)
          );
          stockEmitter.emit("change", change);
          console.log("STEP 4: Just emitted stockEmitter change.");
        } else {
          console.log("this is not the change we really care about");
        }
      }
    });

    changeStream.on("error", (error) => {
      console.error("Error on change stream:", error);
    });

    changeStream.on("close", () => {
      console.log("Change stream closed");
    });
  } catch (error) {
    console.error("Error in changeStream function:", error);
  }
}

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
    subscribeToStocks(ws);
  });

  //let clients = [];
  ws.on("message", function incoming(data) {
    const parsedData = JSON.parse(data);
    //console.log(parsedData[0].sym);
    // console.log("Jackson interestedParsedData", parsedData);
    // why can we access with ticker
    if (interestedStocksList[parsedData[0].sym]) {
      // make sure its a stock update message
      const ticker = parsedData[0].sym;
      //console.log(interestedStocksList[ticker]);
      if (ticker && interestedStocksList[ticker]) {
        interestedStocksList[ticker].forEach((client) => {
          //console.log("Sending Data:", parsedData);
          client.send(data);
        });
      }
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
    //console.log("Subscribing to stocks:", subscriptionMessage.params);
    ws.send(JSON.stringify(subscriptionMessage));
  } else {
    console.log("No stocks to subscribe to");
  }
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", function connection(socket) {
    console.log("WebSocket client connected");

    socket.send("Websocket connected successfully");

    socket.on("message", async function message(data) {
      const object = JSON.parse(data);

      // If type match, get their UserID so we can push updates to them when their match object changes

      // CASE 1: Matchmaking
      if (object.type == "matchmaking") {
        // if userMatchMaking List already exists, push socket connection to it
        if (userMatchmakingList[object.userID]) {
          userMatchmakingList[object.userID].push(socket);
        } else {
          // otherwise, create it
          userMatchmakingList[object.userID] = [socket];
        }

        // CASE 2: Interested in stocks
      } else if (object.matchID) {
        // if matchClient list already exists, push socket connection to it
        if (matchClientList[object.matchID]) {
          matchClientList[object.matchID].push(socket);
        } else {
          // otherwise, create it
          matchClientList[object.matchID] = [socket];
        }

        // CASE 3: Subscribing to heartbeat to keep socket open
      } else if (object.type === "heartbeat") {
        // do nothing
        console.log("Heartbeat received.");
      } else {
        const ticker = object.ticker;
        if (!interestedStocksList[ticker]) {
          interestedStocksList[ticker] = [];
        }
        interestedStocksList[ticker].push(socket); //socket means client
        stockEmitter.emit("updateStocks");
      }
    });

    socket.on("error", function error(err) {
      console.error(`WebSocket error: ${err.message}`);
    });

    socket.on("close", () => {
      // Delete client from interested stocks list
      Object.keys(interestedStocksList).forEach((ticker) => {
        interestedStocksList[ticker] = interestedStocksList[ticker].filter(
          (client) => client !== socket
        );
        if (interestedStocksList[ticker].length === 0) {
          delete interestedStocksList[ticker];
        }
      });

      // Delete client from match client list
      for (let matchID in matchClientList) {
        let index = matchClientList[matchID].indexOf(socket);
        if (index !== -1) {
          // remove client if found
          matchClientList[matchID].splice(index, 1);

          // if no clients are currently interested in match, delete it
          if (matchClientList[matchID].length == 0) {
            delete matchClientList[matchID];
          }

          // break out of the loop if a socket has been found
          break;
        }
      }

      // Delete the user from userMatchmakingList
      // userID is the key, with an array of sockets as the value,
      // find the index of the socket and remove it on close from the user's values
      for (let userID in userMatchmakingList) {
        // grab index if socket within current socket array, if it's in there
        let index = userMatchmakingList[userID].indexOf(socket);
        // checks whether socket is present in array
        if (index !== -1) {
          // remove client if found
          userMatchmakingList[userID].splice(index, 1);

          // if no clients are currently interested in match, delete it
          if (userMatchmakingList[userID].length == 0) {
            delete userMatchmakingList[userID];
          }

          // break out of the loop if a socket has been found
          break;
        }
      }
    });
  });
}

module.exports = {
  setupPolySocket,
  setupWebSocket,
  changeStream,
};
