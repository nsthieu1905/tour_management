const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.Mixed, // String hoặc ObjectId
      ref: "User",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["admin", "client"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.Mixed, // String hoặc ObjectId
      ref: "User",
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    deletedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
