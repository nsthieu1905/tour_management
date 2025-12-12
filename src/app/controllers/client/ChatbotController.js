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

      let response;
      let tourData = null;
      let intent = { intent: "other", entities: {}, urgency: "low" };
      let isMarkdown = false;

      // Phân tích câu hỏi bằng Gemini, rồi search DB tour
      const result = await chatbotService.analyzeAndSearchTours(message);

      if (result && result.tours && result.tours.length > 0) {
        // Tìm được tours - trả về format markdown (bold + link)
        tourData = chatbotService.formatTourListJSON(result.tours);
        response = chatbotService.formatTourListHTML(result.tours);
        intent = { intent: "location", entities: {}, urgency: "high" };
        isMarkdown = true; // báo frontend render markdown
      } else {
        // Không tìm được tour phù hợp - báo lỗi + hỏi lại
        response =
          "Xin lỗi, chưa có tour phù hợp với yêu cầu của bạn 😊. Hãy hỏi khác hoặc gọi hotline tư vấn nhé!";
      }

      res.json({
        success: true,
        data: {
          message: response,
          intent: intent,
          tours: tourData,
          isMarkdown: isMarkdown, // Frontend dùng flag này để biết có render markdown
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
        tourInfo = await Tour.findById(tourId);
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
      const tours = await Tour.find({ status: "active" }).lean();

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

  // async getQuickReplies(req, res) {
  //   try {
  //     const quickReplies = {
  //       general: [
  //         "Có những tour nào hot trong tháng này?",

  //         "Tour du lịch biển giá rẻ",

  //         "Tour leo núi cuối tuần",

  //         "Tour team building công ty",
  //       ],

  //       pricing: [
  //         "Tour dưới 3 triệu có gì?",

  //         "Có khuyến mãi gì không?",

  //         "Chính sách hủy tour như thế nào?",
  //       ],

  //       booking: [
  //         "Cách đặt tour?",

  //         "Thanh toán như thế nào?",

  //         "Cần giấy tờ gì để đặt tour?",
  //       ],
  //     };

  //     res.json({
  //       success: true,

  //       data: quickReplies,
  //     });
  //   } catch (error) {
  //     console.error("Error in getQuickReplies:", error);

  //     res.status(500).json({
  //       success: false,

  //       message: "Đã có lỗi xảy ra",
  //     });
  //   }
  // }
}

module.exports = new ChatbotController();
