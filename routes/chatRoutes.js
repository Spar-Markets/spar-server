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
            return res.status(404).json({ success: false, error: "Chat not found" });
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

router.get("/userConversations/:userID", async (req, res) => {
    const { userID } = req.params;

    try {
        const chats = await Chat.find({ participantIDs: userID }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, chats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to retrieve conversations" });
    }
});

router.post("/conversations/search", async (req, res) => {
    const { userID1, userID2 } = req.body;

    try {
        const chat = await Chat.findOne({
            participantIDs: { $all: [userID1, userID2] }
        });

        if (chat) {
            res.status(200).json({ exists: true, chat });
        } else {
            res.status(200).json({ exists: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to search conversation" });
    }
});

module.exports = router;
