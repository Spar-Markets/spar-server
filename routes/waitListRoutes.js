const express = require("express");
const router = express.Router();
const { sparDB } = require("../config/mongoConnection.js");
const WaitListUser = require("../models/WaitListUser.js");

router.post("/addToWaitlist", async (req, res) => {
  const { email } = req.body;
  if (email) {
    const waitListUser = new WaitListUser({
      email: String(email),
    });
    await waitListUser.save();
    res.status(200).send({ message: "Successfully added to waitlist" });
  } else {
    res.status(400).send({ message: "Email is required" });
  }
});

/*router.get("/fetchWaitlist", async (req, res) => {
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
