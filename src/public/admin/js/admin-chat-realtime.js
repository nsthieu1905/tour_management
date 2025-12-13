/**
 * ADMIN-SIDE REALTIME MESSAGING
 * Quản lý chat realtime - Admin có thể vào TẤT CẢ phòng conversations
 */

class AdminRealtimeMessaging {
  constructor() {
    console.log("[Admin Chat] Initializing AdminRealtimeMessaging...");
    this.socket = null;
    this.adminId = null;
    this.currentConversationId = null;
    this.conversations = [];
    this.messages = [];
    this.isTyping = false;
    this.typingTimeout = null;

    // DOM elements
    this.conversationsList = document.getElementById("conversationsList");
    this.chatHeaderInfo = document.getElementById("chatHeaderInfo");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messageForm = document.getElementById("messageForm");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.searchInput = document.getElementById("searchConversation");
    this.filterStatus = document.getElementById("filterStatus");
    this.filterPriority = document.getElementById("filterPriority");
    this.closeConversationBtn = document.getElementById("closeConversationBtn");
    this.chatActions = document.getElementById("chatActions");
    this.typingIndicator = null;

    console.log("[Admin Chat] DOM elements loaded:", {
      conversationsList: !!this.conversationsList,
      chatHeaderInfo: !!this.chatHeaderInfo,
      messagesContainer: !!this.messagesContainer,
      messageForm: !!this.messageForm,
      messageInput: !!this.messageInput,
      sendBtn: !!this.sendBtn,
    });

    this.init();
  }

  /**
   * Khởi tạo
   */
  init() {
    this.getAdminId();
    this.attachEventListeners();
    this.initSocket();
    this.loadConversations();
  }

  /**
   * Lấy Admin ID từ DOM hoặc localStorage
   */
  getAdminId() {
    this.adminId =
      localStorage.getItem("adminId") ||
      document.body.dataset.adminId ||
      "admin_" + Math.random().toString(36).substr(2, 9);

    localStorage.setItem("adminId", this.adminId);
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

    this.socket.on("connect", () => {
      console.log("[Admin Chat] Socket connected");

      // Admin join admin room + từng conversation room
      this.socket.emit("admin:join", {
        adminId: this.adminId,
      });

      // Join vào tất cả conversations (để nhập tin ngay)
      this.conversations.forEach((conv) => {
        this.socket.emit("conversation:join", {
          conversationId: conv._id,
          userId: this.adminId,
          userType: "admin",
        });
      });
    });

    // Lắng nghe tin nhắn mới
    this.socket.on("message:new", (data) => {
      // Ensure conversationId is string for comparison
      const incomingConvId = data.conversationId?.toString
        ? data.conversationId.toString()
        : String(data.conversationId);
      const currentConvId = this.currentConversationId?.toString
        ? this.currentConversationId.toString()
        : String(this.currentConversationId);

      console.log("[Admin Chat] Received message:new event", {
        currentConversationId: currentConvId,
        messageConversationId: incomingConvId,
        matches: incomingConvId === currentConvId,
        data,
      });

      if (incomingConvId === currentConvId) {
        this.addMessageToUI(data);
      }

      // Update danh sách cuộc hội thoại
      this.updateConversationInList(incomingConvId);
    });

    // Lắng nghe update conversation (lastMessage)
    this.socket.on("conversation:update", (data) => {
      this.updateConversationPreview(data);
    });

    // Lắng nghe typing indicator
    this.socket.on("typing:active", (data) => {
      if (data.conversationId === this.currentConversationId) {
        this.showTypingIndicator(data);
      }
    });

    this.socket.on("typing:inactive", (data) => {
      this.hideTypingIndicator(data);
    });

    // Lắng nghe cuộc hội thoại mới
    this.socket.on("conversation:new", () => {
      this.loadConversations();
    });

    // Lắng nghe cuộc hội thoại bị đóng
    this.socket.on("conversation:closed", (data) => {
      if (data.conversationId === this.currentConversationId) {
        this.handleConversationClosed();
      }
    });

    this.socket.on("disconnect", () => {
      console.log("[Admin Chat] Socket disconnected");
    });
  }

  /**
   * Gắn event listeners
   */
  attachEventListeners() {
    if (this.messageForm) {
      this.messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.loadConversations();
      });
    }

    if (this.filterStatus) {
      this.filterStatus.addEventListener("change", () => {
        this.loadConversations();
      });
    }

    if (this.filterPriority) {
      this.filterPriority.addEventListener("change", () => {
        this.loadConversations();
      });
    }

    if (this.closeConversationBtn) {
      this.closeConversationBtn.addEventListener("click", () => {
        this.closeConversation();
      });
    }

    if (this.messageInput) {
      this.messageInput.addEventListener("input", () => {
        this.handleTyping();
      });
    }
  }

  /**
   * Tải danh sách cuộc hội thoại
   */
  async loadConversations() {
    try {
      const params = new URLSearchParams();

      if (this.searchInput?.value) {
        params.append("search", this.searchInput.value);
      }

      if (this.filterStatus?.value) {
        params.append("status", this.filterStatus.value);
      }

      if (this.filterPriority?.value) {
        params.append("priority", this.filterPriority.value);
      }

      const response = await fetch(
        `/api/messages/conversations?${params.toString()}`
      );

      const data = await response.json();

      if (data.success) {
        this.conversations = data.data;
        this.renderConversationsList();

        // Join vào tất cả rooms
        this.conversations.forEach((conv) => {
          if (this.socket) {
            this.socket.emit("conversation:join", {
              conversationId: conv._id,
              userId: this.adminId,
              userType: "admin",
            });
          }
        });
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }

  /**
   * Render danh sách cuộc hội thoại
   */
  renderConversationsList() {
    if (!this.conversationsList) return;

    if (this.conversations.length === 0) {
      this.conversationsList.innerHTML = `
        <div class="p-4 text-center text-gray-400">
          <i class="fas fa-inbox text-2xl mb-2"></i>
          <p>Không có cuộc hội thoại</p>
        </div>
      `;
      return;
    }

    this.conversationsList.innerHTML = this.conversations
      .map((conv) => this.renderConversationItem(conv))
      .join("");

    // Gắn event listeners
    this.conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const convId = item.dataset.conversationId;
          this.selectConversation(convId);
        });
      });
  }

  /**
   * Render một cuộc hội thoại
   */
  renderConversationItem(conversation) {
    const unreadCount = conversation.unreadCount?.admin || 0;
    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng";
    const lastMessageTime = this.formatTime(conversation.lastMessageAt);

    return `
      <div
        class="conversation-item p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
          this.currentConversationId === conversation._id
            ? "active bg-blue-50"
            : ""
        }"
        data-conversation-id="${conversation._id}"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 text-sm">${customerName}</h3>
            <p class="text-xs text-gray-600 mt-1 line-clamp-2">${
              conversation.lastMessage || "Không có tin nhắn"
            }</p>
          </div>
          ${
            unreadCount > 0
              ? `<span class="unread-badge bg-red-500 text-white px-2 py-1 rounded-full text-xs">${unreadCount}</span>`
              : ""
          }
        </div>

        <div class="flex justify-between items-center text-xs">
          <span class="px-2 py-1 bg-green-100 text-green-800 rounded">
            ${conversation.status}
          </span>
          <span class="text-gray-400">${lastMessageTime}</span>
        </div>
      </div>
    `;
  }

  /**
   * Chọn cuộc hội thoại
   */
  async selectConversation(conversationId) {
    this.currentConversationId = conversationId;
    this.messages = [];

    // Update UI
    this.conversationsList
      ?.querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.classList.remove("active", "bg-blue-50");
      });

    document
      .querySelector(`[data-conversation-id="${conversationId}"]`)
      ?.classList.add("active", "bg-blue-50");

    // Enable input
    if (this.messageInput) this.messageInput.disabled = false;
    if (this.sendBtn) this.sendBtn.disabled = false;
    if (this.chatActions) this.chatActions.style.display = "flex";

    // Tải tin nhắn
    await this.loadMessages(conversationId);
    this.renderChatHeader();

    // Join room
    if (this.socket) {
      const roomData = {
        conversationId,
        userId: this.adminId,
        userType: "admin",
      };
      console.log("[Admin Chat] Joining room for conversation:", roomData);
      this.socket.emit("conversation:join", roomData);
    }
  }

  /**
   * Tải tin nhắn của cuộc hội thoại
   */
  async loadMessages(conversationId) {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages?limit=100&skip=0`
      );

      const data = await response.json();

      if (data.success) {
        this.messages = data.data || [];
        this.renderMessages();

        // Đánh dấu đã đọc
        await this.markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  /**
   * Render tin nhắn
   */
  renderMessages() {
    if (!this.messagesContainer) return;

    if (this.messages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-comments text-3xl mb-2"></i>
          <p>Chưa có tin nhắn</p>
        </div>
      `;
      return;
    }

    this.messagesContainer.innerHTML = this.messages
      .map((msg) => this.renderMessage(msg))
      .join("");

    this.scrollToBottom();
  }

  /**
   * Render một tin nhắn
   */
  renderMessage(message) {
    const isAdmin = message.senderType === "admin";
    const time = new Date(message.createdAt).toLocaleTimeString("vi-VN");

    const senderName =
      message.senderType === "admin"
        ? "Admin"
        : message.senderId?.name || "Khách hàng";

    return `
      <div class="message-container ${
        isAdmin ? "admin-message" : "client-message"
      }">
        <div style="${isAdmin ? "margin-left: auto" : ""}">
          <div class="message-content">
            ${message.content}
          </div>
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  }

  /**
   * Thêm tin nhắn mới vào UI (realtime)
   */
  addMessageToUI(message) {
    if (!this.messagesContainer) return;

    this.messages.push(message);
    const msgHTML = this.renderMessage(message);
    this.messagesContainer.innerHTML += msgHTML;
    this.scrollToBottom();

    console.log("[Admin Chat] Message added to UI:", message._id);
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage() {
    const content = this.messageInput?.value.trim();

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
          senderType: "admin",
          senderId: this.adminId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (this.messageInput) {
          this.messageInput.value = "";
        }

        this.stopTyping();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Lỗi khi gửi tin nhắn");
    }
  }

  /**
   * Render chat header (tên customer)
   */
  renderChatHeader() {
    if (!this.chatHeaderInfo) return;

    const conversation = this.conversations.find(
      (c) => c._id === this.currentConversationId
    );

    if (!conversation) return;

    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng";
    const customerEmail = participant?.email || "";

    this.chatHeaderInfo.innerHTML = `
      <div>
        <h2 class="text-lg font-semibold text-gray-900">${customerName}</h2>
        <p class="text-sm text-gray-600">${customerEmail}</p>
      </div>
    `;
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
        userId: this.adminId,
        userName: "Admin",
      });
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  /**
   * Dừng typing
   */
  stopTyping() {
    if (!this.currentConversationId || !this.socket) return;

    this.isTyping = false;
    this.socket.emit("typing:stop", {
      conversationId: this.currentConversationId,
      userId: this.adminId,
    });
  }

  /**
   * Hiển thị "đang gõ..."
   */
  showTypingIndicator(data) {
    if (!this.messagesContainer) return;

    // Remove existing typing indicator
    const existing = this.messagesContainer.querySelector(".typing-indicator");
    if (existing) existing.remove();

    const typingDiv = document.createElement("div");
    typingDiv.className = "typing-indicator text-xs text-gray-500 p-2";
    typingDiv.innerHTML = `
      <em>${data.userName} đang gõ...</em>
      <span style="margin-left: 4px;">
        <span></span><span></span><span></span>
      </span>
    `;

    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  /**
   * Ẩn typing indicator
   */
  hideTypingIndicator(data) {
    const existing = this.messagesContainer?.querySelector(".typing-indicator");
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Đánh dấu cuộc hội thoại đã đọc
   */
  async markConversationAsRead(conversationId) {
    try {
      await fetch(`/api/messages/conversations/${conversationId}/mark-read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  /**
   * Đóng cuộc hội thoại
   */
  async closeConversation() {
    if (!this.currentConversationId) return;

    if (!confirm("Bạn chắc chắn muốn đóng cuộc hội thoại này?")) return;

    try {
      const response = await fetch(
        `/api/messages/conversations/${this.currentConversationId}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId: this.adminId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        this.handleConversationClosed();
        this.loadConversations();
      }
    } catch (error) {
      console.error("Error closing conversation:", error);
      alert("Lỗi khi đóng cuộc hội thoại");
    }
  }

  /**
   * Xử lý cuộc hội thoại bị đóng
   */
  handleConversationClosed() {
    this.currentConversationId = null;

    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-ban text-3xl mb-2"></i>
          <p>Cuộc hội thoại đã bị đóng</p>
        </div>
      `;
    }

    if (this.messageInput) this.messageInput.disabled = true;
    if (this.sendBtn) this.sendBtn.disabled = true;
    if (this.chatActions) this.chatActions.style.display = "none";
  }

  /**
   * Update conversation trong danh sách
   */
  updateConversationInList(conversationId) {
    const conversation = this.conversations.find(
      (c) => c._id === conversationId
    );
    if (conversation) {
      // Re-render list (hoặc có thể update partial)
      this.renderConversationsList();
    }
  }

  /**
   * Update preview cuộc hội thoại
   */
  updateConversationPreview(data) {
    const conversation = this.conversations.find(
      (c) => c._id === data.conversationId
    );
    if (conversation) {
      conversation.lastMessage = data.lastMessage;
      conversation.lastMessageAt = data.lastMessageAt;
      this.renderConversationsList();
    }
  }

  /**
   * Format thời gian
   */
  formatTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("vi-VN");
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.adminChat = new AdminRealtimeMessaging();
});
