/**
 * ADMIN-SIDE REALTIME MESSAGING
 * Quản lý tin nhắn realtime cho admin
 */

class AdminRealtimeMessaging {
  constructor() {
    this.socket = null;
    this.adminId = null;
    this.currentConversationId = null;
    this.conversations = [];
    this.messages = [];
    this.isTyping = false;
    this.typingTimeout = null;
    this.currentTab = "all";

    // Các phần tử DOM
    this.conversationsList = document.getElementById("conversationsList");
    this.chatHeaderInfo = document.getElementById("chatHeaderInfo");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messageForm = document.getElementById("messageForm");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.searchInput = document.getElementById("searchConversation");
    this.filterStatus = document.getElementById("filterStatus");
    this.filterPriority = document.getElementById("filterPriority");

    this.init();
  }

  init() {
    this.getAdminId();
    this.attachEventListeners();
    this.initSocket();
    this.loadConversations();
  }

  // Lấy admin ID
  getAdminId() {
    this.adminId =
      localStorage.getItem("adminId") ||
      document.body.dataset.adminId ||
      "admin_" + Math.random().toString(36).substr(2, 9);

    localStorage.setItem("adminId", this.adminId);
  }

  // Khởi tạo Socket.io
  initSocket() {
    if (typeof io === "undefined") {
      return;
    }

    this.socket = io();

    this.socket.on("connect", () => {
      // Admin join room
      this.socket.emit("admin:join", {
        adminId: this.adminId,
      });

      // Tự động join lại tất cả conversations sau khi reconnect
      if (this.conversations.length > 0) {
        this.conversations.forEach((conv) => {
          if (conv._id) {
            this.socket.emit("conversation:join", {
              conversationId: conv._id,
              userId: this.adminId,
              userType: "admin",
            });
          }
        });
      }
    });

    // Lắng nghe tin nhắn mới
    this.socket.on("message:new", (data) => {
      // Kiểm tra nếu tin nhắn thuộc conversation đang mở
      const incomingConvId = String(data.conversationId);
      const currentConvId = String(this.currentConversationId);

      if (incomingConvId === currentConvId) {
        this.addMessageToUI(data);
      }

      // Cập nhật preview trong danh sách
      this.updateConversationInList(incomingConvId);
    });

    // Lắng nghe conversation update
    this.socket.on("conversation:update", (data) => {
      this.updateConversationPreview(data);
    });

    // Typing indicators
    this.socket.on("typing:active", (data) => {
      if (String(data.conversationId) === String(this.currentConversationId)) {
        this.showTypingIndicator(data);
      }
    });

    this.socket.on("typing:inactive", (data) => {
      if (String(data.conversationId) === String(this.currentConversationId)) {
        this.hideTypingIndicator(data);
      }
    });

    // Cuộc hội thoại mới
    this.socket.on("conversation:new", (data) => {
      // Join room ngay khi có conversation mới
      if (data.conversationId) {
        this.socket.emit("conversation:join", {
          conversationId: data.conversationId,
          userId: this.adminId,
          userType: "admin",
        });
      }

      // Reload danh sách
      this.loadConversations();
    });

    // Cuộc hội thoại đóng
    this.socket.on("conversation:closed", (data) => {
      if (String(data.conversationId) === String(this.currentConversationId)) {
        this.handleConversationClosed();
      }
    });
  }

  // Gắn các sự kiện
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

    if (this.messageInput) {
      this.messageInput.addEventListener("input", () => {
        this.handleTyping();
      });
    }

    // Tab filters
    const tabs = document.querySelectorAll("[data-tab]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();

        // Cập nhật UI tab active
        tabs.forEach((t) => {
          t.classList.remove("border-b-2", "border-blue-500", "text-blue-600");
          t.classList.add("border-transparent", "text-gray-600");
        });

        tab.classList.remove("border-transparent", "text-gray-600");
        tab.classList.add("border-b-2", "border-blue-500", "text-blue-600");

        // Cập nhật tab hiện tại
        this.currentTab = tab.dataset.tab;

        // Tải conversations với filter
        this.loadConversations();
      });
    });
  }

  // Tải danh sách conversations
  async loadConversations() {
    try {
      const params = new URLSearchParams();

      if (this.searchInput?.value) {
        params.append("search", this.searchInput.value);
      }

      if (this.filterStatus?.value && this.filterStatus.value !== "") {
        params.append("status", this.filterStatus.value);
      }

      if (this.filterPriority?.value && this.filterPriority.value !== "") {
        params.append("priority", this.filterPriority.value);
      }

      // Filter unread dựa trên tab hiện tại
      if (this.currentTab === "unread") {
        params.append("unreadOnly", "true");
      }

      const url = `/api/messages/conversations?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Validate từng conversation trong response
        const rawConversations = data.data || [];

        this.conversations = rawConversations.filter((conv, index) => {
          if (!conv || !conv._id) {
            return false;
          }

          const id = String(conv._id);

          if (id.length < 20) {
            return false;
          }

          return true;
        });

        this.renderConversationsList();

        // Join vào tất cả rooms ngay sau khi socket connect
        if (this.socket && this.socket.connected) {
          this.conversations.forEach((conv) => {
            if (conv._id) {
              const convId = String(conv._id);
              this.socket.emit("conversation:join", {
                conversationId: convId,
                userId: this.adminId,
                userType: "admin",
              });
            }
          });
        }
      } else {
        throw new Error(data.message || "Failed to load conversations");
      }
    } catch (error) {
      if (this.conversationsList) {
        this.conversationsList.innerHTML = `
          <div class="p-4 text-center text-red-500">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>Lỗi khi tải danh sách</p>
            <p class="text-sm">${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Render danh sách conversations
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

    // Filter ra conversations hợp lệ
    const validConversations = this.conversations.filter((conv) => {
      if (!conv || !conv._id) {
        return false;
      }
      return true;
    });

    this.conversationsList.innerHTML = validConversations
      .map((conv) => this.renderConversationItem(conv))
      .filter((html) => html !== "")
      .join("");

    // Gắn event listeners
    this.conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const convId = item.dataset.conversationId;

          // Validate conversationId từ dataset
          if (!convId || convId === "undefined" || convId === "null") {
            alert("Không thể mở cuộc hội thoại này. Vui lòng thử lại.");
            return;
          }

          this.selectConversation(convId);
        });
      });
  }

  // Render một item conversation
  renderConversationItem(conversation) {
    const unreadCount = conversation.unreadCount?.admin || 0;
    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng";
    const lastMessageTime = this.formatTime(conversation.lastMessageAt);

    // Escape HTML để tránh XSS
    const safeCustomerName = this.escapeHtml(customerName);
    const safeLastMessage = this.escapeHtml(
      conversation.lastMessage || "Không có tin nhắn"
    );

    const conversationId = String(conversation._id || "");

    if (!conversationId || conversationId === "undefined") {
      return "";
    }

    return `
      <div
        class="conversation-item"
        data-conversation-id="${conversationId}"
      >
        <!-- Hàng 1: Tên + Badge -->
        <div class="conversation-header">
          <h3 class="conversation-name">${safeCustomerName}</h3>
          ${
            unreadCount > 0
              ? `<span class="unread-badge">${unreadCount}</span>`
              : ""
          }
        </div>

        <!-- Hàng 2: Nội dung - Thời gian -->
        <div class="conversation-preview">
          <p class="conversation-message">${safeLastMessage}</p>
          <span class="conversation-separator">-</span>
          <span class="conversation-time">${lastMessageTime}</span>
        </div>
      </div>
    `;
  }

  // Chọn một conversation
  async selectConversation(conversationId) {
    // Validate conversationId
    if (
      !conversationId ||
      conversationId === "undefined" ||
      conversationId === "null"
    ) {
      alert("Không thể mở cuộc hội thoại này");
      return;
    }

    // Trim và clean conversationId
    const cleanConversationId = String(conversationId).trim();

    if (cleanConversationId.length < 20) {
      alert("ID cuộc hội thoại không hợp lệ");
      return;
    }

    this.currentConversationId = cleanConversationId;
    this.messages = [];

    // Cập nhật UI
    this.conversationsList
      ?.querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.classList.remove("bg-blue-50");
      });

    const selectedItem = document.querySelector(
      `[data-conversation-id="${cleanConversationId}"]`
    );

    if (selectedItem) {
      selectedItem.classList.add("bg-blue-50");
    }

    // Enable input
    if (this.messageInput) this.messageInput.disabled = false;
    if (this.sendBtn) this.sendBtn.disabled = false;

    // Join room cho conversation này
    if (this.socket) {
      this.socket.emit("conversation:join", {
        conversationId: cleanConversationId,
        userId: this.adminId,
        userType: "admin",
      });
    }

    // Tải tin nhắn
    await this.loadMessages(cleanConversationId);
    this.renderChatHeader();
  }

  // Tải tin nhắn của conversation
  async loadMessages(conversationId) {
    // Kiểm tra conversationId hợp lệ
    if (!conversationId || conversationId === "undefined") {
      return;
    }

    try {
      const url = `/api/messages/conversations/${conversationId}/messages?limit=100&skip=0`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.messages = data.data || [];
        this.renderMessages();
      } else {
        throw new Error(data.message || "Failed to load messages");
      }
    } catch (error) {
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = `
          <div class="text-center text-red-500 py-8">
            <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
            <p>Lỗi khi tải tin nhắn</p>
            <p class="text-sm">${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Render danh sách tin nhắn
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

  // Render một tin nhắn
  renderMessage(message) {
    const isAdmin = message.senderType === "admin";
    const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Xác định tên người gửi
    let senderName;
    if (isAdmin) {
      senderName = "Admin";
    } else {
      if (typeof message.senderId === "object" && message.senderId?.name) {
        senderName = message.senderId.name;
      } else if (typeof message.senderId === "string") {
        senderName = "Khách hàng";
      } else {
        senderName = "Khách hàng";
      }
    }

    return `
      <div class="message-container ${
        isAdmin ? "admin-message" : "client-message"
      }">
        <div class="message-wrapper">
          <div class="message-content">
            ${this.escapeHtml(message.content)}
          </div>
          <div class="message-meta">
            <span class="sender-name">${this.escapeHtml(senderName)}</span>
            <span class="meta-separator">•</span>
            <span class="message-time">${time}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Escape HTML để tránh XSS
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Thêm tin nhắn vào UI
  addMessageToUI(message) {
    if (!this.messagesContainer) return;

    // Kiểm tra tin nhắn đã tồn tại chưa
    const existingMsg = this.messages.find(
      (m) => String(m._id) === String(message._id)
    );
    if (existingMsg) {
      return;
    }

    this.messages.push(message);
    const msgHTML = this.renderMessage(message);
    this.messagesContainer.insertAdjacentHTML("beforeend", msgHTML);
    this.scrollToBottom();
  }

  // Gửi tin nhắn
  async sendMessage() {
    const content = this.messageInput?.value.trim();

    if (!content || !this.currentConversationId) {
      return;
    }

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

        // Sau khi admin reply, reload conversations để cập nhật unread count
        setTimeout(() => {
          this.loadConversations();
        }, 500);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      alert("Lỗi khi gửi tin nhắn: " + error.message);
    }
  }

  // Render header chat
  renderChatHeader() {
    if (!this.chatHeaderInfo) return;

    const conversation = this.conversations.find(
      (c) => String(c._id) === String(this.currentConversationId)
    );

    if (!conversation) {
      return;
    }

    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng";

    this.chatHeaderInfo.innerHTML = `
      <div>
        <h2 class="text-lg font-semibold text-gray-900">${customerName}</h2>
      </div>
    `;
  }

  // Xử lý typing indicator
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

  // Dừng typing
  stopTyping() {
    if (!this.currentConversationId || !this.socket) return;

    this.isTyping = false;
    this.socket.emit("typing:stop", {
      conversationId: this.currentConversationId,
      userId: this.adminId,
    });
  }

  // Hiển thị typing indicator
  showTypingIndicator(data) {
    if (!this.messagesContainer) return;

    const existing = this.messagesContainer.querySelector(".typing-indicator");
    if (existing) existing.remove();

    const typingDiv = document.createElement("div");
    typingDiv.className = "typing-indicator text-xs text-gray-500 p-2";
    typingDiv.innerHTML = `
      <em>${data.userName} đang gõ...</em>
      <span style="margin-left: 4px;">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;

    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  // Ẩn typing indicator
  hideTypingIndicator() {
    const existing = this.messagesContainer?.querySelector(".typing-indicator");
    if (existing) {
      setTimeout(() => existing.remove(), 500);
    }
  }

  // Đóng conversation
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
      alert("Lỗi khi đóng cuộc hội thoại");
    }
  }

  // Xử lý khi conversation bị đóng
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
  }

  // Cập nhật conversation trong danh sách
  updateConversationInList(conversationId) {
    this.loadConversations();
  }

  // Cập nhật conversation preview
  updateConversationPreview(data) {
    const conversation = this.conversations.find(
      (c) => String(c._id) === String(data.conversationId)
    );

    if (conversation) {
      conversation.lastMessage = data.lastMessage;
      conversation.lastMessageAt = data.lastMessageAt;
      this.renderConversationsList();
    }
  }

  // Định dạng thời gian
  formatTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 60) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays === 1) return "1 ngày";
    if (diffDays < 7) return `${diffDays} ngày`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;

    return date.toLocaleDateString("vi-VN");
  }

  // Scroll xuống cuối
  scrollToBottom() {
    if (this.messagesContainer) {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }
  }
}

// Khởi tạo khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  window.adminChat = new AdminRealtimeMessaging();
});
