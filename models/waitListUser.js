const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const WaitListUser = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // You can add more fields as needed for your specific application
});

module.exports = sparDB.model("WaitListUser", WaitListUser);
