const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    chatID: { type: String, ref: "Chat", required: true, index: true }, // The conversation ID, which is either matchID or a unique ID for DMs
    userID: { type: String, required: true }, // User ID of the person sending the message
    message: { type: String, required: true }, // The message content
    time: { type: Date, required: true, default: Date.now, index: true } // Timestamp of when the message was sent
});

// Compound index to optimize queries for retrieving messages in a chat sorted by time
MessageSchema.index({ chatID: 1, time: 1 });

const Message = sparDB.model("Message", MessageSchema);

module.exports = Message;