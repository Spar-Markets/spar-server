const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Message = require("../models/Message");

router.post("/addMessage", async (req, res) => {
    const { conversationID, userID, message } = req.body;

    try {
        // Find the chat by conversationID
        let chat = await Chat.findOne({ conversationID });

        if (!chat) {
            // Chat doesn't exist, create a new one
            chat = new Chat({
                conversationID,
                participantIDs: [userID],  // Add the initial user, you can adjust this logic as needed
                type: conversationID.includes('match') ? 'match' : 'dm',  // Determine type based on conversationID
            });

            await chat.save();
        }

        // Create a new message
        const newMessage = new Message({
            chatID: conversationID,
            userID,
            message,
            time: new Date(),
        });

        // Save the message document
        await newMessage.save();

        // Update the chat's updatedAt timestamp
        chat.updatedAt = new Date();
        await chat.save();

        res.status(200).json({ success: true, message: newMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to add message" });
    }
});

router.get("/messages/:conversationID", async (req, res) => {
    const { conversationID } = req.params;

    try {
        // Find all messages associated with the given conversationID
        const messages = await Message.find({ chatID: conversationID }).sort({ time: -1 });

        res.status(200).json({ success: true, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to retrieve messages" });
    }
});

router.get("/conversations/:conversationID", async (req, res) => {
    const { conversationID } = req.params;

    try {
        const chat = await Chat.findOne({ conversationID });
        res.status(200).json({ exists: !!chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to check conversation" });
    }
});

router.post("/conversations", async (req, res) => {
    const { conversationID, participantIDs } = req.body;

    try {
        const newChat = new Chat({
            conversationID,
            participantIDs,
            type: "dm"
        });

        await newChat.save();

        res.status(201).json({ success: true, chat: newChat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to create conversation" });
    }
});

module.exports = router;
