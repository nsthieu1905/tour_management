const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: Date,
    lastMessageFrom: {
      type: String,
      enum: ["admin", "client"],
    },
    unreadCount: {
      admin: {
        type: Number,
        default: 0,
      },
      client: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["active", "closed", "archived"],
      default: "active",
    },
    subject: String,
    tags: [String],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
