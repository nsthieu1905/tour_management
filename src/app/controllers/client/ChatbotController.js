const chatbotService = require("../../../services/ChatbotService");
const { Tour } = require("../../models/index");

// [POST] /api/chatbot/send-message
const sendMessage = async (req, res) => {
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
      isMarkdown = true;
    } else {
      // Không tìm được tour phù hợp
      response =
        "Xin lỗi, chưa có tour phù hợp với yêu cầu của bạn . Hãy hỏi khác hoặc gọi hotline tư vấn nhé!";
    }

    return res.json({
      success: true,
      data: {
        message: response,
        intent: intent,
        tours: tourData,
        isMarkdown: isMarkdown,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [POST] /api/chatbot/tour-inquiry
const tourInquiry = async (req, res) => {
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

    return res.json({
      success: true,
      data: {
        message: response,
        tourInfo: tourInfo,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [POST] /api/chatbot/suggest-tours
const suggestTours = async (req, res) => {
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

    return res.json({
      success: true,
      data: {
        suggestions: suggestions,
        totalTours: tours.length,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  sendMessage,
  tourInquiry,
  suggestTours,
};
