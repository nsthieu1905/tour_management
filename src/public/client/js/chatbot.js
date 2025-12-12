/**
 * Chatbot Client Handler
 * Quản lý giao diện và tương tác với API chatbot
 */

class ChatbotHandler {
  constructor() {
    this.apiBaseUrl = "/api/chatbot";
    this.conversationHistory = [];
    this.isLoading = false;
    this.currentTourId = null;

    this.initElements();
    this.attachEventListeners();
    // this.loadInitialQuickReplies();
  }

  /**
   * Khởi tạo các phần tử DOM
   */
  initElements() {
    this.modal = document.getElementById("chatbotModal");
    this.messagesContainer = document.getElementById("chatbotMessages");
    this.inputField = document.getElementById("chatbotInput");
    this.form = document.getElementById("chatbotForm");
    this.closeBtn = document.getElementById("chatbotClose");
    this.quickRepliesContainer = document.getElementById("quickReplies");
    this.sendBtn = this.form.querySelector(".chatbot-send-btn");
  }

  /**
   * Gắn các sự kiện
   */
  attachEventListeners() {
    // Submit form
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Close button
    this.closeBtn.addEventListener("click", () => {
      this.closeModal();
    });

    // Input focus
    this.inputField.addEventListener("focus", () => {
      this.hideQuickReplies();
    });

    this.inputField.addEventListener("blur", () => {
      if (
        !this.inputField.value.trim() &&
        this.conversationHistory.length > 1
      ) {
        this.showQuickReplies();
      }
    });
  }

  /**
   * Tải quick replies ban đầu
   */
  // async loadInitialQuickReplies() {
  //   try {
  //     const response = await fetch(`${this.apiBaseUrl}/quick-replies`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.success && data.data) {
  //         this.updateQuickReplies(data.data);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error loading quick replies:", error);
  //   }
  // }

  /**
   * Gửi tin nhắn
   */
  async sendMessage() {
    const message = this.inputField.value.trim();

    if (!message) return;

    // Xóa input
    this.inputField.value = "";
    this.hideQuickReplies();

    // Thêm tin nhắn user vào UI
    this.addMessageToUI(message, "user");

    // Thêm vào lịch sử
    this.conversationHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Hiển thị typing indicator
    this.showTypingIndicator();
    this.sendBtn.disabled = true;

    try {
      let response;

      // Xác định loại request
      if (this.currentTourId) {
        // Hỏi về tour cụ thể
        response = await fetch(`${this.apiBaseUrl}/tour-inquiry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            tourId: this.currentTourId,
            conversationHistory: this.conversationHistory.slice(0, -1),
          }),
        });
      } else {
        // Chat cơ bản
        response = await fetch(`${this.apiBaseUrl}/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            conversationHistory: this.conversationHistory.slice(0, -1),
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ẩn typing indicator
      this.removeTypingIndicator();

      if (data.success) {
        const botMessage = data.data.message;
        const isMarkdown = data.data.isMarkdown || false;

        // Thêm vào lịch sử
        this.conversationHistory.push({
          role: "assistant",
          parts: [{ text: botMessage }],
        });

        // Thêm vào UI
        this.addMessageToUI(botMessage, "bot", isMarkdown);

        // Cập nhật quick replies nếu có
        if (data.data.quickReplies) {
          this.updateQuickReplies(data.data.quickReplies);
        }

        // Scroll xuống
        this.scrollToBottom();
      } else {
        this.addMessageToUI(
          data.message || "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
          "bot"
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      this.removeTypingIndicator();
      this.addMessageToUI(
        "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại! 🙏",
        "bot"
      );
    } finally {
      this.sendBtn.disabled = false;
      this.inputField.focus();
    }
  }

  /**
   * Thêm tin nhắn vào UI
   * Hỗ trợ markdown rendering cho links và bold text
   */
  addMessageToUI(message, type, isMarkdown = false) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${type}-message`;

    const contentEl = document.createElement("div");
    contentEl.className = "message-content";

    const textEl = document.createElement("p");

    if (isMarkdown) {
      // Render markdown: **text** → <strong>, [text](url) → <a href="">
      let html = message
        // Bold: **text** → <strong>text</strong>
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Links: [text](url) → <a href="url" target="_blank">text</a>
        .replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" target="_blank" style="color: #5b6eff; text-decoration: underline;">$1</a>'
        )
        // Line breaks: \n\n → </p><p>, \n → <br>
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>");

      textEl.innerHTML = `<p>${html}</p>`;
    } else {
      textEl.textContent = message;
    }

    contentEl.appendChild(textEl);

    const timeEl = document.createElement("div");
    timeEl.className = "message-time";
    timeEl.textContent = this.getCurrentTime();

    messageEl.appendChild(contentEl);
    messageEl.appendChild(timeEl);

    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  /**
   * Hiển thị typing indicator
   */
  showTypingIndicator() {
    const messageEl = document.createElement("div");
    messageEl.className = "message bot-message typing-indicator-message";
    messageEl.id = "typingIndicator";

    const indicatorEl = document.createElement("div");
    indicatorEl.className = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-dot";
      indicatorEl.appendChild(dot);
    }

    messageEl.appendChild(indicatorEl);
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  /**
   * Ẩn typing indicator
   */
  removeTypingIndicator() {
    const typingEl = document.getElementById("typingIndicator");
    if (typingEl) {
      typingEl.remove();
    }
  }

  /**
   * Cập nhật quick replies
   */
  updateQuickReplies(replies) {
    this.quickRepliesContainer.innerHTML = "";

    if (Array.isArray(replies)) {
      replies.forEach((reply) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quick-reply-btn";
        btn.textContent = reply;
        this.quickRepliesContainer.appendChild(btn);
      });
    }

    this.showQuickReplies();
  }

  /**
   * Hiển thị quick replies
   */
  showQuickReplies() {
    if (this.quickRepliesContainer) {
      this.quickRepliesContainer.style.display = "flex";
    }
  }

  /**
   * Ẩn quick replies
   */
  hideQuickReplies() {
    if (this.quickRepliesContainer) {
      this.quickRepliesContainer.style.display = "none";
    }
  }

  /**
   * Scroll xuống cuối
   */
  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Lấy thời gian hiện tại
   */
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Đóng modal
   */
  closeModal() {
    this.modal.classList.add("hidden");
  }

  /**
   * Mở modal
   */
  openModal() {
    this.modal.classList.remove("hidden");
    this.inputField.focus();
  }

  /**
   * Toggle modal
   */
  toggleModal() {
    if (this.modal.classList.contains("hidden")) {
      this.openModal();
    } else {
      this.closeModal();
    }
  }

  /**
   * Thiết lập tour ID để chat về tour cụ thể
   */
  setTourContext(tourId) {
    this.currentTourId = tourId;
  }

  /**
   * Clear lịch sử chat
   */
  clearHistory() {
    this.conversationHistory = [];
    this.messagesContainer.innerHTML = `
      <div class="message bot-message">
        <div class="message-content">
          <p>Xin chào! Tôi là trợ lý du lịch của bạn. Hôm nay tôi có thể giúp gì cho bạn?</p>
        </div>
        <div class="message-time">${this.getCurrentTime()}</div>
      </div>
    `;
    this.currentTourId = null;
    // this.loadInitialQuickReplies();
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra nếu modal tồn tại
  if (document.getElementById("chatbotModal")) {
    window.chatbotHandler = new ChatbotHandler();

    // Gắn chatbot button nếu tồn tại
    const chatbotBtn = document.getElementById("aiAssistant");
    if (chatbotBtn) {
      chatbotBtn.addEventListener("click", () => {
        window.chatbotHandler.toggleModal();
      });
    }
  }
});

// Export cho use ở các file khác
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChatbotHandler;
}
