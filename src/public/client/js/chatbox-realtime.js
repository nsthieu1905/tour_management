/**
 * MERGED CHAT & CONTACT FUNCTIONALITY - OPTIMIZED VERSION
 * - Chat realtime với Socket.IO
 * - Contact modal
 * - Persistent chat state (giữ tin nhắn khi đóng/mở)
 */

// ==================== CONTACT MODAL FUNCTIONALITY ====================
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
    this.isConversationLoaded = false; // ✅ Track xem đã load conversation chưa
    this.hasShownGreeting = false; // ✅ Track xem đã hiện greeting chưa
    this.isUserLoaded = false; // ✅ Track xem đã load user info chưa

    // DOM elements
    this.chatWindow = document.getElementById("chatWindow");
    this.openChatBtn = document.getElementById("open-mesage");
    this.closeChatBtn = document.getElementById("closeChatBtn");
    this.chatInput = document.getElementById("chatInput");
    this.sendChatBtn = document.getElementById("sendChatBtn");
    this.chatMessages = document.getElementById("chatMessages");
    this.typingIndicator = document.getElementById("typingIndicator");

    console.log("[Chat] Initializing RealtimeMessagingClient");
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
    this.loadCurrentUser();

    console.log("[Chat] Initialization complete");
  }

  /**
   * ✅ Lấy user ID từ API (nếu login) hoặc localStorage
   */
  async loadCurrentUser() {
    try {
      // Thử lấy user từ API (nếu đã login)
      const response = await fetch("/api/users/current-user");
      const data = await response.json();

      if (data.success && data.data?.userId) {
        // User đã login
        this.currentUserId = data.data.userId;
        console.log("[Chat] Logged-in user ID:", this.currentUserId);

        // ✅ Load conversation ID từ localStorage (dùng real userId)
        this.currentConversationId = localStorage.getItem(
          `conversation_${this.currentUserId}`
        );

        // ✅ Load greeting state
        this.hasShownGreeting =
          localStorage.getItem(`greeting_shown_${this.currentUserId}`) ===
          "true";

        console.log(
          "[Chat] Restored conversation ID:",
          this.currentConversationId
        );
      } else {
        // User chưa login, dùng guest ID
        this.currentUserId =
          localStorage.getItem("guestId") ||
          "guest_" + Math.random().toString(36).substr(2, 9);

        localStorage.setItem("guestId", this.currentUserId);

        this.currentConversationId = localStorage.getItem(
          `conversation_${this.currentUserId}`
        );

        this.hasShownGreeting =
          localStorage.getItem(`greeting_shown_${this.currentUserId}`) ===
          "true";

        console.log("[Chat] Guest user ID:", this.currentUserId);
      }
    } catch (error) {
      console.error("[Chat] Error loading current user:", error);

      // Fallback to guest ID
      this.currentUserId =
        localStorage.getItem("guestId") ||
        "guest_" + Math.random().toString(36).substr(2, 9);

      localStorage.setItem("guestId", this.currentUserId);

      this.currentConversationId = localStorage.getItem(
        `conversation_${this.currentUserId}`
      );

      this.hasShownGreeting =
        localStorage.getItem(`greeting_shown_${this.currentUserId}`) === "true";

      console.log("[Chat] Fallback to guest user ID:", this.currentUserId);
    } finally {
      // ✅ Đánh dấu đã load user xong
      this.isUserLoaded = true;
      console.log("[Chat] User loading complete");
    }
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

    this.socket.on("connect", () => {
      console.log("[Chat] Socket connected:", this.socket.id);
      this.socket.emit("client:join", {
        userId: this.currentUserId,
      });

      // ✅ Nếu đang có conversation, rejoin room
      if (this.currentConversationId) {
        this.rejoinConversation();
      }
    });

    this.socket.on("message:new", (data) => {
      console.log("[Chat] New message received:", data);
      this.displayMessage(data);
    });

    this.socket.on("typing:active", (data) => {
      console.log("[Chat] Typing active:", data);
      this.showTypingIndicator(data);
    });

    this.socket.on("typing:inactive", (data) => {
      console.log("[Chat] Typing inactive:", data);
      this.hideTypingIndicator(data);
    });

    this.socket.on("message:marked-read", (data) => {
      this.markMessageAsRead(data.messageId);
    });

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
    if (this.openChatBtn) {
      console.log("[Chat] Attaching click listener to open button");

      // Xóa tất cả listeners cũ
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
    }

    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[Chat] Close chat button clicked");
        this.closeChatWindow();
      });
    }

    if (this.sendChatBtn) {
      this.sendChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    if (this.chatInput) {
      this.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      this.chatInput.addEventListener("input", () => {
        this.handleTyping();
      });
    }
  }

  /**
   * ✅ Mở/đóng chat window (KHÔNG reset conversation)
   */
  toggleChatWindow() {
    if (!this.chatWindow) {
      console.error("[Chat] Chat window element not found");
      return;
    }

    console.log("[Chat] Toggling chat window");
    const wasActive = this.chatWindow.classList.contains("active");

    if (wasActive) {
      // Đóng chat - CHỈ ẩn đi, KHÔNG xóa conversation
      this.chatWindow.classList.remove("active");
      console.log("[Chat] Chat closed (conversation preserved)");
    } else {
      // Mở chat
      this.chatWindow.classList.add("active");
      console.log("[Chat] Chat opened");

      this.chatInput?.focus();

      // ✅ Chờ user loading xong
      if (!this.isUserLoaded) {
        console.log("[Chat] Waiting for user to load...");
        const checkUserLoaded = setInterval(() => {
          if (this.isUserLoaded) {
            clearInterval(checkUserLoaded);
            this.proceedChatOpen();
          }
        }, 50);
        // Timeout sau 5s
        setTimeout(() => clearInterval(checkUserLoaded), 5000);
      } else {
        this.proceedChatOpen();
      }
    }
  }

  /**
   * ✅ Logic mở chat sau khi user đã load
   */
  proceedChatOpen() {
    // ✅ Kiểm tra xem đã có conversation ID từ localStorage không
    if (
      this.currentConversationId &&
      this.currentConversationId !== "undefined"
    ) {
      // Đã có conversation, chỉ cần load messages và mark as read
      console.log(
        "[Chat] Conversation already exists:",
        this.currentConversationId
      );

      // ✅ QUAN TRỌNG: Join room conversation ngay (để nhận socket events)
      if (this.socket) {
        console.log(
          "[Chat] Joining conversation room:",
          this.currentConversationId
        );
        this.socket.emit("conversation:join", {
          conversationId: this.currentConversationId,
          userId: this.currentUserId,
          userType: "client",
        });
      }

      if (!this.isConversationLoaded) {
        this.loadMessages();
        this.isConversationLoaded = true;
      } else {
        // Đã load rồi, chỉ cần scroll
        this.scrollToBottom();
        this.markConversationAsRead();
      }
    } else {
      // Chưa có conversation, tạo mới
      console.log("[Chat] No conversation found, starting new chat");
      this.startChat();
    }
  }

  /**
   * ✅ Đóng chat window (KHÔNG reset conversation)
   */
  closeChatWindow() {
    if (!this.chatWindow) return;
    console.log("[Chat] Closing chat window (conversation preserved)");
    this.chatWindow.classList.remove("active");
  }

  /**
   * ✅ Bắt đầu chat - tạo/lấy conversation
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
        this.isConversationLoaded = true; // ✅ Đánh dấu đã load

        // ✅ Lưu conversation ID vào localStorage (persistence)
        localStorage.setItem(
          `conversation_${this.currentUserId}`,
          this.currentConversationId
        );

        console.log("[Chat] Conversation ID:", this.currentConversationId);
        console.log("[Chat] Saved conversation ID to localStorage");

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
   * ✅ Rejoin conversation khi reconnect socket
   */
  rejoinConversation() {
    if (!this.currentConversationId) return;

    console.log("[Chat] Rejoining conversation:", this.currentConversationId);
    this.socket.emit("conversation:join", {
      conversationId: this.currentConversationId,
      userId: this.currentUserId,
      userType: "client",
    });
  }

  /**
   * ✅ Tải lịch sử tin nhắn (LUÔN hiện greeting)
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
        // Clear messages
        this.chatMessages.innerHTML = "";

        // ✅ LUÔN HIỂN THỊ GREETING TRƯỚC
        this.showInitialGreeting();

        // Hiển thị lịch sử tin nhắn nếu có
        if (data.data.length > 0) {
          data.data.forEach((msg) => {
            this.displayMessage(msg);
          });
        }

        // Scroll to bottom
        this.scrollToBottom();

        // Đánh dấu cuộc hội thoại đã đọc
        this.markConversationAsRead();
      }
    } catch (error) {
      console.error("[Chat] Error loading messages:", error);
      this.showInitialGreeting();
    }
  }

  /**
   * ✅ Hiển thị tin nhắn chào mừng ban đầu
   */
  showInitialGreeting() {
    if (!this.chatMessages) return;

    // ✅ CHỈ hiện 1 lần, tránh duplicate
    if (this.hasShownGreeting) return;
    this.hasShownGreeting = true;

    // ✅ Lưu vào localStorage (persistence across reload)
    localStorage.setItem(`greeting_shown_${this.currentUserId}`, "true");

    const greetingDiv = document.createElement("div");
    greetingDiv.className = "message bot greeting-message"; // ✅ Thêm class để dễ identify
    greetingDiv.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        <span>Xin chào!<br>Bạn đang gặp vấn đề gì cần tư vấn? Hãy cho tôi biết để chúng tôi có thể hỗ trợ bạn tốt nhất!</span>
        <small style="margin-top: 4px; opacity: 0.7; font-size: 11px;">
          ${new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      </div>
    `;

    this.chatMessages.appendChild(greetingDiv);
    this.scrollToBottom();
  }

  /**
   * ✅ Hiển thị tin nhắn "Đang chờ admin"
   */
  showWaitingMessage() {
    if (!this.chatMessages) return;

    // Hiển thị typing indicator trước
    if (this.typingIndicator) {
      this.typingIndicator.classList.add("active");
      this.typingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
      `;
    }

    // Sau 1s hiển thị tin nhắn
    setTimeout(() => {
      // Ẩn typing indicator
      if (this.typingIndicator) {
        this.typingIndicator.classList.remove("active");
        this.typingIndicator.innerHTML = "";
      }

      const waitingDiv = document.createElement("div");
      waitingDiv.className = "message bot waiting-message"; // ✅ Thêm class
      waitingDiv.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span>Cảm ơn bạn đã liên hệ!<br>Nhân viên hỗ trợ sẽ phản hồi bạn trong giây lát. Vui lòng đợi một chút nhé!</span>
          <small style="margin-top: 4px; opacity: 0.7; font-size: 11px;">
            ${new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </div>
      `;

      this.chatMessages.appendChild(waitingDiv);
      this.scrollToBottom();
    }, 1000);
  }

  /**
   * ✅ Gửi tin nhắn
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

    // ✅ Kiểm tra xem đây có phải tin nhắn đầu tiên không
    // (chỉ tính tin nhắn user, không tính greeting & waiting)
    const userMessages = this.chatMessages?.querySelectorAll(".message.user");
    const isFirstMessage = !userMessages || userMessages.length === 0;

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

        // ✅ Nếu là tin nhắn đầu tiên, hiển thị tin nhắn chờ admin
        if (isFirstMessage) {
          setTimeout(() => {
            this.showWaitingMessage();
          }, 500);
        }
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

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
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
   * ✅ Hiển thị typing indicator - CHỈ CÓ 3 CHẤM
   */
  showTypingIndicator(data) {
    if (!this.typingIndicator) return;

    this.typingIndicator.classList.add("active");
    this.typingIndicator.innerHTML = `
      <div class="typing-wrapper">
        <span class="typing-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
      </div>
    `;
  }

  /**
   * Ẩn typing indicator
   */
  hideTypingIndicator(data) {
    if (!this.typingIndicator) return;

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
   * ✅ Xử lý cuộc hội thoại bị đóng
   */
  handleConversationClosed() {
    if (this.chatMessages) {
      const closedMsg = document.createElement("div");
      closedMsg.className = "message system-message";
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

    // ✅ Reset state
    this.isConversationLoaded = false;
  }

  /**
   * ✅ Reset conversation (để bắt đầu chat mới)
   */
  resetConversation() {
    console.log("[Chat] Resetting conversation");

    // Leave room nếu đang trong conversation
    if (this.currentConversationId && this.socket) {
      this.socket.emit("conversation:leave", {
        conversationId: this.currentConversationId,
        userId: this.currentUserId,
      });
    }

    // ✅ Xóa conversation ID từ localStorage
    localStorage.removeItem(`conversation_${this.currentUserId}`);
    // ✅ Xóa greeting state từ localStorage
    localStorage.removeItem(`greeting_shown_${this.currentUserId}`);

    // Reset states
    this.currentConversationId = null;
    this.isConversationLoaded = false;
    this.hasShownGreeting = false;

    // Clear UI
    if (this.chatMessages) {
      this.chatMessages.innerHTML = "";
    }

    if (this.chatInput) {
      this.chatInput.value = "";
      this.chatInput.disabled = false;
      this.chatInput.placeholder = "Nhập tin nhắn...";
    }

    if (this.sendChatBtn) {
      this.sendChatBtn.disabled = false;
    }

    console.log("[Chat] Conversation reset complete");
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
function initializeRealtimeChat() {
  console.log("[Chat] DOM ready, initializing chat...");

  if (window.realtimeChat) {
    console.log("[Chat] Already initialized, skipping...");
    return;
  }

  const chatWindow = document.getElementById("chatWindow");
  const openBtn = document.getElementById("open-mesage");

  console.log("[Chat] Checking required elements:");
  console.log("[Chat] - chatWindow:", chatWindow);
  console.log("[Chat] - openBtn:", openBtn);

  if (!chatWindow) {
    console.error(
      "[Chat] Cannot find #chatWindow element, retrying in 100ms..."
    );
    setTimeout(initializeRealtimeChat, 100);
    return;
  }

  if (!openBtn) {
    console.error(
      "[Chat] Cannot find #open-mesage button, retrying in 100ms..."
    );
    setTimeout(initializeRealtimeChat, 100);
    return;
  }

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
  // DOM đã load, nhưng delay để đảm bảo body content đã render xong
  setTimeout(initializeRealtimeChat, 100);
}
