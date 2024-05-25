const express = require("express");
const router = express.Router();

router.post("/purchaseStock", async (req, res) => {
  try {
    const { email, matchId, buyPrice, ticker } = req.body;
    const match = await Match.findOneAndUpdate(
      { matchId: matchId },
      { $push: { "user1.assets": { ticker: ticker } } },
      { new: true }
    );
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
