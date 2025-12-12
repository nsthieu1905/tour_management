const { GoogleGenAI } = require("@google/genai");

class ChatbotService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY không được tìm thấy trong biến môi trường"
      );
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.model = "gemini-2.5-flash";

    // System prompt cho chatbot tour
    this.systemPrompt = `
Bạn là trợ lý tư vấn du lịch chuyên nghiệp và thân thiện của một công ty tour du lịch Việt Nam.

Nhiệm vụ của bạn:
1. Tư vấn các tour du lịch phù hợp với nhu cầu khách hàng
2. Giải đáp thắc mắc về điểm đến, lịch trình, giá cả
3. Gợi ý các địa điểm du lịch hấp dẫn
4. Cung cấp thông tin về dịch vụ: khách sạn, phương tiện, ẩm thực
5. Hỗ trợ đặt tour và giải đáp chính sách

Phong cách giao tiếp:
- Thân thiện, nhiệt tình và chuyên nghiệp
- Sử dụng emoji phù hợp để tạo cảm giác gần gũi
- Trả lời ngắn gọn, rõ ràng, dễ hiểu
- Luôn hỏi thêm để hiểu rõ nhu cầu khách hàng

Lưu ý:
- Không tư vấn về các vấn đề không liên quan đến du lịch
- Nếu không chắc chắn thông tin, hãy khuyên khách hàng liên hệ hotline
- Luôn kết thúc bằng câu hỏi để tiếp tục hội thoại
`;
  }

  /**
   * Chat cơ bản
   */
  async chat(userMessage, conversationHistory = []) {
    try {
      // Tạo nội dung chat với lịch sử
      const contents = [
        {
          role: "user",
          parts: [{ text: this.systemPrompt }],
        },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
      });

      return response.text;
    } catch (error) {
      console.error("Lỗi chat:", error);
      throw new Error(
        "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau! 🙏"
      );
    }
  }

  /**
   * Chat với thông tin tour cụ thể
   */
  async chatWithTour(userMessage, tourInfo, conversationHistory = []) {
    try {
      const tourContext = this.formatTourInfo(tourInfo);

      const systemPromptWithTour = `
${this.systemPrompt}

Thông tin tour hiện tại mà khách hàng đang quan tâm:
${tourContext}

Hãy sử dụng thông tin này để tư vấn chi tiết cho khách hàng.
`;

      const contents = [
        {
          role: "user",
          parts: [{ text: systemPromptWithTour }],
        },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
      });

      return response.text;
    } catch (error) {
      console.error("Lỗi chat with tour:", error);
      throw new Error(
        "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau! 🙏"
      );
    }
  }

  /**
   * Gợi ý tour dựa trên preferences
   */
  async suggestTours(preferences, availableTours) {
    try {
      const toursInfo = availableTours
        .map((tour) => this.formatTourInfo(tour))
        .join("\n\n---\n\n");

      const prompt = `
Dựa trên sở thích của khách hàng:
${JSON.stringify(preferences, null, 2)}

Danh sách các tour có sẵn:
${toursInfo}

Hãy gợi ý 3 tour phù hợp nhất và giải thích lý do tại sao phù hợp.
Trả lời theo format sau:
1. [Tên tour] - [Lý do phù hợp]
2. [Tên tour] - [Lý do phù hợp]
3. [Tên tour] - [Lý do phù hợp]
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      return response.text;
    } catch (error) {
      console.error("Lỗi suggest tours:", error);
      throw new Error("Không thể gợi ý tour. Vui lòng thử lại! 🙏");
    }
  }

  /**
   * Phân tích ý định của khách hàng
   */
  async analyzeIntent(userMessage) {
    try {
      const prompt = `
Phân tích ý định của khách hàng từ tin nhắn sau: "${userMessage}"

Xác định:
1. Intent (một trong: greeting, tour_inquiry, booking_inquiry, price_inquiry, location_inquiry, other)
2. Entities (các thông tin quan trọng như địa điểm, ngày tháng, số người, ngân sách)
3. Urgency (low, medium, high)

Trả lời dưới dạng JSON:
{
  "intent": "...",
  "entities": {...},
  "urgency": "...",
  "summary": "Tóm tắt ngắn gọn"
}
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      // Parse JSON từ response
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        intent: "other",
        entities: {},
        urgency: "low",
        summary: userMessage,
      };
    } catch (error) {
      console.error("Lỗi analyze intent:", error);
      return {
        intent: "other",
        entities: {},
        urgency: "low",
        summary: userMessage,
      };
    }
  }

  /**
   * Format thông tin tour thành text
   */
  formatTourInfo(tour) {
    return `
📍 Tour: ${tour.name}
💰 Giá: ${this.formatPrice(tour.price)}
⏱️ Thời gian: ${tour.duration}
📅 Khởi hành: ${tour.departureDate || "Linh hoạt"}
👥 Số chỗ: ${tour.availableSeats || "Còn chỗ"}
📝 Mô tả: ${tour.description}
🎯 Điểm nổi bật: ${tour.highlights?.join(", ") || "N/A"}
${tour.included ? `✅ Bao gồm: ${tour.included.join(", ")}` : ""}
${tour.excluded ? `❌ Không bao gồm: ${tour.excluded.join(", ")}` : ""}
`;
  }

  /**
   * Format giá tiền
   */
  formatPrice(price) {
    if (typeof price === "number") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    }
    return price;
  }

  /**
   * Tạo câu trả lời nhanh (quick replies)
   */
  generateQuickReplies(intent) {
    const quickReplies = {
      greeting: [
        "Tư vấn tour du lịch 🌴",
        "Xem tour hot 🔥",
        "Tra cứu đặt tour 📋",
      ],
      tour_inquiry: [
        "Xem chi tiết lịch trình 📅",
        "Hỏi về giá 💰",
        "Đặt tour ngay ✈️",
      ],
      price_inquiry: [
        "Xem tour khác 🔍",
        "Chính sách hủy tour ❌",
        "Đặt tour 📝",
      ],
    };

    return (
      quickReplies[intent] || [
        "Xem các tour 🌏",
        "Liên hệ tư vấn 📞",
        "Về trang chủ 🏠",
      ]
    );
  }
}

module.exports = new ChatbotService();
