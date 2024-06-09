const mongoose = require("mongoose");

const sparDB = mongoose.createConnection(
  "mongodb+srv://jjquaratiello:Cjwefuhijdsjdkhf2weeWu@cluster0.xcfppj4.mongodb.net/Spar"
);
const stockDB = mongoose.createConnection(
  "mongodb+srv://jjquaratiello:Cjwefuhijdsjdkhf2weeWu@cluster0.xcfppj4.mongodb.net/stocks"
);

module.exports = { sparDB, stockDB };
