const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    conversationID: { type: String, required: true, unique: true }, // Unique conversation ID
    type: { type: String, required: true, enum: ['dm', 'match'] }, // Type of chat: 'dm' or 'match'
    participantIDs: { type: [String], required: true, index: true }, // Array of user IDs participating in the chat
    createdAt: { type: Date, default: Date.now }, // Timestamp of when the chat was created
    updatedAt: { type: Date, default: Date.now, index: true }  // Timestamp of the last message sent
});

// Automatically update the `updatedAt` field when a new message is sent
ChatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index on participantIDs and updatedAt for optimized searches
ChatSchema.index({ participantIDs: 1, updatedAt: -1 });

const Chat = sparDB.model("Chat", ChatSchema);

module.exports = Chat;