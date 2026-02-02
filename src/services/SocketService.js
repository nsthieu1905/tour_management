class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      this.handleUserJoin(socket);
      this.handleAdminJoin(socket);
      this.handleCustomerJoin(socket);
      this.handleConversationJoin(socket);
      this.handleConversationLeave(socket);
      this.handleTypingStart(socket);
      this.handleTypingStop(socket);
      this.handleMessageRead(socket);
      this.handleConversationRead(socket);
      this.handleConversationClosed(socket);
      this.handleDisconnect(socket);
    });
  }

  // Người dùng tham gia kết nối
  handleUserJoin(socket) {
    socket.on("user:join", (userId) => {
      try {
        if (!userId) {
          return;
        }

        const userIdStr = userId.toString ? userId.toString() : userId;
        const roomName = `user:${userIdStr}`;

        this.connectedUsers.set(userIdStr, socket.id);
        socket.join(roomName);
      } catch (error) {
        console.error("[SocketService] user:join error:", error);
      }
    });
  }

  // Admin tham gia kết nối
  handleAdminJoin(socket) {
    socket.on("admin:join", (data) => {
      try {
        if (!data) {
          return;
        }

        const adminId = data.adminId || data;
        if (!adminId) {
          return;
        }

        this.connectedUsers.set(`admin:${adminId}`, socket.id);
        socket.join("admin-notifications");
        socket.join("admin-messages");
      } catch (error) {
        console.error("[SocketService] admin:join error:", error);
      }
    });
  }

  // Customer tham gia kết nối
  handleCustomerJoin(socket) {
    socket.on("customer:join", (data) => {
      try {
        if (!data) {
          return;
        }

        const customerId = data.userId || data;
        if (!customerId) {
          return;
        }

        this.connectedUsers.set(`customer:${customerId}`, socket.id);
        socket.join("customer-notifications");
        socket.join(`customer:${customerId}`); // Individual customer room
      } catch (error) {
        console.error("[SocketService] customer:join error:", error);
      }
    });
  }

  /**
   * Conversation:join - Join vào ROOM của cuộc hội thoại
   * Customer join khi mở chat, Admin join để quản lý tin nhắn
   */
  handleConversationJoin(socket) {
    socket.on("conversation:join", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId, userId, userType = "customer" } = data;
        if (!conversationId) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.join(roomName);

        // Notify các user khác trong room
        socket.to(roomName).emit("user:joined", {
          userId,
          userType,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[SocketService] conversation:join error:", error);
      }
    });
  }

  // Conversation:leave - Rời khỏi ROOM của cuộc hội thoại
  handleConversationLeave(socket) {
    socket.on("conversation:leave", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId, userId } = data;
        if (!conversationId) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.leave(roomName);

        socket.to(roomName).emit("user:left", {
          userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[SocketService] conversation:leave error:", error);
      }
    });
  }

  // Typing:start - Người dùng bắt đầu gõ
  handleTypingStart(socket) {
    socket.on("typing:start", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId, userId, userName } = data;
        if (!conversationId) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        // Broadcast tới những người khác trong room (không gửi lại cho người gửi)
        socket.to(roomName).emit("typing:active", {
          userId,
          userName,
        });
      } catch (error) {
        console.error("[SocketService] typing:start error:", error);
      }
    });
  }

  // Typing:stop - Người dùng ngừng gõ
  handleTypingStop(socket) {
    socket.on("typing:stop", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId, userId } = data;
        if (!conversationId) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.to(roomName).emit("typing:inactive", {
          userId,
        });
      } catch (error) {
        console.error("[SocketService] typing:stop error:", error);
      }
    });
  }

  // Message:read - Đánh dấu tin nhắn đã đọc
  handleMessageRead(socket) {
    socket.on("message:read", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId, messageId, userId } = data;
        if (!conversationId || !messageId) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        this.io.to(roomName).emit("message:marked-read", {
          messageId,
          userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[SocketService] message:read error:", error);
      }
    });
  }

  // Conversation:read - Đánh dấu cuộc hội thoại đã đọc
  handleConversationRead(socket) {
    socket.on("conversation:read", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId } = data;
        if (!conversationId) {
          return;
        }

        this.io
          .to(`conversation:${conversationId}`)
          .emit("conversation:read", data);
      } catch (error) {
        console.error("[SocketService] conversation:read error:", error);
      }
    });
  }

  // Conversation:closed - Thông báo cuộc hội thoại đã đóng
  handleConversationClosed(socket) {
    socket.on("conversation:closed", (data) => {
      try {
        if (!data || typeof data !== "object") {
          return;
        }

        const { conversationId } = data;
        if (!conversationId) {
          return;
        }

        this.io
          .to(`conversation:${conversationId}`)
          .emit("conversation:closed", data);
      } catch (error) {
        console.error("[SocketService] conversation:closed error:", error);
      }
    });
  }

  // Xử lý ngắt kết nối
  handleDisconnect(socket) {
    socket.on("disconnect", () => {
      try {
        for (let [key, value] of this.connectedUsers.entries()) {
          if (value === socket.id) {
            this.connectedUsers.delete(key);
            break;
          }
        }
      } catch (error) {
        console.error("[SocketService] disconnect error:", error);
      }
    });
  }

  // Lấy danh sách người dùng kết nối
  getConnectedUsers() {
    return this.connectedUsers;
  }
}

module.exports = SocketService;
