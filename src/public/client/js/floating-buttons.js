/**
 * Floating Action Buttons Handler
 * Quản lý các button: AI Assistant, Quick Booking, Emergency Help
 */

document.addEventListener("DOMContentLoaded", () => {
  const quickBookingBtn = document.getElementById("quickBooking");
  const emergencyHelpBtn = document.getElementById("emergencyHelp");

  /**
   * Quick Booking Button - Đặt tour nhanh
   */
  if (quickBookingBtn) {
    quickBookingBtn.addEventListener("click", () => {
      // Nếu user đã login
      if (window.chatbotHandler) {
        window.chatbotHandler.openModal();
        window.chatbotHandler.inputField.value = "Tôi muốn đặt tour ngay! 🎉";
        // Gửi message
        setTimeout(() => {
          window.chatbotHandler.sendMessage();
        }, 100);
      } else {
        // Redirect đến trang booking
        window.location.href = "/bookings";
      }
    });
  }

  /**
   * Emergency Help Button - Hỗ trợ khẩn cấp
   */
  if (emergencyHelpBtn) {
    emergencyHelpBtn.addEventListener("click", () => {
      // Mở modal chatbot và gửi tin nhắn hỗ trợ
      if (window.chatbotHandler) {
        window.chatbotHandler.openModal();
        window.chatbotHandler.inputField.value = "Tôi cần hỗ trợ khẩn cấp! 🆘";
        setTimeout(() => {
          window.chatbotHandler.sendMessage();
        }, 100);
      } else {
        // Hiển thị modal hỗ trợ hoặc gọi hotline
        showEmergencyModal();
      }
    });
  }

  /**
   * Modal hỗ trợ khẩn cấp
   */
  function showEmergencyModal() {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div class="text-center">
          <div class="text-4xl mb-4">🆘</div>
          <h2 class="text-2xl font-bold mb-4 text-red-600">Hỗ Trợ Khẩn Cấp</h2>
          <p class="text-gray-600 mb-6">Bạn cần hỗ trợ gì?</p>
          
          <div class="space-y-3">
            <a href="tel:1900123456" class="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">
              📞 Gọi Hotline: 1900 123 456
            </a>
            <a href="mailto:support@travelsmart.com" class="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              📧 Email Hỗ Trợ
            </a>
            <button onclick="this.closest('div').parentElement.remove()" class="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Đóng modal khi click outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
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
      }, 100);
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
});
