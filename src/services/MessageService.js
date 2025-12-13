const Message = require("../app/models/Message");
const Conversation = require("../app/models/Conversation");
const mongoose = require("mongoose");

class MessageService {
  /**
   * Tìm hoặc tạo cuộc hội thoại giữa admin và client
   */
  static async findOrCreateConversation(userId, isAdmin = false) {
    try {
      // Validate userId
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
        // 🔴 FIX: Đánh dấu là conversation mới
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

        // 🔴 FIX: Thêm flag để biết đây là conversation mới
        conversation.__isNew = true;
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
            [`unreadCount.${senderType === "admin" ? "client" : "admin"}`]: 1,
          },
        },
        { new: true }
      );

      // ✅ QUAN TRỌNG: Nếu là admin reply → tự động mark as read
      if (senderType === "admin") {
        console.log(
          "[MessageService] Admin replied, marking conversation as read"
        );
        await this.markConversationAsReadByAdmin(conversationId);
      }

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
      // 🔴 FIX: Validate conversationId
      if (
        !conversationId ||
        conversationId === "undefined" ||
        conversationId === "null"
      ) {
        throw new Error("Invalid conversationId");
      }

      console.log("[MessageService] Getting messages for:", conversationId);

      // 🔴 FIX: KHÔNG populate senderId vì nó có thể là string (guest) hoặc ObjectId
      // Thay vào đó, lấy messages trước, sau đó manually populate nếu cần
      const messages = await Message.find({
        conversationId,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      console.log("[MessageService] Found messages:", messages.length);

      // 🔴 FIX: Manually populate cho ObjectId users, skip guest users
      const populatedMessages = await Promise.all(
        messages.map(async (msg) => {
          // Nếu senderId là ObjectId hợp lệ → populate
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
              console.warn(
                "[MessageService] Could not populate senderId:",
                msg.senderId
              );
              // Keep original senderId if populate fails
            }
          }
          // Nếu senderId là string (guest) → giữ nguyên

          return msg;
        })
      );

      return populatedMessages.reverse(); // Sắp xếp lại từ cũ đến mới
    } catch (error) {
      console.error("[MessageService] Error getting messages:", error);
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

      console.log("[MessageService] getAllConversations query:", query);

      // Lấy conversations có populate User info từ participantIds
      const conversations = await Conversation.find(query)
        .populate("closedBy", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

      // 🔴 FIX: Manually populate participantIds vì nó là Mixed type (string hoặc ObjectId)
      const User = mongoose.model("User");
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Populate tất cả participantIds
          const populatedParticipants = await Promise.all(
            conv.participantIds.map(async (participantId) => {
              // Nếu là ObjectId hợp lệ → populate từ User model
              if (
                participantId &&
                mongoose.Types.ObjectId.isValid(participantId)
              ) {
                try {
                  const user = await User.findById(participantId)
                    .select("fullName email avatar")
                    .lean();
                  if (user) {
                    // Rename fullName thành name để dùng chung
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
              // Nếu là string (guest user) → tạo object tạm
              return { _id: participantId, name: "Khách hàng" };
            })
          );

          conv.participantIds = populatedParticipants;
          return conv;
        })
      );

      // 🔴 FIX: Validate và log conversations
      console.log(
        "[MessageService] Found conversations:",
        populatedConversations.length
      );

      populatedConversations.forEach((conv, index) => {
        if (!conv._id) {
          console.error(
            `[MessageService] Conversation ${index} missing _id:`,
            conv
          );
        } else {
          console.log(`[MessageService] Conv ${index}: _id = ${conv._id}`);
        }
      });

      return populatedConversations;
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

      // ✅ THÊM: Filter tin nhắn chưa đọc
      if (filters.unreadOnly === "true") {
        query["unreadCount.admin"] = { $gt: 0 };
        console.log("[MessageService] Filtering unread conversations only");
      }

      if (filters.search) {
        query.$or = [
          { lastMessage: { $regex: filters.search, $options: "i" } },
          { subject: { $regex: filters.search, $options: "i" } },
        ];
      }

      console.log(
        "[MessageService] getAllConversations query:",
        JSON.stringify(query, null, 2)
      );

      // Lấy conversations có populate User info từ participantIds
      const conversations = await Conversation.find(query)
        .populate("closedBy", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

      console.log(
        "[MessageService] Found conversations before populate:",
        conversations.length
      );

      // 🔴 FIX: Manually populate participantIds vì nó là Mixed type (string hoặc ObjectId)
      const User = mongoose.model("User");
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Populate tất cả participantIds
          const populatedParticipants = await Promise.all(
            conv.participantIds.map(async (participantId) => {
              // Nếu là ObjectId hợp lệ → populate từ User model
              if (
                participantId &&
                mongoose.Types.ObjectId.isValid(participantId)
              ) {
                try {
                  const user = await User.findById(participantId)
                    .select("fullName email avatar")
                    .lean();
                  if (user) {
                    // Rename fullName thành name để dùng chung
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
              // Nếu là string (guest user) → tạo object tạm
              return { _id: participantId, name: "Khách hàng" };
            })
          );

          conv.participantIds = populatedParticipants;
          return conv;
        })
      );

      // 🔴 FIX: Validate và log conversations
      console.log(
        "[MessageService] Found conversations after populate:",
        populatedConversations.length
      );

      // ✅ THÊM: Log unreadCount để debug
      populatedConversations.forEach((conv, index) => {
        if (!conv._id) {
          console.error(
            `[MessageService] Conversation ${index} missing _id:`,
            conv
          );
        } else {
          console.log(
            `[MessageService] Conv ${index}: _id = ${
              conv._id
            }, unreadCount.admin = ${conv.unreadCount?.admin || 0}`
          );
        }
      });

      return populatedConversations;
    } catch (error) {
      console.error("Error getting all conversations:", error);
      throw error;
    }
  }
  /**
   * Đánh dấu cuộc hội thoại đã đọc CHỈ KHI ADMIN REPLY
   */
  static async markConversationAsReadByAdmin(conversationId) {
    try {
      await Message.updateMany(
        {
          conversationId,
          senderType: "client", // ✅ CHỈ đánh dấu tin nhắn từ client
          read: false,
        },
        {
          read: true,
          readAt: new Date(),
        }
      );

      // Reset unread count CHỈ cho admin
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          "unreadCount.admin": 0,
        },
      });

      return true;
    } catch (error) {
      console.error("Error marking conversation as read by admin:", error);
      throw error;
    }
  }

  /**
   * ✅ CẬP NHẬT: Đừng tự động mark as read, chỉ reset unread count
   */
  static async markConversationAsRead(conversationId) {
    try {
      // Không làm gì cả, hoặc chỉ log
      console.log(
        "[MessageService] markConversationAsRead called - doing nothing"
      );
      return true;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  }
}

module.exports = MessageService;
