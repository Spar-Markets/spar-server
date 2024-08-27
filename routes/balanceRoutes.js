const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/updateUserBalanceDeposit", async (req, res) => {
  const { userID, deposit } = req.body;

  try {
      await User.findOneAndUpdate(
        { userID: userID },
        { $inc: { balance: deposit } }
      );
      res.status(200).json({ message: "Balance updated successfully." });

    
  } catch (error) {
    console.error("Error in updating balance");
  }
});

router.post("/updateUserBalanceWithdraw", async (req, res) => {
  const { userID, withdraw } = req.body;

  try {
    try {
      await User.findOneAndUpdate(
        { userID: userID },
        { $inc: { balance: -withdraw } }
      );
    } catch (error) {
      console.log("user doesn't exist");
    }
  } catch (error) {
    console.error("Error in updating balance");
  }
});

module.exports = router;
