/**
 * MERGED CHAT & CONTACT FUNCTIONALITY
 * - Chat realtime với Socket.IO
 * - Contact modal
 */

// ==================== CONTACT MODAL FUNCTIONALITY ====================
// Giữ nguyên logic contact modal (không conflict)
const contactModal = document.getElementById("contactModal");
const contactBtn = document.getElementById("contact");
const closeContactBtn = document.getElementById("closeContactBtn");
const closeContactBtnBottom = document.getElementById("closeContactBtnBottom");

// Open/Close Contact Modal
if (contactBtn) {
  contactBtn.addEventListener("click", () => {
    contactModal.classList.add("active");
  });
}

if (closeContactBtn) {
  closeContactBtn.addEventListener("click", () => {
    contactModal.classList.remove("active");
  });
}

if (closeContactBtnBottom) {
  closeContactBtnBottom.addEventListener("click", () => {
    contactModal.classList.remove("active");
  });
}

// Close modal when clicking outside
if (contactModal) {
  contactModal.addEventListener("click", (e) => {
    if (e.target === contactModal) {
      contactModal.classList.remove("active");
    }
  });
}

// ==================== REALTIME CHAT CLASS ====================
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
    console.log("[Chat] closeChatBtn:", this.closeChatBtn);

    this.init();
  }

  /**
   * Khởi tạo
   */
  init() {
    if (!this.openChatBtn || !this.chatWindow) {
      console.error("[Chat] Missing DOM elements - Chat not initialized");
      console.error("[Chat] openChatBtn:", this.openChatBtn);
      console.error("[Chat] chatWindow:", this.chatWindow);
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
      "guest_" + Math.random().toString(36).substr(2, 9);

    console.log("[Chat] Current user:", this.currentUserId);
  }

  /**
   * Khởi tạo Socket.io
   */
  initSocket() {
    if (typeof io === "undefined") {
      console.warn("[Chat] Socket.io not available");
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
      console.log("[Chat] New message received:", data);
      this.displayMessage(data);
    });

    // Lắng nghe người khác đang gõ
    this.socket.on("typing:active", (data) => {
      console.log("[Chat] Typing active:", data);
      this.showTypingIndicator(data);
    });

    this.socket.on("typing:inactive", (data) => {
      console.log("[Chat] Typing inactive:", data);
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
      console.log("[Chat] Attaching click listener to open button");

      // XOÁ tất cả listeners cũ trước bằng cách clone node
      const newBtn = this.openChatBtn.cloneNode(true);
      this.openChatBtn.parentNode.replaceChild(newBtn, this.openChatBtn);
      this.openChatBtn = newBtn;

      this.openChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[Chat] Open chat button clicked!");
        this.toggleChatWindow();
      });

      console.log("[Chat] Open chat listener attached successfully");
    } else {
      console.error("[Chat] Open chat button (#open-mesage) not found in DOM");
    }

    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[Chat] Close chat button clicked");
        this.closeChatWindow();
      });
    }

    // Gửi tin nhắn
    if (this.sendChatBtn) {
      this.sendChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
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

    console.log("[Chat] Toggling chat window");
    console.log(
      "[Chat] Current classList:",
      this.chatWindow.classList.toString()
    );
    console.log(
      "[Chat] Current display:",
      window.getComputedStyle(this.chatWindow).display
    );

    // Toggle class 'active'
    const wasActive = this.chatWindow.classList.contains("active");

    if (wasActive) {
      this.chatWindow.classList.remove("active");
      console.log("[Chat] Chat closed");
      this.leaveConversation();
    } else {
      this.chatWindow.classList.add("active");
      console.log("[Chat] Chat opened");

      // Kiểm tra xem có hiển thị không
      setTimeout(() => {
        const display = window.getComputedStyle(this.chatWindow).display;
        const visibility = window.getComputedStyle(this.chatWindow).visibility;
        const opacity = window.getComputedStyle(this.chatWindow).opacity;

        console.log("[Chat] After opening - display:", display);
        console.log("[Chat] After opening - visibility:", visibility);
        console.log("[Chat] After opening - opacity:", opacity);
        console.log(
          "[Chat] After opening - classList:",
          this.chatWindow.classList.toString()
        );
      }, 100);

      this.chatInput?.focus();
      this.startChat();
    }
  }

  /**
   * Đóng chat window
   */
  closeChatWindow() {
    if (!this.chatWindow) return;
    console.log("[Chat] Closing chat window");
    this.chatWindow.classList.remove("active");
    this.leaveConversation();
  }

  /**
   * Bắt đầu chat - tạo/lấy conversation
   */
  async startChat() {
    console.log("[Chat] Starting chat...");
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
      console.log("[Chat] Start chat response:", data);

      if (data.success) {
        this.currentConversationId = data.data._id;
        console.log("[Chat] Conversation ID:", this.currentConversationId);

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
      console.error("[Chat] Error starting chat:", error);
      alert("Không thể kết nối đến server. Vui lòng thử lại sau.");
    }
  }

  /**
   * Tải lịch sử tin nhắn
   */
  async loadMessages() {
    console.log("[Chat] Loading messages...");
    try {
      const response = await fetch(
        `/api/messages/conversations/${this.currentConversationId}/messages`
      );

      const data = await response.json();
      console.log("[Chat] Messages loaded:", data);

      if (data.success && this.chatMessages) {
        this.chatMessages.innerHTML = "";

        data.data.forEach((msg) => {
          this.displayMessage(msg);
        });

        // Scroll to bottom
        this.scrollToBottom();

        // Đánh dấu cuộc hội thoại đã đọc
        this.markConversationAsRead();
      }
    } catch (error) {
      console.error("[Chat] Error loading messages:", error);
    }
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage() {
    const content = this.chatInput?.value.trim();

    if (!content || !this.currentConversationId) {
      console.warn(
        "[Chat] Cannot send message - empty content or no conversation"
      );
      return;
    }

    console.log("[Chat] Sending message:", content);

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
      console.log("[Chat] Send message response:", data);

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
      console.error("[Chat] Error sending message:", error);
      alert("Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
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

    const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        <span>${this.escapeHtml(message.content)}</span>
        <small style="margin-top: 4px; opacity: 0.7; font-size: 11px;">${time}</small>
      </div>
    `;

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Escape HTML để tránh XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
      <div style="font-size: 12px; color: #999; padding: 8px;">
        <em>${data.userName || "Admin"} đang gõ</em>
        <span style="margin-left: 4px;">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    `;
  }

  /**
   * Ẩn typing indicator
   */
  hideTypingIndicator(data) {
    if (!this.typingIndicator) return;

    // setTimeout để tránh flicker
    setTimeout(() => {
      this.typingIndicator.classList.remove("active");
      this.typingIndicator.innerHTML = "";
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
      console.error("[Chat] Error marking conversation as read:", error);
    }
  }

  /**
   * Rời khỏi conversation
   */
  leaveConversation() {
    if (this.currentConversationId && this.socket) {
      console.log("[Chat] Leaving conversation:", this.currentConversationId);
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
      const closedMsg = document.createElement("div");
      closedMsg.style.cssText =
        "text-align: center; color: #999; padding: 10px; font-style: italic;";
      closedMsg.textContent = "Cuộc hội thoại đã được đóng";
      this.chatMessages.appendChild(closedMsg);
    }

    if (this.chatInput) {
      this.chatInput.disabled = true;
      this.chatInput.placeholder = "Cuộc hội thoại đã đóng";
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
      setTimeout(() => {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }, 100);
    }
  }
}

// ==================== INITIALIZATION ====================
// Khởi tạo khi DOM đã sẵn sàng
function initializeRealtimeChat() {
  console.log("[Chat] DOM ready, initializing chat...");

  // Kiểm tra xem đã khởi tạo chưa
  if (window.realtimeChat) {
    console.log("[Chat] Already initialized, skipping...");
    return;
  }

  // Kiểm tra các elements cần thiết
  const chatWindow = document.getElementById("chatWindow");
  const openBtn = document.getElementById("open-mesage");

  console.log("[Chat] Checking required elements:");
  console.log("[Chat] - chatWindow:", chatWindow);
  console.log("[Chat] - openBtn:", openBtn);

  if (!chatWindow) {
    console.error("[Chat] Cannot find #chatWindow element");
    return;
  }

  if (!openBtn) {
    console.error("[Chat] Cannot find #open-mesage button");
    return;
  }

  // Khởi tạo chat client
  try {
    window.realtimeChat = new RealtimeMessagingClient();
    console.log("[Chat] Chat client initialized successfully");
  } catch (error) {
    console.error("[Chat] Error initializing chat client:", error);
  }
}

// Đảm bảo chỉ khởi tạo 1 lần
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeRealtimeChat);
} else {
  // DOM đã sẵn sàng
  initializeRealtimeChat();
}
