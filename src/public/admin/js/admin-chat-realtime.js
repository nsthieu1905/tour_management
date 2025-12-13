/**
 * ADMIN-SIDE REALTIME MESSAGING (FIXED)
 * - Fix lỗi 500 khi load messages
 * - Fix không nhận tin nhắn realtime
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

    console.log("[Admin Chat] DOM elements loaded:", {
      conversationsList: !!this.conversationsList,
      messagesContainer: !!this.messagesContainer,
      messageForm: !!this.messageForm,
    });

    this.init();
  }

  init() {
    this.getAdminId();
    this.attachEventListeners();
    this.initSocket();
    this.loadConversations();
  }

  getAdminId() {
    this.adminId =
      localStorage.getItem("adminId") ||
      document.body.dataset.adminId ||
      "admin_" + Math.random().toString(36).substr(2, 9);

    localStorage.setItem("adminId", this.adminId);
    console.log("[Admin Chat] Admin ID:", this.adminId);
  }

  initSocket() {
    if (typeof io === "undefined") {
      console.warn("[Admin Chat] Socket.io not available");
      return;
    }

    this.socket = io();

    this.socket.on("connect", () => {
      console.log("[Admin Chat] Socket connected:", this.socket.id);

      // Admin join admin room
      this.socket.emit("admin:join", {
        adminId: this.adminId,
      });

      // 🔴 FIX: Auto re-join tất cả conversations sau khi reconnect
      if (this.conversations.length > 0) {
        console.log(
          "[Admin Chat] Re-joining all conversation rooms after connect"
        );
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

    // 🔴 FIX: Lắng nghe tin nhắn mới
    this.socket.on("message:new", (data) => {
      console.log("[Admin Chat] Received message:new", data);

      // Kiểm tra nếu tin nhắn thuộc conversation đang mở
      const incomingConvId = String(data.conversationId);
      const currentConvId = String(this.currentConversationId);

      console.log("[Admin Chat] Comparing:", {
        incoming: incomingConvId,
        current: currentConvId,
        matches: incomingConvId === currentConvId,
      });

      if (incomingConvId === currentConvId) {
        console.log("[Admin Chat] Adding message to UI");
        this.addMessageToUI(data);
      } else {
        console.log("[Admin Chat] Message not for current conversation");
      }

      // Update preview trong danh sách
      this.updateConversationInList(incomingConvId);
    });

    // Lắng nghe conversation update
    this.socket.on("conversation:update", (data) => {
      console.log("[Admin Chat] Conversation updated:", data);
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
      console.log("[Admin Chat] New conversation created:", data);

      // 🔴 FIX: Join room ngay khi có conversation mới
      if (data.conversationId) {
        console.log(
          "[Admin Chat] Auto-joining new conversation room:",
          data.conversationId
        );
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
      console.log("[Admin Chat] Conversation closed:", data);
      if (String(data.conversationId) === String(this.currentConversationId)) {
        this.handleConversationClosed();
      }
    });

    this.socket.on("disconnect", () => {
      console.log("[Admin Chat] Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Admin Chat] Socket connection error:", error);
    });
  }

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

      const url = `/api/messages/conversations?${params.toString()}`;
      console.log("[Admin Chat] Loading conversations from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("[Admin Chat] Raw API response:", data);

      if (data.success) {
        // 🔴 FIX: Validate từng conversation trong response
        const rawConversations = data.data || [];
        console.log(
          "[Admin Chat] Raw conversations count:",
          rawConversations.length
        );

        this.conversations = rawConversations.filter((conv, index) => {
          if (!conv || !conv._id) {
            console.error(
              `[Admin Chat] Conversation ${index} missing _id:`,
              conv
            );
            return false;
          }

          const id = String(conv._id);
          console.log(
            `[Admin Chat] Conversation ${index}: _id = "${id}" (length: ${id.length})`
          );

          if (id.length < 20) {
            console.error(
              `[Admin Chat] Conversation ${index} has invalid _id (too short):`,
              id
            );
            return false;
          }

          return true;
        });

        console.log(
          "[Admin Chat] Valid conversations:",
          this.conversations.length
        );

        this.renderConversationsList();

        // Join vào TẤT CẢ rooms ngay sau khi socket connect
        if (this.socket && this.socket.connected) {
          this.conversations.forEach((conv) => {
            if (conv._id) {
              const convId = String(conv._id);
              console.log("[Admin Chat] Auto-joining room:", convId);
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
      console.error("[Admin Chat] Error loading conversations:", error);

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

    // 🔴 FIX: Filter ra conversations hợp lệ
    const validConversations = this.conversations.filter((conv) => {
      if (!conv || !conv._id) {
        console.error("[Admin Chat] Invalid conversation:", conv);
        return false;
      }
      return true;
    });

    this.conversationsList.innerHTML = validConversations
      .map((conv) => this.renderConversationItem(conv))
      .filter((html) => html !== "") // Remove empty strings
      .join("");

    // Gắn event listeners
    this.conversationsList
      .querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const convId = item.dataset.conversationId;

          // 🔴 FIX: Validate conversationId từ dataset
          if (!convId || convId === "undefined" || convId === "null") {
            console.error(
              "[Admin Chat] Invalid conversationId from dataset:",
              convId
            );
            alert("Không thể mở cuộc hội thoại này. Vui lòng thử lại.");
            return;
          }

          console.log("[Admin Chat] Conversation clicked:", convId);
          this.selectConversation(convId);
        });
      });
  }

  renderConversationItem(conversation) {
    const unreadCount = conversation.unreadCount?.admin || 0;
    const participant = conversation.participantIds?.[0];
    const customerName = participant?.name || "Khách hàng";
    const lastMessageTime = this.formatTime(conversation.lastMessageAt);
    const isActive =
      String(this.currentConversationId) === String(conversation._id);

    // 🔴 FIX: Escape HTML trong customerName để tránh XSS và lỗi render
    const safeCustomerName = this.escapeHtml(customerName);
    const safeLastMessage = this.escapeHtml(
      conversation.lastMessage || "Không có tin nhắn"
    );

    // 🔴 FIX: Đảm bảo conversationId là string hợp lệ
    const conversationId = String(conversation._id || "");

    if (!conversationId || conversationId === "undefined") {
      console.error("[Admin Chat] Invalid conversation._id:", conversation);
      return "";
    }

    return `
      <div
        class="conversation-item p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
          isActive ? "active bg-blue-50" : ""
        }"
        data-conversation-id="${conversationId}"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 text-sm">${safeCustomerName}</h3>
            <p class="text-xs text-gray-600 mt-1 line-clamp-2">${safeLastMessage}</p>
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

  async selectConversation(conversationId) {
    // 🔴 FIX: Debug và validate conversationId chi tiết
    console.log("[Admin Chat] selectConversation called with:", {
      conversationId,
      type: typeof conversationId,
      length: conversationId?.length,
      value: conversationId,
    });

    // Validate conversationId
    if (
      !conversationId ||
      conversationId === "undefined" ||
      conversationId === "null"
    ) {
      console.error("[Admin Chat] Invalid conversationId:", conversationId);
      alert("Không thể mở cuộc hội thoại này");
      return;
    }

    // 🔴 FIX: Trim và clean conversationId
    const cleanConversationId = String(conversationId).trim();

    if (cleanConversationId.length < 20) {
      console.error(
        "[Admin Chat] ConversationId too short:",
        cleanConversationId
      );
      alert("ID cuộc hội thoại không hợp lệ");
      return;
    }

    console.log("[Admin Chat] Selecting conversation:", cleanConversationId);

    this.currentConversationId = cleanConversationId;
    this.messages = [];

    // Update UI
    this.conversationsList
      ?.querySelectorAll(".conversation-item")
      .forEach((item) => {
        item.classList.remove("active", "bg-blue-50");
      });

    const selectedItem = document.querySelector(
      `[data-conversation-id="${cleanConversationId}"]`
    );

    console.log("[Admin Chat] Selected item found:", !!selectedItem);

    if (selectedItem) {
      selectedItem.classList.add("active", "bg-blue-50");
    }

    // Enable input
    if (this.messageInput) this.messageInput.disabled = false;
    if (this.sendBtn) this.sendBtn.disabled = false;
    if (this.chatActions) this.chatActions.style.display = "flex";

    // Join room cho conversation này
    if (this.socket) {
      console.log(
        "[Admin Chat] Joining conversation room:",
        cleanConversationId
      );
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

  async loadMessages(conversationId) {
    // 🔴 FIX: Kiểm tra conversationId hợp lệ
    if (!conversationId || conversationId === "undefined") {
      console.error(
        "[Admin Chat] Cannot load messages - invalid conversationId"
      );
      return;
    }

    try {
      // 🔴 FIX: URL chính xác không có // liên tiếp
      const url = `/api/messages/conversations/${conversationId}/messages?limit=100&skip=0`;
      console.log("[Admin Chat] Loading messages from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[Admin Chat] Messages loaded:", data);

      if (data.success) {
        this.messages = data.data || [];
        this.renderMessages();

        // Đánh dấu đã đọc
        await this.markConversationAsRead(conversationId);
      } else {
        throw new Error(data.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("[Admin Chat] Error loading messages:", error);

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

  renderMessage(message) {
    const isAdmin = message.senderType === "admin";
    const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Handle senderId có thể là object (User) hoặc string (guest)
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

    // 🔴 FIX: Render tin nhắn không bị dọc
    return `
      <div class="message-container ${
        isAdmin ? "admin-message" : "client-message"
      }">
        <div style="max-width: 70%; ${isAdmin ? "margin-left: auto;" : ""}">
          <div class="message-content">
            ${this.escapeHtml(message.content)}
          </div>
          <div class="message-time">
            ${this.escapeHtml(senderName)} • ${time}
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  addMessageToUI(message) {
    if (!this.messagesContainer) return;

    console.log("[Admin Chat] Adding message to UI:", message);

    // Kiểm tra tin nhắn đã tồn tại chưa
    const existingMsg = this.messages.find(
      (m) => String(m._id) === String(message._id)
    );
    if (existingMsg) {
      console.log("[Admin Chat] Message already exists, skipping");
      return;
    }

    this.messages.push(message);
    const msgHTML = this.renderMessage(message);
    this.messagesContainer.insertAdjacentHTML("beforeend", msgHTML);
    this.scrollToBottom();

    console.log("[Admin Chat] Message added successfully");
  }

  async sendMessage() {
    const content = this.messageInput?.value.trim();

    if (!content || !this.currentConversationId) {
      console.warn("[Admin Chat] Cannot send - no content or conversation");
      return;
    }

    console.log("[Admin Chat] Sending message:", {
      conversationId: this.currentConversationId,
      content,
      senderType: "admin",
      senderId: this.adminId,
    });

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
      console.log("[Admin Chat] Send response:", data);

      if (data.success) {
        if (this.messageInput) {
          this.messageInput.value = "";
        }
        this.stopTyping();
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("[Admin Chat] Error sending message:", error);
      alert("Lỗi khi gửi tin nhắn: " + error.message);
    }
  }

  renderChatHeader() {
    if (!this.chatHeaderInfo) return;

    const conversation = this.conversations.find(
      (c) => String(c._id) === String(this.currentConversationId)
    );

    if (!conversation) {
      console.warn("[Admin Chat] Conversation not found for header");
      return;
    }

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

  stopTyping() {
    if (!this.currentConversationId || !this.socket) return;

    this.isTyping = false;
    this.socket.emit("typing:stop", {
      conversationId: this.currentConversationId,
      userId: this.adminId,
    });
  }

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

  hideTypingIndicator() {
    const existing = this.messagesContainer?.querySelector(".typing-indicator");
    if (existing) {
      setTimeout(() => existing.remove(), 500);
    }
  }

  async markConversationAsRead(conversationId) {
    if (!conversationId) return;

    try {
      await fetch(`/api/messages/conversations/${conversationId}/mark-read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[Admin Chat] Error marking as read:", error);
    }
  }

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
      console.error("[Admin Chat] Error closing conversation:", error);
      alert("Lỗi khi đóng cuộc hội thoại");
    }
  }

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

  updateConversationInList(conversationId) {
    // Reload để cập nhật preview
    this.loadConversations();
  }

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

  scrollToBottom() {
    if (this.messagesContainer) {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Admin Chat] DOM loaded, initializing...");
  window.adminChat = new AdminRealtimeMessaging();
});
