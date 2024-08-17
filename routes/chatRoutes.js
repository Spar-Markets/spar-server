const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat.js")

router.post("/addMessage", async (req, res) => {
    const { matchID, userID, message } = req.body;

    try {
        // Find the chat by matchID
        let chat = await Chat.findOne({ matchID: matchID });

        if (chat) {
            // Chat exists, append the new message to the messages array
            chat.messages.push({ userID, message, time: new Date() });
        } else {
            // Chat doesn't exist, create a new one
            chat = new Chat({
                matchID: matchID,
                messages: [{ userID, message, time: new Date() }]
            });
        }

        // Save the chat document
        await chat.save();

        res.status(200).json({ success: true, chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to add message" });
    }
});

module.exports = router;