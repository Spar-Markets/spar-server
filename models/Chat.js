const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const Chat = new mongoose.Schema({
    matchID: { type: String, required: true },
    messages: [
        {
            userID: { type: String, required: true }, // User ID of the person sending the message
            message: { type: String, required: true }, // The message content
            time: { type: Date, required: true, default: Date.now }, // Timestamp of when the message was sent
        }

    ],
    userIDs: { type: [String], required: true }
});

module.exports = sparDB.model("Chats", Chat);