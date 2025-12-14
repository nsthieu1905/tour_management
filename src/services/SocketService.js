class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      this.handleUserJoin(socket);
      this.handleAdminJoin(socket);
      this.handleClientJoin(socket);
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
      if (!userId) {
        return;
      }

      const userIdStr = userId.toString ? userId.toString() : userId;
      const roomName = `user:${userIdStr}`;

      this.connectedUsers.set(userIdStr, socket.id);
      socket.join(roomName);
    });
  }

  // Admin tham gia kết nối
  handleAdminJoin(socket) {
    socket.on("admin:join", (data) => {
      const adminId = data.adminId || data;
      this.connectedUsers.set(`admin:${adminId}`, socket.id);
      socket.join("admin-notifications");
      socket.join("admin-messages");
    });
  }

  // Client tham gia kết nối
  handleClientJoin(socket) {
    socket.on("client:join", (data) => {
      const clientId = data.userId || data;
      this.connectedUsers.set(`client:${clientId}`, socket.id);
      socket.join("client-notifications");
      socket.join(`client:${clientId}`); // Individual client room
    });
  }

  /**
   * Conversation:join - Join vào ROOM của cuộc hội thoại
   * Client join khi mở chat, Admin join để quản lý tin nhắn
   */
  handleConversationJoin(socket) {
    socket.on("conversation:join", (data) => {
      const { conversationId, userId, userType = "client" } = data;
      const roomName = `conversation:${conversationId}`;

      socket.join(roomName);

      // Notify các user khác trong room
      socket.to(roomName).emit("user:joined", {
        userId,
        userType,
        timestamp: new Date(),
      });
    });
  }

  // Conversation:leave - Rời khỏi ROOM của cuộc hội thoại
  handleConversationLeave(socket) {
    socket.on("conversation:leave", (data) => {
      const { conversationId, userId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.leave(roomName);

      socket.to(roomName).emit("user:left", {
        userId,
        timestamp: new Date(),
      });
    });
  }

  // Typing:start - Người dùng bắt đầu gõ
  handleTypingStart(socket) {
    socket.on("typing:start", (data) => {
      const { conversationId, userId, userName } = data;
      const roomName = `conversation:${conversationId}`;

      // Broadcast tới những người khác trong room (không gửi lại cho người gửi)
      socket.to(roomName).emit("typing:active", {
        userId,
        userName,
      });
    });
  }

  // Typing:stop - Người dùng ngừng gõ
  handleTypingStop(socket) {
    socket.on("typing:stop", (data) => {
      const { conversationId, userId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.to(roomName).emit("typing:inactive", {
        userId,
      });
    });
  }

  // Message:read - Đánh dấu tin nhắn đã đọc
  handleMessageRead(socket) {
    socket.on("message:read", (data) => {
      const { conversationId, messageId, userId } = data;
      const roomName = `conversation:${conversationId}`;

      this.io.to(roomName).emit("message:marked-read", {
        messageId,
        userId,
        timestamp: new Date(),
      });
    });
  }

  // Conversation:read - Đánh dấu cuộc hội thoại đã đọc
  handleConversationRead(socket) {
    socket.on("conversation:read", (data) => {
      const { conversationId } = data;
      this.io
        .to(`conversation:${conversationId}`)
        .emit("conversation:read", data);
    });
  }

  // Conversation:closed - Thông báo cuộc hội thoại đã đóng
  handleConversationClosed(socket) {
    socket.on("conversation:closed", (data) => {
      const { conversationId } = data;
      this.io
        .to(`conversation:${conversationId}`)
        .emit("conversation:closed", data);
    });
  }

  // Xử lý ngắt kết nối
  handleDisconnect(socket) {
    socket.on("disconnect", () => {
      for (let [key, value] of this.connectedUsers.entries()) {
        if (value === socket.id) {
          this.connectedUsers.delete(key);
          break;
        }
      }
    });
  }

  // Lấy danh sách người dùng kết nối
  getConnectedUsers() {
    return this.connectedUsers;
  }
}

module.exports = SocketService;
