/**
 * Admin Message Manager
 * Quản lý giao diện và tương tác với API messaging
 */

class AdminMessageManager {
  constructor() {
    this.apiBaseUrl = "/api/messages";
    this.conversations = [];
    this.currentConversationId = null;
    this.messages = [];
    this.socket = null;
    this.adminId = this.getAdminIdFromDom();

    this.init();
  }

  /**
   * Khởi tạo
   */
  init() {
    this.initElements();
    this.attachEventListeners();
    this.initializeSocket();
    this.loadConversations();
  }

  /**
   * Khởi tạo các phần tử DOM
   */
  initElements() {
    this.conversationsList = document.getElementById("conversationsList");
    this.chatHeader = document.getElementById("chatHeader");
    this.chatHeaderInfo = document.getElementById("chatHeaderInfo");
    this.chatActions = document.getElementById("chatActions");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messageForm = document.getElementById("messageForm");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.searchInput = document.getElementById("searchConversation");
    this.filterStatus = document.getElementById("filterStatus");
    this.filterPriority = document.getElementById("filterPriority");
    this.closeConversationBtn = document.getElementById("closeConversationBtn");
    this.totalConversations = document.getElementById("totalConversations");
  }

  /**
   * Gắn các sự kiện
   */
  attachEventListeners() {
    // Form submit
    this.messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Search
    this.searchInput.addEventListener("input", () => {
      this.loadConversations();
    });

    // Filter
    this.filterStatus.addEventListener("change", () => {
      this.loadConversations();
    });

    this.filterPriority.addEventListener("change", () => {
      this.loadConversations();
    });

    // Close conversation
    this.closeConversationBtn.addEventListener("click", () => {
      this.closeConversation();
    });
  }

  /**
   * Lấy admin ID từ DOM
   */
  getAdminIdFromDom() {
    return (
      localStorage.getItem("adminId") ||
      document.body.dataset.adminId ||
      document.querySelector("[data-admin-id]")?.dataset.adminId ||
      "admin_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Khởi tạo Socket.io
   */
  initializeSocket() {
    if (typeof io === "undefined") {
      console.warn("Socket.io not available");
      return;
    }

    this.socket = io();

    this.socket.on("connect", () => {
      console.log("[Admin Messages] Connected to socket.io");
      this.socket.emit("admin:join", { adminId: this.adminId });
    });

    // Lắng nghe tin nhắn mới
    this.socket.on("message:new", (data) => {
      if (data.conversationId === this.currentConversationId) {
        this.addMessageToUI(data);
      }
      // Cập nhật danh sách cuộc hội thoại
      this.loadConversations();
    });

    // Lắng nghe cuộc hội thoại mới
    this.socket.on("conversation:new", (data) => {
      this.loadConversations();
    });

    // Lắng nghe cuộc hội thoại được đóng
    this.socket.on("conversation:closed", (conversationId) => {
      if (conversationId === this.currentConversationId) {
        this.currentConversationId = null;
        this.clearChatArea();
        this.loadConversations();
      }
    });
  }

  /**
   * Tải danh sách cuộc hội thoại
   */
  async loadConversations() {
    try {
      const filters = {
        search: this.searchInput.value,
        status: this.filterStatus.value,
        priority: this.filterPriority.value,
      };

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);

      const response = await fetch(
        `${this.apiBaseUrl}/conversations?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        this.conversations = data.data;
        this.renderConversationsList();
        this.totalConversations.textContent = this.conversations.length;
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      this.showNotification("Lỗi khi tải danh sách cuộc hội thoại", "error");
    }
  }

  /**
   * Render danh sách cuộc hội thoại
   */
  renderConversationsList() {
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

    // Gắn event listener cho các item
    this.conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const conversationId = item.dataset.conversationId;
          this.selectConversation(conversationId);
        });
      });
  }

  /**
   * Render một cuộc hội thoại
   */
  renderConversationItem(conversation) {
    const unreadCount = conversation.unreadCount?.admin || 0;
    const lastMessageFrom = conversation.lastMessageFrom || "";
    const lastMessageTime = this.formatTime(conversation.lastMessageAt);

    // Lấy tên khách hàng
    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng không xác định";

    // Badge trạng thái
    const statusBadge =
      {
        active: "bg-green-100 text-green-800",
        closed: "bg-red-100 text-red-800",
        archived: "bg-gray-100 text-gray-800",
      }[conversation.status] || "bg-gray-100 text-gray-800";

    // Priority badge
    const priorityColor =
      {
        urgent: "text-red-600",
        high: "text-orange-600",
        medium: "text-yellow-600",
        low: "text-blue-600",
      }[conversation.priority] || "text-gray-600";

    return `
      <div
        class="conversation-item p-4 border-b border-gray-200 ${
          this.currentConversationId === conversation._id ? "active" : ""
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
              ? `<span class="unread-badge">${unreadCount}</span>`
              : ""
          }
        </div>

        <div class="flex justify-between items-center text-xs">
          <div class="flex gap-2">
            <span class="px-2 py-1 rounded ${statusBadge}">
              ${conversation.status}
            </span>
            <span class="px-2 py-1 ${priorityColor}">
              <i class="fas fa-exclamation-circle"></i> ${conversation.priority}
            </span>
          </div>
          <span class="text-gray-400">${lastMessageTime}</span>
        </div>
      </div>
    `;
  }

  /**
   * Chọn một cuộc hội thoại
   */
  async selectConversation(conversationId) {
    this.currentConversationId = conversationId;
    this.messages = [];

    // Cập nhật UI
    this.conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.classList.remove("active");
      });
    document
      .querySelector(`[data-conversation-id="${conversationId}"]`)
      .classList.add("active");

    // Bật input
    this.messageInput.disabled = false;
    this.sendBtn.disabled = false;
    this.chatActions.style.display = "flex";

    // Tải tin nhắn
    await this.loadMessages(conversationId);
    this.renderChatHeader();
  }

  /**
   * Tải tin nhắn của cuộc hội thoại
   */
  async loadMessages(conversationId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/conversations/${conversationId}/messages`
      );
      const data = await response.json();

      if (data.success) {
        this.messages = data.data || [];
        this.renderMessages();

        // Đánh dấu các tin nhắn đã đọc
        await this.markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      this.showNotification("Lỗi khi tải tin nhắn", "error");
    }
  }

  /**
   * Render tin nhắn
   */
  renderMessages() {
    if (this.messages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-comments text-3xl mb-2"></i>
          <p>Không có tin nhắn</p>
        </div>
      `;
      return;
    }

    this.messagesContainer.innerHTML = this.messages
      .map((msg) => this.renderMessage(msg))
      .join("");

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Render một tin nhắn
   */
  renderMessage(message) {
    const isAdmin = message.senderType === "admin";
    const messageClass = isAdmin ? "admin-message" : "client-message";
    const senderName = message.senderId?.name || "Admin";
    const time = this.formatTime(message.createdAt);

    return `
      <div class="message-container ${messageClass}">
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
   * Gửi tin nhắn
   */
  async sendMessage() {
    const content = this.messageInput.value.trim();

    if (!content || !this.currentConversationId) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: this.currentConversationId,
          content,
          senderType: "admin",
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.messageInput.value = "";
        this.messages.push(data.data);
        this.renderMessages();

        // Broadcast qua socket.io
        if (this.socket) {
          this.socket.emit("message:send", {
            conversationId: this.currentConversationId,
            message: data.data,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      this.showNotification("Lỗi khi gửi tin nhắn", "error");
    }
  }

  /**
   * Thêm tin nhắn vào UI (từ socket.io)
   */
  addMessageToUI(message) {
    this.messages.push(message);
    this.renderMessages();
  }

  /**
   * Render chat header
   */
  renderChatHeader() {
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
   * Đánh dấu cuộc hội thoại đã đọc
   */
  async markConversationAsRead(conversationId) {
    try {
      await fetch(
        `${this.apiBaseUrl}/conversations/${conversationId}/mark-read`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  }

  /**
   * Đóng cuộc hội thoại
   */
  async closeConversation() {
    if (!this.currentConversationId) return;

    // Show modal instead of confirm
    const modal = document.getElementById("closeConversationModal");
    if (modal) {
      modal.classList.remove("hidden");
      // Store conversationId for confirmation
      window.currentClosingConversationId = this.currentConversationId;
      window.adminMessageManager = this;
    }
  }

  /**
   * Confirm close conversation (called from modal)
   */
  async confirmCloseConversation() {
    const conversationId = window.currentClosingConversationId;
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/close`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showNotification("Đã đóng cuộc hội thoại", "success");
        this.currentConversationId = null;
        this.clearChatArea();
        this.loadConversations();

        if (this.socket) {
          this.socket.emit("conversation:closed", {
            conversationId: conversationId,
          });
        }

        // Close modal
        const modal = document.getElementById("closeConversationModal");
        if (modal) {
          modal.classList.add("hidden");
        }
      }
    } catch (error) {
      console.error("Error closing conversation:", error);
      this.showNotification("Lỗi khi đóng cuộc hội thoại", "error");
    }
  }

  /**
   * Clear chat area
   */
  clearChatArea() {
    this.messagesContainer.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-comments text-3xl mb-2"></i>
        <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
      </div>
    `;
    this.messageInput.value = "";
    this.messageInput.disabled = true;
    this.sendBtn.disabled = true;
    this.chatActions.style.display = "none";
    this.chatHeaderInfo.innerHTML = `
      <div class="text-center text-gray-400">
        <i class="fas fa-comments text-4xl mb-2"></i>
        <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
      </div>
    `;
  }

  /**
   * Format thời gian
   */
  formatTime(dateString) {
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
   * Hiển thị notification
   */
  showNotification(message, type = "info") {
    // Có thể tích hợp với notification system của admin
    console.log(`[${type.toUpperCase()}]`, message);
  }
}

// Global function to confirm close from modal
function confirmCloseConversation() {
  if (window.adminMessageManager) {
    window.adminMessageManager.confirmCloseConversation();
  }
}

// Khởi tạo khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  window.adminMessageManager = new AdminMessageManager();
});
