/**
 * CLIENT-SIDE REALTIME MESSAGING
 * Xử lý chat realtime giữa client và admin
 */

// Only define the class once
if (typeof RealtimeMessagingClient === "undefined") {
  class RealtimeMessagingClient {
    constructor() {
      this.socket = null;
      this.currentUserId = null;
      this.currentConversationId = null;
      this.isTyping = false;
      this.typingTimeout = null;

      // DOM elements
      this.chatWindow = document.getElementById("chatWindow");
      this.openChatBtn = document.getElementById("open-mesage");
      this.closeChatBtn = document.getElementById("closeChatBtn");
      this.chatInput = document.getElementById("chatInput");
      this.sendChatBtn = document.getElementById("sendChatBtn");
      this.chatMessages = document.getElementById("chatMessages");
      this.typingIndicator = document.getElementById("typingIndicator");

      // Debug
      console.log("[Chat] Initializing RealtimeMessagingClient");
      console.log("[Chat] chatWindow:", this.chatWindow);
      console.log("[Chat] openChatBtn:", this.openChatBtn);

      this.init();
    }

    /**
     * Khởi tạo
     */
    init() {
      if (!this.openChatBtn || !this.chatWindow) {
        console.error("[Chat] Missing DOM elements - Chat not initialized");
        return;
      }

      this.attachEventListeners();
      this.initSocket();
      this.getCurrentUserFromDom();

      console.log("[Chat] Initialization complete");
    }

    /**
     * Lấy user ID từ DOM (login)
     */
    getCurrentUserFromDom() {
      // Có thể lấy từ localStorage hoặc data-attribute
      this.currentUserId =
        localStorage.getItem("userId") ||
        document.body.dataset.userId ||
        document.body.dataset.userId ||
        "guest_" + Math.random().toString(36).substr(2, 9);

      console.log("[Chat] Current user:", this.currentUserId);
    }

    /**
     * Khởi tạo Socket.io
     */
    initSocket() {
      if (typeof io === "undefined") {
        console.warn("Socket.io not available");
        return;
      }

      this.socket = io();

      // Khi kết nối thành công
      this.socket.on("connect", () => {
        console.log("[Chat] Socket connected:", this.socket.id);

        // Join room cho user cá nhân (nhận thông báo)
        this.socket.emit("client:join", {
          userId: this.currentUserId,
        });
      });

      // Lắng nghe tin nhắn mới từ admin/client trong cùng room
      this.socket.on("message:new", (data) => {
        this.displayMessage(data);
      });

      // Lắng nghe người khác đang gõ
      this.socket.on("typing:active", (data) => {
        this.showTypingIndicator(data);
      });

      this.socket.on("typing:inactive", (data) => {
        this.hideTypingIndicator(data);
      });

      // Lắng nghe tin nhắn được đánh dấu đã đọc
      this.socket.on("message:marked-read", (data) => {
        this.markMessageAsRead(data.messageId);
      });

      // Lắng nghe sự kiện cuộc hội thoại
      this.socket.on("conversation:closed", () => {
        this.handleConversationClosed();
      });

      this.socket.on("user:joined", (data) => {
        console.log(`[Chat] ${data.userType} joined conversation`);
      });

      this.socket.on("disconnect", () => {
        console.log("[Chat] Socket disconnected");
      });
    }

    /**
     * Gắn các event listeners
     */
    attachEventListeners() {
      // Mở/Đóng chat window
      if (this.openChatBtn) {
        this.openChatBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("[Chat] Open chat button clicked");
          this.toggleChatWindow();
        });
        console.log("[Chat] Open chat listener attached");
      } else {
        console.error("[Chat] Open chat button not found");
      }

      if (this.closeChatBtn) {
        this.closeChatBtn.addEventListener("click", () => {
          console.log("[Chat] Close chat button clicked");
          this.closeChatWindow();
        });
      }

      // Gửi tin nhắn
      if (this.sendChatBtn) {
        this.sendChatBtn.addEventListener("click", () => {
          this.sendMessage();
        });
      }

      // Gửi khi nhấn Enter
      if (this.chatInput) {
        this.chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });

        // Typing indicator
        this.chatInput.addEventListener("input", () => {
          this.handleTyping();
        });
      }
    }

    /**
     * Mở chat window + khởi tạo conversation
     */
    toggleChatWindow() {
      if (!this.chatWindow) {
        console.error("[Chat] Chat window element not found");
        return;
      }

      console.log(
        "[Chat] Toggle chat window, current class:",
        this.chatWindow.className
      );
      console.log(
        "[Chat] Current display style:",
        window.getComputedStyle(this.chatWindow).display
      );

      this.chatWindow.classList.toggle("active");
      console.log("[Chat] After toggle, class:", this.chatWindow.className);
      console.log(
        "[Chat] After toggle, display style:",
        window.getComputedStyle(this.chatWindow).display
      );

      if (this.chatWindow.classList.contains("active")) {
        this.chatInput?.focus();
        this.startChat();
      } else {
        this.leaveConversation();
      }
    }

    /**
     * Đóng chat window
     */
    closeChatWindow() {
      if (!this.chatWindow) return;
      this.chatWindow.classList.remove("active");
      this.leaveConversation();
    }

    /**
     * Bắt đầu chat - tạo/lấy conversation
     */
    async startChat() {
      try {
        const response = await fetch("/api/messages/start-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: this.currentUserId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          this.currentConversationId = data.data._id;

          // Join room conversation
          this.socket.emit("conversation:join", {
            conversationId: this.currentConversationId,
            userId: this.currentUserId,
            userType: "client",
          });

          // Load lịch sử tin nhắn
          this.loadMessages();
        }
      } catch (error) {
        console.error("Error starting chat:", error);
      }
    }

    /**
     * Tải lịch sử tin nhắn
     */
    async loadMessages() {
      try {
        const response = await fetch(
          `/api/messages/conversations/${this.currentConversationId}/messages`
        );

        const data = await response.json();

        if (data.success && this.chatMessages) {
          this.chatMessages.innerHTML = "";

          data.data.forEach((msg) => {
            this.displayMessage(msg);
          });

          // Lưu messages vào localStorage
          this.saveMessagesToLocalStorage(data.data);

          // Scroll to bottom
          this.scrollToBottom();

          // Đánh dấu cuộc hội thoại đã đọc
          this.markConversationAsRead();
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        // Load từ localStorage nếu API fail
        this.loadMessagesFromLocalStorage();
      }
    }

    /**
     * Lưu tin nhắn vào localStorage
     */
    saveMessagesToLocalStorage(messages) {
      if (!this.currentConversationId) return;
      const key = `messages_${this.currentConversationId}`;
      try {
        localStorage.setItem(key, JSON.stringify(messages));
      } catch (error) {
        console.warn("Failed to save messages to localStorage:", error);
      }
    }

    /**
     * Tải tin nhắn từ localStorage
     */
    loadMessagesFromLocalStorage() {
      if (!this.currentConversationId || !this.chatMessages) return;
      const key = `messages_${this.currentConversationId}`;
      try {
        const messages = localStorage.getItem(key);
        if (messages) {
          this.chatMessages.innerHTML = "";
          JSON.parse(messages).forEach((msg) => {
            this.displayMessage(msg);
          });
          this.scrollToBottom();
        }
      } catch (error) {
        console.warn("Failed to load messages from localStorage:", error);
      }
    }

    /**
     * Gửi tin nhắn
     */
    async sendMessage() {
      const content = this.chatInput?.value.trim();

      if (!content || !this.currentConversationId) return;

      try {
        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: this.currentConversationId,
            content,
            senderType: "client",
            senderId: this.currentUserId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Clear input
          if (this.chatInput) {
            this.chatInput.value = "";
          }

          // Stop typing indicator
          this.stopTyping();

          // Tin nhắn sẽ được nhận qua socket.on("message:new")
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Lỗi khi gửi tin nhắn");
      }
    }

    /**
     * Hiển thị tin nhắn (client hoặc admin)
     */
    displayMessage(message) {
      if (!this.chatMessages) return;

      const isUserMessage = message.senderType === "client";
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${isUserMessage ? "user" : "bot"}`;
      messageDiv.id = `msg-${message._id}`;

      const time = new Date(message.createdAt).toLocaleTimeString("vi-VN");
      messageDiv.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        <span>${message.content}</span>
        <small style="margin-top: 4px; opacity: 0.7;">${time}</small>
      </div>
    `;

      this.chatMessages.appendChild(messageDiv);

      // Lưu tin nhắn mới vào localStorage
      if (this.currentConversationId) {
        this.addMessageToLocalStorage(message);
      }

      this.scrollToBottom();
    }

    /**
     * Thêm tin nhắn vào localStorage
     */
    addMessageToLocalStorage(message) {
      if (!this.currentConversationId) return;
      const key = `messages_${this.currentConversationId}`;
      try {
        const existing = localStorage.getItem(key);
        let messages = [];
        if (existing) {
          messages = JSON.parse(existing);
        }

        // Kiểm tra nếu tin nhắn đã tồn tại
        if (!messages.find((m) => m._id === message._id)) {
          messages.push(message);
          localStorage.setItem(key, JSON.stringify(messages));
        }
      } catch (error) {
        console.warn("Failed to add message to localStorage:", error);
      }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    markMessageAsRead(messageId) {
      const msgEl = document.getElementById(`msg-${messageId}`);
      if (msgEl) {
        msgEl.classList.add("read");
      }
    }

    /**
     * Xử lý typing indicator
     */
    handleTyping() {
      if (!this.currentConversationId || !this.socket) return;

      if (!this.isTyping) {
        this.isTyping = true;
        this.socket.emit("typing:start", {
          conversationId: this.currentConversationId,
          userId: this.currentUserId,
          userName: "Khách hàng",
        });
      }

      // Reset timeout
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.stopTyping();
      }, 3000); // Stop typing sau 3 giây không nhập
    }

    /**
     * Dừng typing indicator
     */
    stopTyping() {
      if (!this.currentConversationId || !this.socket) return;

      this.isTyping = false;
      this.socket.emit("typing:stop", {
        conversationId: this.currentConversationId,
        userId: this.currentUserId,
      });
    }

    /**
     * Hiển thị "đang gõ..."
     */
    showTypingIndicator(data) {
      if (!this.typingIndicator) return;

      this.typingIndicator.classList.add("active");
      this.typingIndicator.innerHTML = `
      <div style="font-size: 12px; color: #999;">
        <em>${data.userName || "Admin"} đang gõ...</em>
        <span style="margin-left: 4px;">
          <span></span><span></span><span></span>
        </span>
      </div>
    `;
    }

    /**
     * Ẩn typing indicator
     */
    hideTypingIndicator(data) {
      if (!this.typingIndicator) return;

      // Có thể kiểm tra userId nếu có nhiều người gõ
      // setTimeout để tránh flicker
      setTimeout(() => {
        this.typingIndicator.classList.remove("active");
      }, 500);
    }

    /**
     * Đánh dấu cuộc hội thoại đã đọc
     */
    async markConversationAsRead() {
      if (!this.currentConversationId) return;

      try {
        await fetch(
          `/api/messages/conversations/${this.currentConversationId}/mark-read`,
          {
            method: "POST",
          }
        );
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    }

    /**
     * Rời khỏi conversation
     */
    leaveConversation() {
      if (this.currentConversationId && this.socket) {
        this.socket.emit("conversation:leave", {
          conversationId: this.currentConversationId,
          userId: this.currentUserId,
        });
      }

      this.currentConversationId = null;
    }

    /**
     * Xử lý cuộc hội thoại bị đóng
     */
    handleConversationClosed() {
      if (this.chatMessages) {
        this.chatMessages.innerHTML += `
        <div style="text-align: center; color: #999; padding: 10px;">
          <em>Cuộc hội thoại đã được đóng</em>
        </div>
      `;
      }

      if (this.chatInput) {
        this.chatInput.disabled = true;
      }

      if (this.sendChatBtn) {
        this.sendChatBtn.disabled = true;
      }
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
      if (this.chatMessages) {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }
    }
  } // End of: class RealtimeMessagingClient
} // End of: if (typeof RealtimeMessagingClient === "undefined")

// Khởi tạo khi DOM ready - NGOÀI if block để đảm bảo chỉ chạy 1 lần
if (typeof window.initializeRealtimeChat === "undefined") {
  window.initializeRealtimeChat = function () {
    console.log("[Chat] Attempting to initialize...");

    // Chỉ khởi tạo 1 lần
    if (window.realtimeChat) {
      console.log("[Chat] Already initialized");
      return;
    }

    const init = () => {
      console.log("[Chat] Initializing RealtimeMessagingClient");
      window.realtimeChat = new RealtimeMessagingClient();
    };

    if (document.readyState === "loading") {
      // DOM still loading
      document.addEventListener("DOMContentLoaded", init);
    } else {
      // DOM already loaded
      init();
    }
  };
}

// Try to initialize immediately
window.initializeRealtimeChat();
