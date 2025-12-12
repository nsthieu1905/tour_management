const Message = require("../app/models/Message");
const Conversation = require("../app/models/Conversation");
const mongoose = require("mongoose");

class MessageService {
  /**
   * Tìm hoặc tạo cuộc hội thoại giữa admin và client
   */
  static async findOrCreateConversation(userId, isAdmin = false) {
    try {
      // Tìm cuộc hội thoại hiện tại
      let conversation = await Conversation.findOne({
        participantIds: { $all: [userId] },
        status: { $ne: "closed" },
      }).sort({ updatedAt: -1 });

      if (!conversation) {
        // Tạo cuộc hội thoại mới
        conversation = new Conversation({
          participantIds: [userId],
          subject: isAdmin ? `Support from admin` : `Chat with customer`,
          status: "active",
        });
        await conversation.save();
      }

      return conversation;
    } catch (error) {
      console.error("Error finding or creating conversation:", error);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn
   */
  static async sendMessage(data) {
    try {
      const {
        conversationId,
        senderId,
        senderType,
        content,
        recipientId,
        attachments = [],
      } = data;

      // Tạo tin nhắn mới
      const message = new Message({
        conversationId,
        senderId,
        senderType,
        recipientId,
        content,
        attachments,
        read: false,
      });

      await message.save();

      // Cập nhật conversation
      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: content.substring(0, 100),
          lastMessageAt: new Date(),
          lastMessageFrom: senderType,
          $inc: {
            [`unreadCount.${senderType === "admin" ? "client" : "admin"}`]: 1,
          },
        },
        { new: true }
      );

      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tin nhắn của 1 cuộc hội thoại
   */
  static async getMessages(conversationId, limit = 50, skip = 0) {
    try {
      const messages = await Message.find({
        conversationId,
        isDeleted: false,
      })
        .populate("senderId", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return messages.reverse(); // Sắp xếp lại từ cũ đến mới
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách cuộc hội thoại
   */
  static async getConversations(userId, isAdmin = false) {
    try {
      const conversations = await Conversation.find({
        participantIds: userId,
        status: { $ne: "archived" },
      })
        .populate("participantIds", "name email avatar")
        .sort({ lastMessageAt: -1 })
        .lean();

      return conversations;
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả cuộc hội thoại cho admin
   */
  static async getAllConversations(filters = {}) {
    try {
      const query = { status: { $ne: "archived" } };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      if (filters.search) {
        query.$or = [
          { lastMessage: { $regex: filters.search, $options: "i" } },
          { subject: { $regex: filters.search, $options: "i" } },
        ];
      }

      const conversations = await Conversation.find(query)
        .populate("participantIds", "name email avatar phone")
        .populate("closedBy", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

      return conversations;
    } catch (error) {
      console.error("Error getting all conversations:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  static async markAsRead(messageId) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          read: true,
          readAt: new Date(),
        },
        { new: true }
      );

      return message;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu tất cả tin nhắn của 1 cuộc hội thoại đã đọc
   */
  static async markConversationAsRead(conversationId) {
    try {
      await Message.updateMany(
        {
          conversationId,
          read: false,
        },
        {
          read: true,
          readAt: new Date(),
        }
      );

      // Reset unread count trong conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          "unreadCount.admin": 0,
          "unreadCount.client": 0,
        },
      });

      return true;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  }

  /**
   * Xóa tin nhắn (soft delete)
   */
  static async deleteMessage(messageId) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
        { new: true }
      );

      return message;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  /**
   * Đóng cuộc hội thoại
   */
  static async closeConversation(conversationId, closedBy) {
    try {
      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          status: "closed",
          closedAt: new Date(),
          closedBy,
        },
        { new: true }
      );

      return conversation;
    } catch (error) {
      console.error("Error closing conversation:", error);
      throw error;
    }
  }

  /**
   * Mở lại cuộc hội thoại
   */
  static async reopenConversation(conversationId) {
    try {
      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          status: "active",
          closedAt: null,
          closedBy: null,
        },
        { new: true }
      );

      return conversation;
    } catch (error) {
      console.error("Error reopening conversation:", error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian cuối cùng admin đọc tin nhắn
   */
  static async updateAdminReadStatus(conversationId) {
    try {
      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          $set: { "unreadCount.admin": 0 },
        },
        { new: true }
      );

      return conversation;
    } catch (error) {
      console.error("Error updating admin read status:", error);
      throw error;
    }
  }

  /**
   * Thống kê cuộc hội thoại
   */
  static async getConversationStats() {
    try {
      const stats = {
        total: await Conversation.countDocuments(),
        active: await Conversation.countDocuments({ status: "active" }),
        closed: await Conversation.countDocuments({ status: "closed" }),
        archived: await Conversation.countDocuments({ status: "archived" }),
        totalMessages: await Message.countDocuments({ isDeleted: false }),
      };

      return stats;
    } catch (error) {
      console.error("Error getting conversation stats:", error);
      throw error;
    }
  }
}

module.exports = MessageService;
