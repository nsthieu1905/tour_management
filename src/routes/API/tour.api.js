const express = require("express");
const router = express.Router();

// Fake tour data - đầy đủ thông tin
const fakeTours = [
  {
    _id: "tour_001",
    name: "Tour Hạ Long 2N1D",
    destination: "Hạ Long",
    description:
      "Khám phá vẻ đẹp kỳ vĩ của vịnh Hạ Long - kỳ quan thiên nhiên thế giới.",
    price: 1800000,
    originalPrice: 2200000,
    tourType: "Cao cấp",
    duration: {
      days: 2,
      nights: 1,
    },
    capacity: {
      max: 30,
      current: 12,
    },
    images: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1527004760902-207b6b3d9d7a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
    ],
    departureDates: ["2024-12-20", "2024-12-22", "2024-12-24", "2024-12-26"],
    rating: {
      average: 4.7,
      count: 120,
    },
    highlights: [
      "🚤 Du ngoạn trên vịnh Hạ Long",
      "🏝️ Tham quan các hang động nổi tiếng",
      "🍽️ Ăn hải sản tươi sống trên du thuyền",
      "🌅 Ngắm hoàng hôn trên biển",
    ],
    includes: [
      "Vé du thuyền khứ hồi",
      "Ăn sáng, trưa, chiều",
      "Hướng dẫn viên tiếng Việt",
      "Bảo hiểm du lịch",
      "Thăm hang Sáng Tối",
      "Tham quan đảo Titop",
    ],
    excludes: [
      "Hộ chiếu (còn hạn ít nhất 6 tháng)",
      "Nước uống thêm",
      "Tiền tip HDV và tài xế",
      "Chi phí cá nhân",
    ],
    cancellationPolicy: [
      "Hủy trước 30 ngày: không mất phí",
      "Hủy từ 15-29 ngày: mất 50% tiền tour",
      "Hủy từ 7-14 ngày: mất 70% tiền tour",
      "Hủy dưới 7 ngày: mất 100% tiền tour",
    ],
    itinerary: [
      {
        title: "Hà Nội - Hạ Long",
        activities: [
          "07:00 - Khởi hành từ Hà Nội",
          "11:00 - Tới Hạ Long, check-in du thuyền",
          "12:30 - Ăn trưa trên du thuyền",
          "14:00 - Tham quan hang Sáng Tối",
          "16:00 - Tham quan đảo Titop",
          "18:00 - Ngắm hoàng hôn",
          "19:00 - Ăn tối hải sản",
          "21:00 - Nghỉ ngơi",
        ],
      },
      {
        title: "Hạ Long - Hà Nội",
        activities: [
          "07:00 - Buffet sáng trên du thuyền",
          "08:00 - Tham quan vịnh Bái Tử Long",
          "10:00 - Tham quan hang Luồn",
          "12:00 - Ăn trưa trên du thuyền",
          "13:00 - Trở về Hạ Long",
          "15:00 - Khởi hành về Hà Nội",
          "19:00 - Về tới Hà Nội",
        ],
      },
    ],
  },
  {
    _id: "tour_002",
    name: "Tour Thái Lan Bangkok - Pattaya 5N4D",
    destination: "Thái Lan",
    description:
      "Khám phá Bangkok hiện đại và thư giãn tại bãi biển Pattaya trong chuyến du lịch 5 ngày 4 đêm đầy thú vị.",
    price: 6390000,
    originalPrice: 7200000,
    tourType: "Tiêu chuẩn",
    duration: {
      days: 5,
      nights: 4,
    },
    capacity: {
      max: 25,
      current: 18,
    },
    images: [
      "https://images.unsplash.com/photo-1563492065-1a83e8c2b2e8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    ],
    departureDates: ["2024-12-05", "2024-12-12", "2024-12-19", "2024-12-26"],
    rating: {
      average: 4.8,
      count: 245,
    },
    highlights: [
      "🏯 Khám phá Bangkok và Cung điện Hoàng gia",
      "🏖️ Thư giãn tại bãi biển Pattaya",
      "🍽️ Ẩm thực đặc sắc Thái Lan",
      "🛍️ Mua sắm tại các trung tâm thương mại",
    ],
    includes: [
      "Vé máy bay khứ hồi TP.HCM - Bangkok",
      "Khách sạn 4-5 sao (2 người/phòng)",
      "Các bữa ăn theo chương trình",
      "Xe du lịch đời mới",
      "Hướng dẫn viên tiếng Việt",
      "Vé tham quan các điểm trong chương trình",
      "Bảo hiểm du lịch",
    ],
    excludes: [
      "Hộ chiếu (còn hạn ít nhất 6 tháng)",
      "Chi phí cá nhân",
      "Tiền tip cho HDV và tài xế",
      "Các bữa ăn ngoài chương trình",
      "Phụ thu phòng đơn: 1.200.000đ",
    ],
    cancellationPolicy: [
      "Hủy trước 30 ngày: không mất phí",
      "Hủy từ 15-29 ngày: mất 50% tiền tour",
      "Hủy từ 7-14 ngày: mất 70% tiền tour",
      "Hủy dưới 7 ngày: mất 100% tiền tour",
    ],
    itinerary: [
      {
        title: "TP.HCM - Bangkok",
        activities: [
          "06:00 - Tập trung tại sân bay Tân Sơn Nhất",
          "08:30 - Bay thẳng đến Bangkok",
          "14:00 - Tham quan Cung điện Hoàng gia",
          "16:30 - Đi thuyền trên sông Chao Phraya",
          "19:00 - Dùng bữa tối",
          "21:00 - Nhận phòng khách sạn",
        ],
      },
      {
        title: "Bangkok - Pattaya",
        activities: [
          "07:00 - Buffet sáng",
          "08:30 - Tham quan chợ nổi Damnoen Saduak",
          "13:00 - Di chuyển đến Pattaya",
          "16:00 - Tự do tắm biển",
          "19:00 - Buffet hải sản",
          "21:00 - Xem show Alcazar",
        ],
      },
      {
        title: "Pattaya - Đảo Coral",
        activities: [
          "07:00 - Buffet sáng",
          "08:30 - Đi tàu cao tốc ra đảo Coral",
          "10:00 - Lặn ngắm san hô",
          "12:00 - Buffet trưa",
          "14:00 - Tự do nghỉ ngơi",
          "16:30 - Trở về Pattaya",
          "19:00 - Tự do mua sắm",
        ],
      },
      {
        title: "Pattaya - Bangkok",
        activities: [
          "07:00 - Buffet sáng",
          "09:00 - Tham quan các điểm còn lại",
          "12:00 - Ăn trưa",
          "14:00 - Lên máy bay",
          "19:00 - Về tới TP.HCM",
        ],
      },
      {
        title: "Bangkok - TP.HCM",
        activities: [
          "07:00 - Buffet sáng",
          "09:00 - Tự do mua sắm",
          "13:00 - Ăn trưa",
          "15:00 - Lên máy bay",
          "20:00 - Về tới TP.HCM",
        ],
      },
    ],
  },
  {
    _id: "tour_003",
    name: "Tour Singapore - Malaysia 4N3D",
    destination: "Singapore - Malaysia",
    description: "Khám phá đảo quốc sư tử Singapore và Malaysia xinh đẹp.",
    price: 8990000,
    originalPrice: 10000000,
    tourType: "Giá tốt",
    duration: {
      days: 4,
      nights: 3,
    },
    capacity: {
      max: 20,
      current: 15,
    },
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1551632786-de41ec6a05b0?w=400&h=300&fit=crop",
    ],
    departureDates: ["2024-12-10", "2024-12-17", "2024-12-24"],
    rating: {
      average: 4.6,
      count: 189,
    },
    highlights: [
      "🌃 Thăm quan Singapore",
      "🎡 Tham quan Sentosa Island",
      "🏙️ Khám phá Kuala Lumpur",
      "🗼 Tham quan Petronas Twin Towers",
    ],
    includes: [
      "Vé máy bay khứ hồi",
      "Khách sạn 4 sao",
      "Ăn sáng, một số bữa tối",
      "Xe du lịch",
      "HDV tiếng Việt",
    ],
    excludes: ["Visa", "Chi phí cá nhân", "Tiền tip", "Một số bữa ăn"],
    cancellationPolicy: [
      "Hủy trước 30 ngày: miễn phí",
      "Hủy từ 15-29 ngày: 50%",
      "Hủy dưới 7 ngày: 100%",
    ],
    itinerary: [
      {
        title: "TP.HCM - Singapore",
        activities: [
          "06:00 - Khởi hành từ TP.HCM",
          "10:00 - Tới Singapore",
          "14:00 - Tham quan Marina Bay",
          "18:00 - Ăn tối",
        ],
      },
      {
        title: "Singapore",
        activities: [
          "08:00 - Buffet sáng",
          "09:00 - Tham quan Sentosa Island",
          "13:00 - Ăn trưa",
          "15:00 - Tham quan Gardens by the Bay",
          "19:00 - Ăn tối",
        ],
      },
      {
        title: "Singapore - Kuala Lumpur",
        activities: [
          "07:00 - Buffet sáng",
          "09:00 - Bay tới Kuala Lumpur",
          "12:00 - Ăn trưa",
          "14:00 - Tham quan Petronas Twin Towers",
          "18:00 - Ăn tối",
        ],
      },
      {
        title: "Kuala Lumpur - TP.HCM",
        activities: [
          "08:00 - Buffet sáng",
          "10:00 - Tự do mua sắm",
          "13:00 - Ăn trưa",
          "15:00 - Bay về TP.HCM",
          "20:00 - Về tới TP.HCM",
        ],
      },
    ],
  },
];

// API endpoint để lấy thông tin tour theo ID
router.get("/api/tours/:id", (req, res) => {
  try {
    const tour = fakeTours.find((t) => t._id === req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    res.json({
      success: true,
      data: tour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// API endpoint để lấy danh sách tất cả tour
router.get("/api/tours", (req, res) => {
  try {
    res.json({
      success: true,
      data: fakeTours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
