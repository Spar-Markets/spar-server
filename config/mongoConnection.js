const mongoose = require("mongoose");

const sparDB = mongoose.createConnection(
  "mongodb+srv://jjquaratiello:Schoolipad1950!@cluster0.xcfppj4.mongodb.net/Spar"
);
const stockDB = mongoose.createConnection(
  "mongodb+srv://jjquaratiello:Schoolipad1950!@cluster0.xcfppj4.mongodb.net/stocks"
);

module.exports = { sparDB, stockDB };
