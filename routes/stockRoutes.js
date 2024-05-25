const express = require("express");
const router = express.Router();

// these routes may be obselete now since we aren't storing in database

app.post("/getTickerDetails", async function (req, res) {
  const { ticker } = req.body;
  try {
    const details = await StockDetails.findOne({ ticker: ticker });
    if (details) {
      res.send(details);
    }
  } catch {
    console.error("Error getting stock data");
  }
});

module.exports = router;
