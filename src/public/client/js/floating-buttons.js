/**
 * Floating Action Buttons Handler
 * Quản lý các button: AI Assistant, Quick Booking, Emergency Help
 */

// Load ngay sau khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Delay 100ms để chắc chắn chatbot.js đã khởi tạo window.chatbotHandler
  setTimeout(() => {
    // Hỗ trợ cả hai bộ IDs: từ home.hbs và tour-detail.hbs
    // Home: aiAssistant, open-mesage, contact
    // Tour-detail: aiAssistant, quickBooking, emergencyHelp
    const aiAssistantBtn = document.getElementById("aiAssistant");

    // Quick booking - hỗ trợ cả "open-mesage" (home) và "quickBooking" (tour-detail)
    const quickBookingBtn =
      document.getElementById("open-mesage") ||
      document.getElementById("quickBooking");

    // Emergency/Contact - hỗ trợ cả "contact" (home) và "emergencyHelp" (tour-detail)
    const emergencyHelpBtn =
      document.getElementById("contact") ||
      document.getElementById("emergencyHelp");

    // ESC key để đóng các modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Chat helper được xử lý trong chatbox-realtime.js

        // Đóng floating buttons modal nếu mở
        const modal = document.querySelector(".floating-modal");
        if (modal) {
          modal.remove();
        }
        // Đóng emergency modal nếu mở
        const emergencyModal = document.querySelector(".emergency-modal");
        if (emergencyModal) {
          emergencyModal.remove();
        }
        // Đóng contact modal nếu mở
        const contactModal = document.getElementById("contactModal");
        if (contactModal && contactModal.classList.contains("active")) {
          closeContactModal();
        }
        // Đóng chatbot modal nếu mở
        const chatbotModal = document.getElementById("chatbotModal");
        if (
          window.chatbotHandler &&
          chatbotModal &&
          !chatbotModal.classList.contains("hidden")
        ) {
          window.chatbotHandler.closeModal();
        }
      }
    });

    /**
     * AI Assistant Button - Mở chatbot
     * (Listener đã được gắn trong chatbot.js, không cần thêm ở đây)
     */

    /**
     * Quick Booking Button - Chat với nhân viên
     * QUAN TRỌNG: Không xử lý logic chat ở đây
     * Logic chat được xử lý trong chatbox-realtime.js
     */
    if (quickBookingBtn) {
      console.log("✅ quickBookingBtn found in floating-buttons.js");
      console.log("⚠️ Chat logic handled by chatbox-realtime.js");
      // KHÔNG gắn event listener ở đây để tránh conflict
    }

    /**
     * Emergency Help Button - Hỗ trợ khẩn cấp / Liên hệ
     */
    if (emergencyHelpBtn) {
      emergencyHelpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("🔔 emergencyHelpBtn clicked");

        const contactModal = document.getElementById("contactModal");
        if (contactModal) {
          // Mở contact modal
          openContactModal();
        } else {
          // Nếu không có modal, hiển thị emergency modal
          showEmergencyModal();
        }
      });
    }

    /**
     * Hàm mở chatbot với tin nhắn mẫu
     */
    function openChatbotWithMessage(message) {
      if (!window.chatbotHandler) {
        console.error("❌ chatbotHandler not available");
        return;
      }

      window.chatbotHandler.openModal();
      window.chatbotHandler.inputField.value = message;

      // Gửi message sau khi modal mở hoàn toàn
      setTimeout(() => {
        window.chatbotHandler.sendMessage();
      }, 150);
    }

    /**
     * Contact Modal - Xử lý modal liên hệ
     */
    const contactModal = document.getElementById("contactModal");
    const closeContactBtn = document.getElementById("closeContactBtn");
    const closeContactBtnBottom = document.getElementById(
      "closeContactBtnBottom"
    );

    function openContactModal() {
      if (contactModal) {
        contactModal.classList.add("active");
        contactModal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevent scroll
      }
    }

    function closeContactModal() {
      if (contactModal) {
        contactModal.classList.remove("active");
        contactModal.style.display = "none";
        document.body.style.overflow = ""; // Restore scroll
      }
    }

    if (closeContactBtn) {
      closeContactBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeContactModal();
      });
    }

    if (closeContactBtnBottom) {
      closeContactBtnBottom.addEventListener("click", (e) => {
        e.stopPropagation();
        closeContactModal();
      });
    }

    // Click outside modal to close
    if (contactModal) {
      contactModal.addEventListener("click", (e) => {
        if (e.target === contactModal) {
          closeContactModal();
        }
      });
    }

    /**
     * Modal hỗ trợ khẩn cấp
     */
    function showEmergencyModal() {
      // Xóa modal cũ nếu có
      const oldModal = document.querySelector(".emergency-modal");
      if (oldModal) {
        oldModal.remove();
      }

      const modal = document.createElement("div");
      modal.className =
        "emergency-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]";
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <div class="text-center">
            <div class="text-4xl mb-4">🆘</div>
            <h2 class="text-2xl font-bold mb-4 text-red-600">Hỗ Trợ Khẩn Cấp</h2>
            <p class="text-gray-600 mb-6">Bạn cần hỗ trợ gì?</p>
            
            <div class="space-y-3">
              <a href="tel:19001234" class="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                📞 Gọi Hotline: 1900 1234
              </a>
              <a href="mailto:info@viettravel.com" class="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                📧 Email Hỗ Trợ
              </a>
              <button class="emergency-close-btn w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = "hidden"; // Prevent scroll

      // Đóng modal khi click nút đóng
      const closeBtn = modal.querySelector(".emergency-close-btn");
      closeBtn.addEventListener("click", () => {
        modal.remove();
        document.body.style.overflow = ""; // Restore scroll
      });

      // Đóng modal khi click outside
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
          document.body.style.overflow = ""; // Restore scroll
        }
      });
    }

    /**
     * Hỗ trợ chat về tour cụ thể
     * Gọi hàm này từ tour detail page
     */
    window.openChatbotForTour = function (tourId, tourName) {
      if (window.chatbotHandler) {
        window.chatbotHandler.setTourContext(tourId);
        window.chatbotHandler.openModal();
        window.chatbotHandler.inputField.value = `Tôi muốn hỏi về ${tourName}`;
        setTimeout(() => {
          window.chatbotHandler.sendMessage();
        }, 150);
      }
    };

    /**
     * Khởi động lại chatbot (ví dụ sau khi đặt tour)
     */
    window.resetChatbot = function () {
      if (window.chatbotHandler) {
        window.chatbotHandler.clearHistory();
      }
    };

    // Export functions để sử dụng global
    window.openContactModal = openContactModal;
    window.closeContactModal = closeContactModal;
    window.showEmergencyModal = showEmergencyModal;
    // Chat helper functions được export từ chatbox-realtime.js
  }, 100);
});
