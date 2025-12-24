const Message = require("../app/models/Message");
const Conversation = require("../app/models/Conversation");
const mongoose = require("mongoose");

class MessageService {
  static async findOrCreateConversation(userId, isAdmin = false) {
    try {
      if (!userId) {
        throw new Error("userId is required");
      }

      // Nếu là guest user (string không phải ObjectId), chỉ cần tạo mới không query
      const isGuestUser = !mongoose.Types.ObjectId.isValid(userId);

      let conversation;
      let isNewConversation = false;

      if (isGuestUser) {
        // Guest user - query theo string userId
        conversation = await Conversation.findOne({
          participantIds: userId,
          status: { $ne: "closed" },
        }).sort({ updatedAt: -1 });
      } else {
        // User đã login - query theo ObjectId
        let queryUserId = userId;
        if (typeof userId === "string") {
          queryUserId = new mongoose.Types.ObjectId(userId);
        }

        conversation = await Conversation.findOne({
          participantIds: queryUserId,
          status: { $ne: "closed" },
        }).sort({ updatedAt: -1 });
      }

      if (!conversation) {
        isNewConversation = true;

        // Tạo cuộc hội thoại mới
        let participantList = [];

        if (!isGuestUser && mongoose.Types.ObjectId.isValid(userId)) {
          // User đã login
          participantList = [new mongoose.Types.ObjectId(userId)];
        } else {
          // Guest user - lưu userId string
          participantList = [userId];
        }

        conversation = new Conversation({
          participantIds: participantList,
          subject: isAdmin ? `Support from admin` : `Chat with customer`,
          status: "active",
        });
        await conversation.save();

        conversation.__isNew = true;
      }

      return conversation;
    } catch (error) {
      console.error(
        "[MessageService] Error finding or creating conversation:",
        error
      );
      throw error;
    }
  }

  // Gửi tin nhắn
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

      // Validate conversationId
      if (!conversationId || conversationId === "undefined") {
        throw new Error("Invalid conversationId");
      }

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
            [`unreadCount.${senderType === "admin" ? "customer" : "admin"}`]: 1,
          },
        },
        { new: true }
      );

      // Nếu admin gửi tin nhắn, đánh dấu cuộc hội thoại là đã đọc cho admin
      if (senderType === "admin") {
        await this.markConversationAsReadByAdmin(conversationId);
      }

      return message;
    } catch (error) {
      console.error("[MessageService] Error sending message:", error);
      throw error;
    }
  }

  // Lấy danh sách tin nhắn trong 1 cuộc hội thoại
  static async getMessages(conversationId, limit = 50, skip = 0) {
    try {
      if (
        !conversationId ||
        conversationId === "undefined" ||
        conversationId === "null"
      ) {
        throw new Error("Invalid conversationId");
      }

      const messages = await Message.find({
        conversationId,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const populatedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (msg.senderId && mongoose.Types.ObjectId.isValid(msg.senderId)) {
            try {
              const User = mongoose.model("User");
              const user = await User.findById(msg.senderId)
                .select("name email avatar")
                .lean();

              if (user) {
                msg.senderId = user;
              }
            } catch (err) {
              console.error("[MessageService] Error populating senderId:", err);
            }
          }

          return msg;
        })
      );

      return populatedMessages.reverse();
    } catch (error) {
      console.error("[MessageService] Error getting messages:", error);
      throw error;
    }
  }

  // Lấy tất cả cuộc hội thoại của user
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
      console.error("[MessageService] Error getting conversations:", error);
      throw error;
    }
  }

  // Lấy tất cả cuộc hội thoại cho admin
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

      console.log("[MessageService] getAllConversations query:", query);

      const conversations = await Conversation.find(query)
        .populate("closedBy", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

      const User = mongoose.model("User");
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const populatedParticipants = await Promise.all(
            conv.participantIds.map(async (participantId) => {
              if (
                participantId &&
                mongoose.Types.ObjectId.isValid(participantId)
              ) {
                try {
                  const user = await User.findById(participantId)
                    .select("fullName email avatar")
                    .lean();
                  if (user) {
                    return {
                      _id: participantId,
                      name: user.fullName,
                      email: user.email,
                    };
                  }
                  return { _id: participantId, name: "Khách hàng" };
                } catch (err) {
                  return { _id: participantId, name: "Khách hàng" };
                }
              }

              return { _id: participantId, name: "Khách hàng" };
            })
          );

          conv.participantIds = populatedParticipants;
          return conv;
        })
      );

      return populatedConversations;
    } catch (error) {
      console.error("[MessageService] Error getting all conversations:", error);
      throw error;
    }
  }

  // Đánh dấu tin nhắn đã đọc
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
      console.error("[MessageService] Error marking message as read:", error);
      throw error;
    }
  }

  // Đánh dấu tất cả tin nhắn trong cuộc hội thoại đọc
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
          "unreadCount.customer": 0,
        },
      });

      return true;
    } catch (error) {
      console.error(
        "[MessageService] Error marking conversation as read:",
        error
      );
      throw error;
    }
  }

  // Xoá tin nhắn
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
      console.error("[MessageService] Error deleting message:", error);
      throw error;
    }
  }

  // Đóng cuộc hội thoại
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
      console.error("[MessageService] Error closing conversation:", error);
      throw error;
    }
  }

  // Mở lại cuộc hội thoại
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
      console.error("[MessageService] Error reopening conversation:", error);
      throw error;
    }
  }

  // Cập nhật trạng thái đọc cho admin
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
      console.error(
        "[MessageService] Error updating admin read status:",
        error
      );
      throw error;
    }
  }

  // Lấy tất cả cuộc hội thoại cho admin với filter tin nhắn chưa đọc
  static async getAllConversations(filters = {}) {
    try {
      const query = { status: { $ne: "archived" } };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      // Filter tin nhắn chưa đọc
      if (filters.unreadOnly === "true") {
        query["unreadCount.admin"] = { $gt: 0 };
      }

      if (filters.search) {
        query.$or = [
          { lastMessage: { $regex: filters.search, $options: "i" } },
          { subject: { $regex: filters.search, $options: "i" } },
        ];
      }

      const conversations = await Conversation.find(query)
        .populate("closedBy", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

      const User = mongoose.model("User");
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const populatedParticipants = await Promise.all(
            conv.participantIds.map(async (participantId) => {
              if (
                participantId &&
                mongoose.Types.ObjectId.isValid(participantId)
              ) {
                try {
                  const user = await User.findById(participantId)
                    .select("fullName email avatar")
                    .lean();
                  if (user) {
                    return {
                      _id: participantId,
                      name: user.fullName,
                      email: user.email,
                    };
                  }
                  return { _id: participantId, name: "Khách hàng" };
                } catch (err) {
                  return { _id: participantId, name: "Khách hàng" };
                }
              }
              return { _id: participantId, name: "Khách hàng" };
            })
          );

          conv.participantIds = populatedParticipants;
          return conv;
        })
      );

      return populatedConversations;
    } catch (error) {
      console.error("[MessageService] Error getting all conversations:", error);
      throw error;
    }
  }

  // Đánh dấu tất cả tin nhắn trong cuộc hội thoại đọc bởi admin
  static async markConversationAsReadByAdmin(conversationId) {
    try {
      await Message.updateMany(
        {
          conversationId,
          senderType: "customer",
          read: false,
        },
        {
          $set: { read: true, readAt: new Date() },
        }
      );

      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { "unreadCount.admin": 0 },
      });

      return true;
    } catch (error) {
      console.error(
        "[MessageService] Error marking conversation as read by admin:",
        error
      );
      throw error;
    }
  }
}

module.exports = MessageService;
