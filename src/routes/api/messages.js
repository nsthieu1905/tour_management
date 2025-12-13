const express = require("express");
const router = express.Router();
const MessageApiController = require("../../app/API/MessageApiController");

// Start chat
router.post("/start-chat", MessageApiController.startChat);

// Send message
router.post("/send", MessageApiController.sendMessage);

// Get all conversations
router.get("/conversations", MessageApiController.getConversations);

// Get conversation detail
router.get(
  "/conversations/:conversationId",
  MessageApiController.getConversationDetail
);

// Get messages of a conversation
router.get(
  "/conversations/:conversationId/messages",
  MessageApiController.getMessages
);

// Mark conversation as read
router.post(
  "/conversations/:conversationId/mark-read",
  MessageApiController.markConversationAsRead
);

// Close conversation
router.post(
  "/conversations/:conversationId/close",
  MessageApiController.closeConversation
);

// Reopen conversation
router.post(
  "/conversations/:conversationId/reopen",
  MessageApiController.reopenConversation
);

// Delete message
router.delete("/:messageId", MessageApiController.deleteMessage);

// Get stats
router.get("/stats", MessageApiController.getStats);

module.exports = router;
