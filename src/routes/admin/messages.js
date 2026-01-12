const express = require("express");
const router = express.Router();
const MessageApiController = require("../../app/API/MessageApiController");

router.post("/start-chat", MessageApiController.startChat);
router.post("/send", MessageApiController.sendMessage);
router.get("/conversations", MessageApiController.getConversations);
router.get(
  "/conversations/:conversationId",
  MessageApiController.getConversationDetail
);
router.get(
  "/conversations/:conversationId/messages",
  MessageApiController.getMessages
);
router.post(
  "/conversations/:conversationId/mark-read",
  MessageApiController.markConversationAsRead
);
router.post(
  "/conversations/:conversationId/close",
  MessageApiController.closeConversation
);
router.post(
  "/conversations/:conversationId/reopen",
  MessageApiController.reopenConversation
);
router.delete("/:messageId", MessageApiController.deleteMessage);
router.get("/stats", MessageApiController.getStats);

module.exports = router;
