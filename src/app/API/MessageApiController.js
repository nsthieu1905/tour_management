const MessageService = require("../../services/MessageService");
const { Conversation } = require("../models/index");

// [POST] /api/messages/start-chat
const startChat = async (req, res) => {
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

    if (conversation.__isNew || conversation.isNew) {
      if (global.io) {
        global.io.to("admin-messages").emit("conversation:new", {
          conversationId: conversation._id,
          userId: userId,
        });
      }
    }

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in startChat:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/messages/send
const sendMessage = async (req, res) => {
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

    if (global.io) {
      const messageData = message.toObject ? message.toObject() : message;
      const roomName = `conversation:${messageData.conversationId}`;

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

      // Nếu là tin từ client -> Notify admin
      if (senderType === "client") {
        global.io.to("admin-messages").emit("conversation:update", {
          conversationId,
          lastMessage: content.substring(0, 100),
          lastMessageAt: new Date(),
          lastMessageFrom: "client",
        });
      }

      // Nếu là tin từ admin -> Notify client
      if (senderType === "admin" && recipientId) {
        const clientIdStr = recipientId?.toString
          ? recipientId.toString()
          : recipientId;
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

    return res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const { search, status, priority, unreadOnly } = req.query;

    const conversations = await MessageService.getAllConversations({
      search,
      status,
      priority,
      unreadOnly,
    });

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/messages/conversations/:conversationId
const getConversationDetail = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in getConversationDetail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/messages/conversations/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

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

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
      error: error.toString(),
    });
  }
};

// [POST] /api/messages/conversations/:conversationId/mark-read
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    res.json({
      success: true,
      message: "No action taken",
    });
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/messages/conversations/:conversationId/close
const closeConversation = async (req, res) => {
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

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in closeConversation:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/messages/conversations/:conversationId/reopen
const reopenConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await MessageService.reopenConversation(
      conversationId
    );

    return res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error in reopenConversation:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [DELETE] /api/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    await MessageService.deleteMessage(messageId);

    return res.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/messages/stats
const getStats = async (req, res) => {
  try {
    const stats = await MessageService.getConversationStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  startChat,
  sendMessage,
  getConversations,
  getConversationDetail,
  getMessages,
  markConversationAsRead,
  closeConversation,
  reopenConversation,
  deleteMessage,
  getStats,
};
