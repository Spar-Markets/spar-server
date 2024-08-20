const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    conversationID: { type: String, required: true }, // Acts as matchID for match-specific chats or a unique ID for DMs
    type: { type: String, required: true, enum: ['dm', 'match'] }, // Type of chat: 'dm' or 'match'
    participantIDs: { type: [String], required: true }, // Array of user IDs participating in the chat
    createdAt: { type: Date, default: Date.now }, // Timestamp of when the chat was created
    updatedAt: { type: Date, default: Date.now }  // Timestamp of the last message sent
});

// Automatically update the `updatedAt` field when a new message is sent
ChatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Chat = sparDB.model("Chat", ChatSchema);

module.exports = Chat;
