const express = require("express");
const router = express.Router();
const MessageService = require("../../services/MessageService");

/**
 * POST /api/messages/start-chat
 * Client tạo hoặc lấy cuộc hội thoại
 */
router.post("/start-chat", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const conversation = await MessageService.findOrCreateConversation(
      userId,
      false
    );

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in start-chat:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/messages/send
 * Gửi tin nhắn
 */
router.post("/send", async (req, res) => {
  try {
    const { conversationId, content, senderType, senderId, recipientId } =
      req.body;

    if (!conversationId || !content || !senderType) {
      return res.status(400).json({
        success: false,
        message: "conversationId, content, and senderType are required",
      });
    }

    const message = await MessageService.sendMessage({
      conversationId,
      senderId: senderId || "system",
      senderType,
      content,
      recipientId,
    });

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error in send:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/messages/conversations
 * Lấy danh sách cuộc hội thoại (admin)
 */
router.get("/conversations", async (req, res) => {
  try {
    const { search, status, priority } = req.query;

    const conversations = await MessageService.getAllConversations({
      search,
      status,
      priority,
    });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error in get conversations:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * Lấy chi tiết một cuộc hội thoại
 */
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const Conversation = require("../../app/models/Conversation");
    const conversation = await Conversation.findById(conversationId).populate(
      "participantIds"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in get conversation detail:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Lấy danh sách tin nhắn của một cuộc hội thoại
 */
router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await MessageService.getMessages(
      conversationId,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error in get messages:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/mark-read
 * Đánh dấu cuộc hội thoại đã đọc
 */
router.post("/conversations/:conversationId/mark-read", async (req, res) => {
  try {
    const { conversationId } = req.params;

    await MessageService.markConversationAsRead(conversationId);

    // Broadcast qua socket.io
    if (global.io) {
      global.io
        .to(`conversation:${conversationId}`)
        .emit("conversation:read", { conversationId });
    }

    res.json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Error in mark-read:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/close
 * Đóng cuộc hội thoại
 */
router.post("/conversations/:conversationId/close", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { adminId } = req.body;

    const conversation = await MessageService.closeConversation(
      conversationId,
      adminId
    );

    // Broadcast qua socket.io
    if (global.io) {
      global.io
        .to(`conversation:${conversationId}`)
        .emit("conversation:closed", { conversationId });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in close conversation:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/reopen
 * Mở lại cuộc hội thoại
 */
router.post("/conversations/:conversationId/reopen", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await MessageService.reopenConversation(
      conversationId
    );

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in reopen conversation:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Xóa tin nhắn
 */
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    await MessageService.deleteMessage(messageId);

    res.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Error in delete message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/messages/stats
 * Thống kê
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await MessageService.getConversationStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in get stats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
