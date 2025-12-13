const MessageService = require("../../services/MessageService");
const Conversation = require("../models/Conversation");

class MessageApiController {
  /**
   * POST /api/messages/start-chat
   * Client tạo hoặc lấy cuộc hội thoại
   */
  static async startChat(req, res) {
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

      // 🔴 FIX: Nếu là conversation mới → notify admin
      if (conversation.__isNew || conversation.isNew) {
        console.log("[MessageApi] New conversation created, notifying admins");
        if (global.io) {
          global.io.to("admin-messages").emit("conversation:new", {
            conversationId: conversation._id,
            userId: userId,
          });
        }
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      console.error("Error in startChat:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/messages/send
   * Gửi tin nhắn + broadcast realtime
   */
  static async sendMessage(req, res) {
    try {
      const { conversationId, content, senderType, senderId, recipientId } =
        req.body;

      if (!conversationId || !content || !senderType) {
        return res.status(400).json({
          success: false,
          message: "conversationId, content, and senderType are required",
        });
      }

      // Validate senderId
      if (!senderId) {
        return res.status(400).json({
          success: false,
          message: "senderId is required",
        });
      }

      const message = await MessageService.sendMessage({
        conversationId,
        senderId,
        senderType,
        content,
        recipientId,
      });

      // 🔴 BROADCAST REALTIME qua Socket.io
      if (global.io) {
        const messageData = message.toObject ? message.toObject() : message;
        const roomName = `conversation:${messageData.conversationId}`;

        console.log(
          `[MessageApi] Broadcasting to room: ${roomName}, senderType: ${senderType}`
        );

        // Broadcast tin nhắn mới tới room (admin + client trong room)
        global.io.to(roomName).emit("message:new", {
          _id: messageData._id,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          senderType: messageData.senderType,
          content: messageData.content,
          createdAt: messageData.createdAt,
          read: false,
        });

        // Nếu là tin từ client → Notify admin
        if (senderType === "client") {
          console.log("[MessageApi] Notifying admins about client message");
          global.io.to("admin-messages").emit("conversation:update", {
            conversationId,
            lastMessage: content.substring(0, 100),
            lastMessageAt: new Date(),
            lastMessageFrom: "client",
          });
        }

        // Nếu là tin từ admin → Notify client
        if (senderType === "admin" && recipientId) {
          const clientIdStr = recipientId?.toString
            ? recipientId.toString()
            : recipientId;
          console.log("[MessageApi] Notifying client:", clientIdStr);
          global.io.to(`client:${clientIdStr}`).emit("message:new", {
            _id: messageData._id,
            conversationId: messageData.conversationId,
            senderId: messageData.senderId,
            senderType: messageData.senderType,
            content: messageData.content,
            createdAt: messageData.createdAt,
            read: false,
          });
        }
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/messages/conversations
   * Lấy danh sách cuộc hội thoại (admin)
   */
  static async getConversations(req, res) {
    try {
      const { search, status, priority, unreadOnly } = req.query;

      const conversations = await MessageService.getAllConversations({
        search,
        status,
        priority,
        unreadOnly, // ✅ Thêm parameter mới
      });

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error("Error in getConversations:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/messages/conversations/:conversationId
   * Lấy chi tiết một cuộc hội thoại
   */
  static async getConversationDetail(req, res) {
    try {
      const { conversationId } = req.params;

      // Don't populate participantIds since it contains mixed types
      const conversation = await Conversation.findById(conversationId);

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
      console.error("Error in getConversationDetail:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/messages/conversations/:conversationId/messages
   * Lấy danh sách tin nhắn của một cuộc hội thoại
   */
  static async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      console.log(
        "[MessageApi] Getting messages for conversation:",
        conversationId
      );

      // 🔴 FIX: Validate conversationId
      if (
        !conversationId ||
        conversationId === "undefined" ||
        conversationId === "null"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversationId",
        });
      }

      const messages = await MessageService.getMessages(
        conversationId,
        parseInt(limit),
        parseInt(skip)
      );

      console.log("[MessageApi] Found messages:", messages.length);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("[MessageApi] Error in getMessages:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.toString(),
      });
    }
  }

  /**
   * POST /api/messages/conversations/:conversationId/mark-read
   * ✅ BỎ tự động mark as read khi click vào conversation
   */
  static async markConversationAsRead(req, res) {
    try {
      const { conversationId } = req.params;

      // ✅ KHÔNG GỌI markConversationAsRead nữa
      console.log("[MessageApi] Mark as read called but doing nothing");

      res.json({
        success: true,
        message: "No action taken",
      });
    } catch (error) {
      console.error("Error in markConversationAsRead:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/messages/conversations/:conversationId/close
   * Đóng cuộc hội thoại
   */
  static async closeConversation(req, res) {
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
      console.error("Error in closeConversation:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/messages/conversations/:conversationId/reopen
   * Mở lại cuộc hội thoại
   */
  static async reopenConversation(req, res) {
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
      console.error("Error in reopenConversation:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/messages/:messageId
   * Xóa tin nhắn
   */
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      await MessageService.deleteMessage(messageId);

      res.json({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      console.error("Error in deleteMessage:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/messages/stats
   * Lấy thống kê
   */
  static async getStats(req, res) {
    try {
      const stats = await MessageService.getConversationStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error in getStats:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = MessageApiController;
