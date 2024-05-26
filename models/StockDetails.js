const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const stockDetailsSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: Object,
  },
  branding: {
    type: Object,
  },
  description: {
    type: String,
  },
  market_cap: {
    type: Number,
  },
  name: {
    type: String,
  },
  total_employees: {
    type: Number,
  },
});

module.exports = stockDB.model("tickerdetail", stockDetailsSchema);
