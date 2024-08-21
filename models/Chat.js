const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    conversationID: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['dm', 'match'] },
    participantIDs: { type: [String], required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, index: true },
    lastMessage: {
        text: { type: String, required: false },  // Make this optional
        userID: { type: String, required: false },  // Make this optional
        time: { type: Date, required: false }  // Make this optional
    }
});

ChatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

ChatSchema.index({ participantIDs: 1, updatedAt: -1 });

const Chat = sparDB.model("Chat", ChatSchema);

module.exports = Chat;