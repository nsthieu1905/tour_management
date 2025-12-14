const { GoogleGenAI } = require("@google/genai");
const { Tour } = require("../app/models/index");

class ChatbotService {
  constructor() {
    const apiKeyStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;

    if (!apiKeyStr) {
      throw new Error(
        "GEMINI_API_KEY hoặc GEMINI_API_KEYS không được tìm thấy trong biến môi trường"
      );
    }

    // Parse API keys: "key1,key2,key3" hoặc single key
    this.apiKeys = apiKeyStr.includes(",")
      ? apiKeyStr.split(",").map((k) => k.trim())
      : [apiKeyStr];

    this.currentKeyIndex = 0;
    this.ai = new GoogleGenAI({
      apiKey: this.apiKeys[this.currentKeyIndex],
    });

    this.model = "gemini-2.5-flash";

    this.systemPrompt = `Bạn là trợ lý tư vấn du lịch thông minh và thân thiện.

# QUY TẮC QUAN TRỌNG
- CHỈ tư vấn dựa trên dữ liệu tour có trong cơ sở dữ liệu
- KHÔNG Google hay tự tạo thông tin không có trong DB
- Nếu không tìm thấy tour phù hợp, thành thật thông báo và gợi ý hỏi cách khác

# HIỂU NGỮ CẢNH CÂU HỎI
Phân tích ý định người dùng qua nhiều góc độ:

**Loại câu hỏi:**
- Hỏi địa điểm: "tour Đà Nẵng", "đi biển", "du lịch núi"
- Hỏi theo nhu cầu: "nghỉ dưỡng", "phượt", "gia đình", "honeymoon"
- Hỏi theo thời gian: "cuối tuần", "dịp lễ", "mùa hè"
- Hỏi theo ngân sách: "tiết kiệm", "cao cấp", "dưới 5 triệu"
- Hỏi kết hợp: "tour biển giá rẻ cho gia đình"

**Từ khóa ngầm định:**
- "thủ đô" → Hà Nội
- "thành phố biển" → Đà Nẵng, Nha Trang, Vũng Tàu
- "đảo ngọc" → Phú Quốc
- "vịnh đẹp nhất thế giới" → Hạ Long
- "cao nguyên" → Đà Lát, Tây Nguyên
- "cố đô" → Huế
- "miền Bắc/Nam/Trung"
- "trong nước/ngoài nước/quốc tế"

**Ngữ cảnh mùa:**
- Xuân (1-3): Miền Bắc, Tây Bắc, lễ hội đầu năm
- Hè (4-6): Biển đảo, nghỉ dưỡng, gia đình
- Thu (7-9): Miền núi, du lịch sinh thái
- Đông (10-12): Miền Nam, Tây Nam Bộ, tránh lạnh

**Phong cách du lịch:**
- Thư giãn: spa, resort, nghỉ dưỡng
- Khám phá: phượt, trekking, mạo hiểm
- Văn hóa: di tích, lịch sử, ẩm thực
- Thiên nhiên: núi, rừng, thác, động
- Đô thị: shopping, vui chơi giải trí

# CÁCH TRẢ LỜI
- Tone thân thiện, tự nhiên như đang tư vấn trực tiếp
- Ngắn gọn, dễ hiểu, không rườm rà
- Dùng emoji vừa phải (1-2 emoji/câu)
- Đưa link tour cụ thể để khách dễ đặt
- Nếu không có tour: gợi ý mở rộng hoặc liên hệ hotline

# XỬ LÝ TRƯỜNG HỢP ĐẶC BIỆT
- Câu hỏi mơ hồ → hỏi lại một cách tự nhiên
- Yêu cầu ngoài phạm vi → lịch sự từ chối và hướng dẫn
- Nhiều lựa chọn → gợi ý 2-3 tour phù hợp nhất

Mục tiêu: Tạo trải nghiệm tư vấn cá nhân hóa, giúp khách tìm tour phù hợp nhanh nhất.`;
  }

  // Rotate API key
  rotateApiKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.ai = new GoogleGenAI({
      apiKey: this.apiKeys[this.currentKeyIndex],
    });
  }

  // Gọi Gemini với retry và rotate key khi lỗi
  async callGeminiWithRetry(prompt, maxRetries = this.apiKeys.length) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
        return response;
      } catch (error) {
        lastError = error;

        // Rotate key nếu còn key khác
        if (attempt < maxRetries - 1) {
          this.rotateApiKey();
        }
      }
    }
    throw lastError;
  }

  // Rotate API key
  rotateApiKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.ai = new GoogleGenAI({
      apiKey: this.apiKeys[this.currentKeyIndex],
    });
  }

  /**
   * Lấy mùa hiện tại để gợi ý tour phù hợp
   * VN: Xuân (1-3), Hè (4-6), Thu (7-9), Đông (10-12)
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return { name: "Xuân", month: "tháng 1-3" };
    if (month >= 4 && month <= 6) return { name: "Hè", month: "tháng 4-6" };
    if (month >= 7 && month <= 9) return { name: "Thu", month: "tháng 7-9" };
    return { name: "Đông", month: "tháng 10-12" };
  }

  /**
   * Search tour thông minh: Dùng Gemini hiểu ý nghĩa, extract keywords → regex search DB
   * Không hard code địa chỉ, chỉ dùng Gemini để hiểu semantic
   * HỖ TRỢ TÌM KIẾM THEO GIÁ
   */
  async analyzeAndSearchTours(userMessage) {
    try {
      // Step 1: Gọi Gemini để hiểu ý nghĩa câu hỏi + extract keywords (NÂNG CẤP)
      const analysisPrompt = `Phân tích câu hỏi du lịch: "${userMessage}"

Trích xuất TẤT CẢ thông tin liên quan:
1. Địa điểm (tên cụ thể, vùng miền, quốc gia)
2. Loại tour (biển, núi, thành phố, văn hóa, ẩm thực...)
3. Đối tượng (gia đình, cặp đôi, một mình, nhóm bạn)
4. Phong cách (nghỉ dưỡng, phượt, cao cấp, tiết kiệm)
5. Thời gian (mùa, dịp lễ, số ngày)
6. Ngân sách (số cụ thể hoặc mức low/medium/high)

**Quan trọng về ngân sách:**
- Nhận diện số tiền: "5tr", "5 triệu", "5000000", "dưới 10 triệu"
- Chuyển đổi: 1tr = 1.000.000, 5tr = 5.000.000, 10tr = 10.000.000
- Các từ khóa: "rẻ"/"tiết kiệm" = dưới 3tr, "bình dân" = 3-7tr, "cao cấp" = trên 10tr

Từ khóa tìm kiếm nên:
- Bao gồm cả từ đồng nghĩa (vd: "thủ đô" → ["thủ đô", "hà nội", "việt nam"])
- Mở rộng vùng địa lý (vd: "biển miền Trung" → ["đà nẵng", "nha trang", "quy nhơn", "phú yên"])
- Thêm loại tour phù hợp với ngữ cảnh

Trả về JSON:
{
  "keywords": ["từ khóa 1", "từ khóa 2", ...],
  "maxPrice": số_tiền_tối_đa_hoặc_null,
  "minPrice": số_tiền_tối_thiểu_hoặc_null,
  "context": {
    "location": "...",
    "tourType": "...",
    "target": "...",
    "style": "...",
    "season": "...",
    "budgetLevel": "low/medium/high/null"
  }
}`;

      const response = await this.callGeminiWithRetry(analysisPrompt);

      // Step 2: Parse keywords và price filter từ Gemini
      let keywords = [];
      let maxPrice = null;
      let minPrice = null;

      try {
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          keywords = parsed.keywords || [];
          maxPrice = parsed.maxPrice || null;
          minPrice = parsed.minPrice || null;
        }
      } catch (e) {
        console.error("[ChatbotService] Parse keywords error:", e);
      }

      // Fallback: nếu Gemini không parse được, extract keywords từ message
      if (keywords.length === 0) {
        const stopWords = [
          "đi",
          "tour",
          "đâu",
          "nào",
          "gì",
          "cái",
          "với",
          "có",
          "không",
          "là",
          "để",
          "mà",
          "nhé",
        ];
        keywords = userMessage
          .toLowerCase()
          .split(/\s+/)
          .filter((k) => k.length > 1 && !stopWords.includes(k));
      }

      // Fallback: Detect price từ message nếu Gemini không parse được
      if (!maxPrice) {
        const priceMatch = userMessage.match(
          /(\d+)\s*(tr|triệu|trieu|k|ngàn|ngan)/i
        );
        if (priceMatch) {
          let amount = parseInt(priceMatch[1]);
          const unit = priceMatch[2].toLowerCase();

          if (unit === "tr" || unit === "triệu" || unit === "trieu") {
            maxPrice = amount * 1000000;
          } else if (unit === "k" || unit === "ngàn" || unit === "ngan") {
            maxPrice = amount * 1000;
          }
        }

        // Detect từ khóa ngân sách
        if (userMessage.match(/\b(rẻ|tiết kiệm|bình dân)\b/i)) {
          maxPrice = maxPrice || 5000000; // mặc định dưới 5tr
        }
      }

      // Step 3: Build query với price filter
      const queryConditions = [];

      // Keyword search
      if (keywords.length > 0) {
        queryConditions.push({
          $or: [
            { destination: { $in: keywords.map((k) => new RegExp(k, "i")) } },
            { name: { $in: keywords.map((k) => new RegExp(k, "i")) } },
            { description: { $in: keywords.map((k) => new RegExp(k, "i")) } },
            { tags: { $in: keywords.map((k) => new RegExp(k, "i")) } },
          ],
        });
      }

      // Price filter
      if (maxPrice) {
        queryConditions.push({
          $or: [
            { discountPrice: { $lte: maxPrice } },
            { $and: [{ discountPrice: null }, { price: { $lte: maxPrice } }] },
          ],
        });
      }

      if (minPrice) {
        queryConditions.push({
          $or: [
            { discountPrice: { $gte: minPrice } },
            { $and: [{ discountPrice: null }, { price: { $gte: minPrice } }] },
          ],
        });
      }

      // Nếu không có điều kiện nào, return null
      if (queryConditions.length === 0) {
        return null;
      }

      // Search DB
      const tours = await Tour.find({
        status: "active",
        $and: queryConditions,
      })
        .select(
          "_id name destination price discountPrice slug tourCode duration images bookingCount description"
        )
        .sort({ bookingCount: -1 })
        .limit(3)
        .lean();

      return tours.length > 0 ? { tours } : null;
    } catch (error) {
      console.error("[ChatbotService] Lỗi search tours:", error);
      return null;
    }
  }

  /**
   * Tìm tour theo location/destination + season (cách cũ - backup)
   * 1 request = analyzeIntent + search (tối ưu token)
   * Return top 3 tours được đặt nhiều nhất
   */
  async searchToursByLocationOptimized(userMessage) {
    try {
      // 1 request: Analyze intent + Extract location trong 1 prompt
      const prompt = `Msg:"${userMessage}"
Extract: location_keyword (chỉ trích tên địa điểm, hoặc null nếu không hỏi địa điểm)
JSON: {location:"..."}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      // Parse location
      let location = null;
      try {
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          location = parsed.location;
        }
      } catch (e) {
        console.error("[ChatbotService] Parse location error:", e);
      }

      // Nếu không detect location, return null
      if (!location || location === "null") {
        return null;
      }

      // Tìm tour có destination matching với location
      const tours = await Tour.find({
        status: "active",
        $or: [
          { destination: new RegExp(location, "i") },
          { name: new RegExp(location, "i") },
          { tags: new RegExp(location, "i") },
          { description: new RegExp(location, "i") },
        ],
      })
        .select(
          "_id name destination price discountPrice slug tourCode duration images bookingCount"
        )
        .sort({ bookingCount: -1 }) // Sort by most booked
        .limit(3) // Limit to top 3
        .lean();

      return tours.length > 0 ? tours : null;
    } catch (error) {
      console.error("[ChatbotService] Lỗi tìm tour:", error);
      return null;
    }
  }

  /**
   * Format tour list Markdown - Thân thiện, không máy móc
   */
  formatTourListHTML(tours, baseUrl = "http://localhost:8386") {
    if (!tours || tours.length === 0) {
      return "Xin lỗi, tôi không tìm được tour phù hợp. Hãy hỏi khác hoặc gọi hotline nhé!";
    }

    const tourList = tours
      .map((tour, idx) => {
        const price = tour.discountPrice ? tour.discountPrice : tour.price;
        const tourDetailUrl = `${baseUrl}/tours/${tour.slug}`;

        return `${idx + 1}. **${tour.name}** - ${this.formatPrice(
          price
        )}\n[Xem chi tiết & Đặt tour →](${tourDetailUrl})`;
      })
      .join("\n\n");

    return `Đây là những tour tuyệt vời cho bạn:\n\n${tourList}\n\nBấm vào để xem chi tiết nha!`;
  }

  /**
   * Format tour list để trả về cho client (có link)
   */
  formatTourListWithLinks(tours, baseUrl = "http://localhost:8386") {
    if (!tours || tours.length === 0) {
      return "Không tìm thấy tour phù hợp";
    }

    const tourList = tours
      .slice(0, 3) // Chỉ lấy 3 tour
      .map((tour, index) => {
        const price = tour.discountPrice ? tour.discountPrice : tour.price;
        const tourDetailUrl = `${baseUrl}/tours/${tour.slug}`;

        return `${index + 1}. [${
          tour.name
        }](${tourDetailUrl}) - ${this.formatPrice(price)}`;
      })
      .join("\n");

    return `Tôi tìm thấy ${tours.length} tour phù hợp:\n\n${tourList}`;
  }

  /**
   * Format tour list simplified (không có markdown link, dùng JSON)
   * Giới hạn 3 tours được đặt nhiều nhất
   */
  formatTourListJSON(tours) {
    if (!tours || tours.length === 0) {
      return {
        success: false,
        message: "Không tìm thấy tour phù hợp",
        tours: [],
      };
    }

    return {
      success: true,
      message: `Tìm thấy ${tours.length} tour phù hợp 🎉`,
      tours: tours.slice(0, 3).map((tour) => ({
        id: tour._id.toString(),
        name: tour.name,
        destination: tour.destination,
        price: tour.price,
        discountPrice: tour.discountPrice,
        duration: tour.duration,
        images: tour.images ? tour.images[0] : null,
        slug: tour.slug,
        tourCode: tour.tourCode,
        bookingCount: tour.bookingCount || 0,
      })),
      total: tours.length,
    };
  }

  /**
   * Chat cơ bản
   */
  async chat(userMessage, conversationHistory = []) {
    try {
      // Tạo nội dung chat với lịch sử
      const contents = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
        systemInstruction: this.systemPrompt,
      });

      return response.text;
    } catch (error) {
      console.error("[ChatbotService] Lỗi chat:", error);
      throw new Error("Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau!");
    }
  }

  /**
   * Chat với tour context - tối ưu hóa
   */
  async chatWithTour(userMessage, tourInfo, conversationHistory = []) {
    try {
      const tourContext = this.formatTourInfo(tourInfo, false);

      // Chỉ thêm tour context nếu cần (tiết kiệm token)
      const systemPromptWithTour = `${this.systemPrompt}

Tour: ${tourContext}

Tư vấn chi tiết dựa trên thông tin trên.`;

      const contents = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
        systemInstruction: systemPromptWithTour,
      });

      return response.text;
    } catch (error) {
      console.error("[ChatbotService] Lỗi chat with tour:", error);
      throw new Error("Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau!");
    }
  }

  /**
   * Gợi ý tour tối ưu - lọc trước, gửi ít dữ liệu hơn
   */
  async suggestTours(preferences, availableTours) {
    try {
      // LỌC TRƯỚC: chỉ gữi 5-6 tour phù hợp (thay vì tất cả)
      const filteredTours = this.filterToursQuick(
        preferences,
        availableTours
      ).slice(0, 6);

      const toursInfo = filteredTours
        .map((tour) => this.formatTourInfo(tour, true)) // true = minimal format
        .join(" | ");

      const prompt = `Preferences: ${JSON.stringify(preferences, null, 0).slice(
        0,
        100
      )}

Tours: ${toursInfo}

Pick 3 best matches with 1-line reason each.`;

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
      console.error("[ChatbotService] Lỗi suggest tours:", error);
      throw new Error("Không thể gợi ý tour. Vui lòng thử lại!");
    }
  }

  /**
   * Lọc nhanh tour trước khi gửi cho AI (tiết kiệm 50-70% token)
   */
  filterToursQuick(preferences, tours) {
    return tours.filter((tour) => {
      const matchDestination =
        !preferences.destination ||
        tour.destination
          ?.toLowerCase()
          .includes(preferences.destination.toLowerCase());

      const matchPrice =
        !preferences.maxPrice || tour.price <= preferences.maxPrice;

      const matchDuration =
        !preferences.duration || tour.duration?.days === preferences.duration;

      const matchCategory =
        !preferences.category || tour.category === preferences.category;

      return matchDestination && matchPrice && matchDuration && matchCategory;
    });
  }

  /**
   * Phân tích ý định - NÂNG CẤP HOÀN CHỈNH
   */
  async analyzeIntent(userMessage) {
    try {
      const prompt = `Phân tích câu: "${userMessage}"

Xác định:
1. **Intent chính:**
   - greeting: chào hỏi
   - search_tour: tìm/hỏi tour
   - tour_detail: hỏi chi tiết tour cụ thể
   - price_inquiry: hỏi giá
   - booking: muốn đặt tour
   - compare: so sánh các tour
   - general_info: hỏi thông tin chung về địa điểm
   - other: khác

2. **Entities (thông tin quan trọng):**
   - locations: [địa điểm cụ thể]
   - tourTypes: [loại tour]
   - budget: số tiền hoặc mức (low/medium/high)
   - duration: số ngày
   - dates: thời gian dự định đi
   - groupSize: số người
   - preferences: sở thích đặc biệt

3. **Urgency:** 
   - H: cần ngay (đi gần, đặt gấp)
   - M: trong tuần/tháng này
   - L: tham khảo, dự định xa

4. **Sentiment:**
   - positive/neutral/negative

JSON: {
  "intent": "...",
  "entities": {...},
  "urgency": "...",
  "sentiment": "...",
  "needsClarification": true/false
}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      try {
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("[ChatbotService] Parse JSON error:", e);
      }

      return {
        intent: "other",
        entities: {},
        urgency: "L",
        sentiment: "neutral",
        needsClarification: false,
        summary: userMessage.slice(0, 50),
      };
    } catch (error) {
      console.error("[ChatbotService] Lỗi analyze intent:", error);
      return {
        intent: "other",
        entities: {},
        urgency: "L",
        sentiment: "neutral",
        needsClarification: false,
        summary: userMessage.slice(0, 50),
      };
    }
  }

  /**
   * Format tour info tối ưu - chỉ thông tin cần thiết
   */
  formatTourInfo(tour, minimal = false) {
    if (minimal) {
      // Chỉ với thông tin cơ bản (50% token so với trước)
      return `${tour.name}|${tour.destination}|${this.formatPrice(
        tour.price
      )}|${tour.duration.days}N`;
    }
    return `
 ${tour.name} (${tour.tourCode})
 ${tour.destination} | ${tour.rating?.average || 0}/5 (${
      tour.rating?.count || 0
    } reviews)
 ${this.formatPrice(tour.price)}${
      tour.discountPrice ? ` → ${this.formatPrice(tour.discountPrice)}` : ""
    }
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
}

module.exports = new ChatbotService();
