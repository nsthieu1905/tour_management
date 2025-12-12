const chatbotService = require("../../../services/ChatbotService");
const { Tour } = require("../../models/index");
class ChatbotController {
  /**
   * POST /api/chatbot/message
   * Chat cơ bản
   */
  async sendMessage(req, res) {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tin nhắn",
        });
      }

      // Phân tích ý định
      const intent = await chatbotService.analyzeIntent(message);

      // Lấy response từ chatbot
      const response = await chatbotService.chat(message, conversationHistory);

      // Tạo quick replies
      const quickReplies = chatbotService.generateQuickReplies(intent.intent);

      res.json({
        success: true,
        data: {
          message: response,
          intent: intent,
          quickReplies: quickReplies,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Đã có lỗi xảy ra",
      });
    }
  }

  /**
   * POST /api/chatbot/tour-inquiry
   * Chat với thông tin tour cụ thể
   */
  async tourInquiry(req, res) {
    try {
      const { message, tourId, conversationHistory = [] } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tin nhắn",
        });
      }

      let tourInfo = null;

      // Lấy thông tin tour từ database
      if (tourId) {
        // Uncomment khi có model Tour
        // tourInfo = await Tour.findById(tourId);

        // Mock data để test
        tourInfo = {
          name: "Tour Hạ Long 2N1Đ",
          price: 2500000,
          duration: "2 ngày 1 đêm",
          description: "Khám phá vịnh Hạ Long - Di sản thiên nhiên thế giới",
          highlights: ["Hang Sửng Sốt", "Đảo Titop", "Làng chài Cửa Vạn"],
          included: ["Khách sạn 3 sao", "Ăn uống", "Vé tham quan"],
          excluded: ["Vé máy bay", "Chi phí cá nhân"],
        };
      }

      // Chat với context tour
      const response = await chatbotService.chatWithTour(
        message,
        tourInfo,
        conversationHistory
      );

      res.json({
        success: true,
        data: {
          message: response,
          tourInfo: tourInfo,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error in tourInquiry:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Đã có lỗi xảy ra",
      });
    }
  }

  /**
   * POST /api/chatbot/suggest-tours
   * Gợi ý tour phù hợp
   */
  async suggestTours(req, res) {
    try {
      const { preferences } = req.body;

      if (!preferences) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp thông tin sở thích",
        });
      }

      // Lấy danh sách tour từ database
      // const tours = await Tour.find({ status: 'active' });

      // Mock data để test
      const tours = [
        {
          name: "Tour Hạ Long 2N1Đ",
          price: 2500000,
          duration: "2 ngày 1 đêm",
          description: "Vịnh Hạ Long - Di sản thiên nhiên",
          highlights: ["Hang Sửng Sốt", "Đảo Titop"],
        },
        {
          name: "Tour Sapa 3N2Đ",
          price: 3200000,
          duration: "3 ngày 2 đêm",
          description: "Chinh phục đỉnh Fansipan",
          highlights: ["Fansipan", "Thác Bạc", "Bản Cát Cát"],
        },
        {
          name: "Tour Phú Quốc 4N3Đ",
          price: 4500000,
          duration: "4 ngày 3 đêm",
          description: "Đảo ngọc Phú Quốc",
          highlights: ["Bãi Sao", "Vinpearl Land", "Chợ đêm"],
        },
      ];

      const suggestions = await chatbotService.suggestTours(preferences, tours);

      res.json({
        success: true,
        data: {
          suggestions: suggestions,
          totalTours: tours.length,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error in suggestTours:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Đã có lỗi xảy ra",
      });
    }
  }

  /**
   * GET /api/chatbot/quick-replies
   * Lấy danh sách câu hỏi gợi ý
   */
  async getQuickReplies(req, res) {
    try {
      const quickReplies = {
        general: [
          "Có những tour nào hot trong tháng này? 🔥",
          "Tour du lịch biển giá rẻ 🏖️",
          "Tour leo núi cuối tuần ⛰️",
          "Tour team building công ty 👥",
        ],
        pricing: [
          "Tour dưới 3 triệu có gì? 💰",
          "Có khuyến mãi gì không? 🎁",
          "Chính sách hủy tour như thế nào? ❌",
        ],
        booking: [
          "Cách đặt tour? 📝",
          "Thanh toán như thế nào? 💳",
          "Cần giấy tờ gì để đặt tour? 📄",
        ],
      };

      res.json({
        success: true,
        data: quickReplies,
      });
    } catch (error) {
      console.error("Error in getQuickReplies:", error);
      res.status(500).json({
        success: false,
        message: "Đã có lỗi xảy ra",
      });
    }
  }
}

module.exports = new ChatbotController();
