// ============================
// CONTACT MODAL
// ============================
const contactModal = document.getElementById("contactModal");
const contactBtn = document.getElementById("contact");
const closeContactBtn = document.getElementById("closeContactBtn");
const closeContactBtnBottom = document.getElementById("closeContactBtnBottom");

if (contactBtn) {
  contactBtn.addEventListener("click", () =>
    contactModal.classList.add("active")
  );
}

if (closeContactBtn) {
  closeContactBtn.addEventListener("click", () =>
    contactModal.classList.remove("active")
  );
}

if (closeContactBtnBottom) {
  closeContactBtnBottom.addEventListener("click", () =>
    contactModal.classList.remove("active")
  );
}

if (contactModal) {
  contactModal.addEventListener("click", (e) => {
    if (e.target === contactModal) contactModal.classList.remove("active");
  });
}

// ============================
// REALTIME CHAT CUSTOMER
// ============================
class RealtimeMessagingCustomer {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.currentConversationId = null;
    this.isTyping = false;
    this.typingTimeout = null;
    this.isConversationLoaded = false;
    this.hasShownGreeting = false;
    this.isUserLoaded = false;

    this.chatWindow = document.getElementById("chatWindow");
    this.openChatBtn = document.getElementById("open-message");
    this.closeChatBtn = document.getElementById("closeChatBtn");
    this.chatInput = document.getElementById("chatInput");
    this.sendChatBtn = document.getElementById("sendChatBtn");
    this.chatMessages = document.getElementById("chatMessages");
    this.typingIndicator = document.getElementById("typingIndicator");

    this.init();
  }

  // ============================
  // KHỞI TẠO
  // ============================
  init() {
    if (!this.openChatBtn || !this.chatWindow) return;
    this.attachEventListeners();
    this.initSocket();
    this.loadCurrentUser();
  }

  // ============================
  // USER & STORAGE
  // ============================
  async loadCurrentUser() {
    try {
      const response = await fetch("/api/users/current-user");
      const data = await response.json();

      if (data.success && data.data?.userId) {
        this.currentUserId = data.data.userId;
      } else {
        this.currentUserId = this.getOrCreateGuestId();
      }
    } catch (error) {
      this.currentUserId = this.getOrCreateGuestId();
    } finally {
      this.loadStoredData();
      this.isUserLoaded = true;
    }
  }

  getOrCreateGuestId() {
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("guestId", guestId);
    }
    return guestId;
  }

  loadStoredData() {
    this.currentConversationId = localStorage.getItem(
      `conversation_${this.currentUserId}`
    );
    this.hasShownGreeting =
      localStorage.getItem(`greeting_shown_${this.currentUserId}`) === "true";
  }

  saveConversationId() {
    localStorage.setItem(
      `conversation_${this.currentUserId}`,
      this.currentConversationId
    );
  }

  saveGreetingState() {
    localStorage.setItem(`greeting_shown_${this.currentUserId}`, "true");
  }

  clearStoredData() {
    localStorage.removeItem(`conversation_${this.currentUserId}`);
    localStorage.removeItem(`greeting_shown_${this.currentUserId}`);
  }

  // ============================
  // SOCKET.IO
  // ============================
  initSocket() {
    if (typeof io === "undefined") return;

    this.socket = io();

    this.socket.on("connect", () => {
      this.socket.emit("customer:join", { userId: this.currentUserId });
      if (this.currentConversationId) this.rejoinConversation();
    });

    this.socket.on("message:new", (data) => this.displayMessage(data));
    this.socket.on("typing:active", (data) => this.showTypingIndicator(data));
    this.socket.on("typing:inactive", (data) => this.hideTypingIndicator(data));
    this.socket.on("message:marked-read", (data) =>
      this.markMessageAsRead(data.messageId)
    );
    this.socket.on("conversation:closed", () =>
      this.handleConversationClosed()
    );
  }

  joinConversationRoom() {
    if (!this.socket || !this.currentConversationId) return;
    this.socket.emit("conversation:join", {
      conversationId: this.currentConversationId,
      userId: this.currentUserId,
      userType: "customer",
    });
  }

  leaveConversationRoom() {
    if (!this.socket || !this.currentConversationId) return;
    this.socket.emit("conversation:leave", {
      conversationId: this.currentConversationId,
      userId: this.currentUserId,
    });
  }

  rejoinConversation() {
    if (!this.currentConversationId) return;
    this.joinConversationRoom();
  }

  // ============================
  // EVENT LISTENERS
  // ============================
  attachEventListeners() {
    if (this.openChatBtn) {
      const newBtn = this.openChatBtn.cloneNode(true);
      this.openChatBtn.parentNode.replaceChild(newBtn, this.openChatBtn);
      this.openChatBtn = newBtn;
      this.openChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleChatWindow();
      });
    }

    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
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

      this.chatInput.addEventListener("input", () => this.handleTyping());
    }
  }

  // ============================
  // CHAT WINDOW CONTROL
  // ============================
  toggleChatWindow() {
    if (!this.chatWindow) return;

    const wasActive = this.chatWindow.classList.contains("active");

    if (wasActive) {
      this.closeChatWindow();
    } else {
      this.openChatWindow();
    }
  }

  openChatWindow() {
    this.chatWindow.classList.add("active");
    this.chatInput?.focus();

    if (!this.isUserLoaded) {
      this.waitForUserLoad(() => this.proceedChatOpen());
    } else {
      this.proceedChatOpen();
    }
  }

  closeChatWindow() {
    if (!this.chatWindow) return;
    this.chatWindow.classList.remove("active");
  }

  waitForUserLoad(callback) {
    const checkUserLoaded = setInterval(() => {
      if (this.isUserLoaded) {
        clearInterval(checkUserLoaded);
        callback();
      }
    }, 50);
    setTimeout(() => clearInterval(checkUserLoaded), 5000);
  }

  proceedChatOpen() {
    if (
      this.currentConversationId &&
      this.currentConversationId !== "undefined"
    ) {
      this.joinConversationRoom();

      if (!this.isConversationLoaded) {
        this.loadMessages();
        this.isConversationLoaded = true;
      } else {
        this.scrollToBottom();
        this.markConversationAsRead();
      }
    } else {
      this.startChat();
    }
  }

  // ============================
  // CONVERSATION
  // ============================
  async startChat() {
    try {
      const response = await fetch("/api/messages/start-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.currentUserId }),
      });

      const data = await response.json();

      if (data.success) {
        this.currentConversationId = data.data._id;
        this.isConversationLoaded = true;
        this.saveConversationId();
        this.joinConversationRoom();
        this.loadMessages();
      }
    } catch (error) {
      alert("Không thể kết nối đến server. Vui lòng thử lại sau.");
    }
  }

  async loadMessages() {
    try {
      const response = await fetch(
        `/api/messages/conversations/${this.currentConversationId}/messages`
      );
      const data = await response.json();

      if (data.success && this.chatMessages) {
        this.chatMessages.innerHTML = "";
        this.showInitialGreeting();

        if (data.data.length > 0) {
          data.data.forEach((msg) => this.displayMessage(msg));
        }

        this.scrollToBottom();
        this.markConversationAsRead();
      }
    } catch (error) {
      this.showInitialGreeting();
    }
  }

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
      // Silent fail
    }
  }

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

    this.isConversationLoaded = false;
  }

  resetConversation() {
    this.leaveConversationRoom();
    this.clearStoredData();

    this.currentConversationId = null;
    this.isConversationLoaded = false;
    this.hasShownGreeting = false;

    if (this.chatMessages) this.chatMessages.innerHTML = "";

    if (this.chatInput) {
      this.chatInput.value = "";
      this.chatInput.disabled = false;
      this.chatInput.placeholder = "Nhập tin nhắn...";
    }

    if (this.sendChatBtn) this.sendChatBtn.disabled = false;
  }

  // ============================
  // MESSAGES
  // ============================
  async sendMessage() {
    const content = this.chatInput?.value.trim();
    if (!content || !this.currentConversationId) return;

    const isFirstMessage =
      !this.chatMessages?.querySelectorAll(".message.user").length;

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: this.currentConversationId,
          content,
          senderType: "customer",
          senderId: this.currentUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (this.chatInput) this.chatInput.value = "";
        this.stopTyping();

        if (isFirstMessage) {
          setTimeout(() => this.showWaitingMessage(), 500);
        }
      }
    } catch (error) {
      alert("Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
    }
  }

  displayMessage(message) {
    if (!this.chatMessages) return;

    const isUserMessage = message.senderType === "customer";
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

  markMessageAsRead(messageId) {
    const msgEl = document.getElementById(`msg-${messageId}`);
    if (msgEl) msgEl.classList.add("read");
  }

  showInitialGreeting() {
    if (!this.chatMessages || this.hasShownGreeting) return;

    this.hasShownGreeting = true;
    this.saveGreetingState();

    const greetingDiv = document.createElement("div");
    greetingDiv.className = "message bot greeting-message";
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

  showWaitingMessage() {
    if (!this.chatMessages) return;

    if (this.typingIndicator) {
      this.typingIndicator.classList.add("active");
      this.typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
    }

    setTimeout(() => {
      if (this.typingIndicator) {
        this.typingIndicator.classList.remove("active");
        this.typingIndicator.innerHTML = "";
      }

      const waitingDiv = document.createElement("div");
      waitingDiv.className = "message bot waiting-message";
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

  // ============================
  // TYPING INDICATOR
  // ============================
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
    this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
  }

  stopTyping() {
    if (!this.currentConversationId || !this.socket || !this.isTyping) return;

    this.isTyping = false;
    this.socket.emit("typing:stop", {
      conversationId: this.currentConversationId,
      userId: this.currentUserId,
    });
  }

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

  hideTypingIndicator(data) {
    if (!this.typingIndicator) return;

    setTimeout(() => {
      this.typingIndicator.classList.remove("active");
      this.typingIndicator.innerHTML = "";
    }, 500);
  }

  // ============================
  // UTILITIES
  // ============================
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom() {
    if (this.chatMessages) {
      setTimeout(() => {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }, 100);
    }
  }
}

// ============================
// INITIALIZATION
// ============================
function initializeRealtimeChat() {
  if (window.realtimeChat) return;

  const chatWindow = document.getElementById("chatWindow");
  const openBtn = document.getElementById("open-message");

  if (!chatWindow || !openBtn) {
    setTimeout(initializeRealtimeChat, 100);
    return;
  }

  try {
    window.realtimeChat = new RealtimeMessagingCustomer();
  } catch (error) {
    console.error("[Chatbox-realtime] Error:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeRealtimeChat);
} else {
  setTimeout(initializeRealtimeChat, 100);
}
