const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    chatID: { type: String, ref: "Chat", required: true }, // The conversation ID, which is either matchID or a unique ID for DMs
    userID: { type: String, required: true }, // User ID of the person sending the message
    message: { type: String, required: true }, // The message content
    time: { type: Date, required: true, default: Date.now } // Timestamp of when the message was sent
});

const Message = sparDB.model("Message", MessageSchema);

module.exports = Message;
