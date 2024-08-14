const express = require("express");
const router = express.Router();
const { sparDB } = require("../config/mongoConnection.js");
const WaitListUser = require("../models/WaitListUser.js");

router.post("/addToWaitlist", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  try {
    // Check if the email already exists in the waitlist
    const existingUser = await WaitListUser.findOne({ email: String(email) });

    if (existingUser) {
      return res.status(409).send({ message: "Email is already on the waitlist" });
    }

    // If not, create a new WaitListUser
    const waitListUser = new WaitListUser({
      email: String(email),
    });

    await waitListUser.save();
    res.status(200).send({ message: "Successfully added to waitlist" });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    res.status(500).send({ message: "Server error, please try again later" });
  }
});

/*router.get("/fetchWaitlist", async (req, res) => {.
  try {
    const collection = sparDB.collection("waitList"); // Replace 'yourCollectionName' with your actual collection name
    const count = await collection.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    console.error("Error counting documents:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});*/

module.exports = router;
