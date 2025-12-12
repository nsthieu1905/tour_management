/**
 * Chatbot Configuration File
 * Sử dụng file này để customize chatbot
 */

const CHATBOT_CONFIG = {
  // ==================== API Configuration ====================
  API: {
    // Base URL cho API calls
    BASE_URL: "/api/chatbot",

    // Endpoints
    ENDPOINTS: {
      MESSAGE: "/message",
      TOUR_INQUIRY: "/tour-inquiry",
      SUGGEST_TOURS: "/suggest-tours",
      QUICK_REPLIES: "/quick-replies",
    },

    // Timeout cho requests (ms)
    TIMEOUT: 30000,
  },

  // ==================== UI Configuration ====================
  UI: {
    // Modal dimensions
    MODAL_WIDTH: "380px",
    MODAL_HEIGHT: "600px",

    // Colors
    COLORS: {
      PRIMARY: "#667eea",
      SECONDARY: "#764ba2",
      USER_MESSAGE: "#667eea",
      BOT_MESSAGE: "#ffffff",
      BACKGROUND: "#f7f7f7",
      BORDER: "#eee",
      TEXT: "#333",
      TEXT_LIGHT: "#999",
    },

    // Animation settings
    ANIMATION: {
      SLIDE_UP_DURATION: "300ms",
      FADE_IN_DURATION: "300ms",
      TYPING_SPEED: "1.4s",
    },

    // Message display
    SHOW_TIMESTAMP: true,
    TIMESTAMP_FORMAT: "vi-VN", // Locale for date formatting
    AUTO_SCROLL: true,
    SCROLL_DELAY: 0, // ms delay for scroll
  },

  // ==================== Behavior Configuration ====================
  BEHAVIOR: {
    // Auto load quick replies on init
    AUTO_LOAD_QUICK_REPLIES: true,

    // Show quick replies in modal
    SHOW_QUICK_REPLIES: true,

    // Hide quick replies when input is focused
    HIDE_QUICK_REPLIES_ON_FOCUS: true,

    // Enable conversation history
    STORE_CONVERSATION: true,

    // Max messages to store in history
    MAX_HISTORY_LENGTH: 100,

    // Disable input while loading
    DISABLE_INPUT_WHILE_LOADING: true,

    // Clear input after sending
    CLEAR_INPUT_AFTER_SEND: true,

    // Auto focus input when modal opens
    AUTO_FOCUS_INPUT: true,

    // Enable typing indicator
    SHOW_TYPING_INDICATOR: true,

    // Typing indicator animation
    TYPING_ANIMATION_SPEED: 0.2, // seconds per dot
  },

  // ==================== System Prompts ====================
  PROMPTS: {
    // Default greeting message
    GREETING:
      "👋 Xin chào! Tôi là trợ lý du lịch của bạn. Hôm nay tôi có thể giúp gì cho bạn?",

    // Error messages
    ERROR_MESSAGES: {
      EMPTY_INPUT: "Vui lòng nhập tin nhắn",
      API_ERROR: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại!",
      NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra internet.",
      INVALID_INPUT: "Tin nhắn không hợp lệ. Vui lòng thử lại.",
    },

    // Loading states
    TYPING_INDICATOR: "⏳ Đang suy nghĩ...",
  },

  // ==================== Quick Replies Templates ====================
  QUICK_REPLIES: {
    DEFAULT: [
      "Tư vấn tour du lịch 🌴",
      "Xem tour hot 🔥",
      "Tra cứu đặt tour 📋",
    ],

    GREETING: [
      "Tư vấn tour du lịch 🌴",
      "Xem tour hot 🔥",
      "Tra cứu đặt tour 📋",
    ],

    TOUR_INQUIRY: [
      "Xem chi tiết lịch trình 📅",
      "Hỏi về giá 💰",
      "Đặt tour ngay ✈️",
    ],

    PRICE_INQUIRY: [
      "Xem tour khác 🔍",
      "Chính sách hủy tour ❌",
      "Đặt tour 📝",
    ],

    LOCATION_INQUIRY: [
      "Xem tour khác 🌏",
      "Lọc theo ngân sách 💰",
      "Gợi ý tour 🎯",
    ],

    OTHER: ["Xem các tour 🌏", "Liên hệ tư vấn 📞", "Về trang chủ 🏠"],
  },

  // ==================== Emergency Help Configuration ====================
  EMERGENCY: {
    // Show emergency modal
    SHOW_MODAL: true,

    // Support information
    HOTLINE: "1900 123 456",
    EMAIL: "support@travelsmart.com",
    HOURS: "24/7",

    // Quick actions
    ACTIONS: {
      CALL: true,
      EMAIL: true,
      CHAT: true,
    },
  },

  // ==================== Floating Buttons Configuration ====================
  FLOATING_BUTTONS: {
    // Show buttons
    SHOW: true,

    // Button positions
    POSITION: {
      BOTTOM: "24px",
      RIGHT: "24px",
    },

    // Button sizes
    SIZE: "56px",

    // Spacing between buttons
    SPACING: "12px",

    // Colors
    COLORS: {
      AI_ASSISTANT: "#10b981", // Green
      QUICK_BOOKING: "#3b82f6", // Blue
      EMERGENCY: "#ef4444", // Red
    },

    // Tooltips
    TOOLTIPS: {
      AI_ASSISTANT: "Chat với AI",
      QUICK_BOOKING: "Đặt tour nhanh",
      EMERGENCY: "Hỗ trợ khẩn cấp",
    },

    // Mobile settings
    MOBILE: {
      SIZE: "48px",
      POSITION_BOTTOM: "12px",
      POSITION_RIGHT: "12px",
    },
  },

  // ==================== Analytics (Optional) ====================
  ANALYTICS: {
    // Enable analytics
    ENABLED: false,

    // Track events
    TRACK_EVENTS: {
      MODAL_OPEN: true,
      MESSAGE_SENT: true,
      QUICK_REPLY_CLICKED: true,
      INTENT_DETECTED: true,
    },

    // Send to analytics service
    SERVICE_URL: "/api/analytics",
  },

  // ==================== Developer Settings ====================
  DEBUG: {
    // Enable console logs
    ENABLED: false,

    // Log levels: 'all', 'errors', 'none'
    LEVEL: "errors",

    // Show timing information
    SHOW_TIMING: false,

    // Mock API responses (for testing)
    MOCK_API: false,
  },
};

// ==================== Usage Examples ====================

/**
 * Truy cập configuration từ application:
 *
 * 1. Import file này:
 *    <script src="/config/chatbot-config.js"></script>
 *
 * 2. Sử dụng trong chatbot.js:
 *    const apiUrl = CHATBOT_CONFIG.API.BASE_URL + CHATBOT_CONFIG.API.ENDPOINTS.MESSAGE;
 *
 * 3. Custom colors:
 *    document.documentElement.style.setProperty('--primary-color', CHATBOT_CONFIG.UI.COLORS.PRIMARY);
 *
 * 4. Quick replies:
 *    this.updateQuickReplies(CHATBOT_CONFIG.QUICK_REPLIES.GREETING);
 */

// Export cho Node.js environments (nếu cần)
if (typeof module !== "undefined" && module.exports) {
  module.exports = CHATBOT_CONFIG;
}
