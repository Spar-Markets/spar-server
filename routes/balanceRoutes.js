const express = require("express");
const router = express.Router();

router.post("/updateUserBalanceDeposit", async (req, res) => {
  const { email, deposit } = req.body;

  try {
    try {
      await User.findOneAndUpdate(
        { email: email },
        { $inc: { balance: deposit } }
      );
    } catch (error) {
      console.log("user doesn't exist");
    }
  } catch (error) {
    console.error("Error in updating balance");
  }
});

router.post("/updateUserBalanceWithdraw", async (req, res) => {
  const { email, withdraw } = req.body;

  try {
    try {
      await User.findOneAndUpdate(
        { email: email },
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
