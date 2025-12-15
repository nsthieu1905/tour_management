const { Tour, Booking, User } = require("../../models/index");

// [GET] /admin/dashboard
const dashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Tổng doanh thu tháng
    const monthlyRevenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          bookingStatus: { $in: ["confirmed", "completed"] },
          paymentStatus: { $in: ["paid"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const monthlyRevenue = monthlyRevenueData[0]?.total || 0;

    // Tổng số đơn đặt
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth },
      bookingStatus: { $in: ["confirmed", "completed"] },
    });

    // Tỷ lệ lấp đầy trung bình
    const avgCapacityData = await Tour.aggregate([
      {
        $match: { deleted: false },
      },
      {
        $group: {
          _id: null,
          avgFilled: {
            $avg: {
              $cond: [
                { $gt: ["$capacity.max", 0] },
                {
                  $multiply: [
                    { $divide: ["$capacity.current", "$capacity.max"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);
    const avgCapacity = avgCapacityData[0]?.avgFilled?.toFixed(1) || 0;

    // Khách hàng mới
    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth },
    });

    // Top 10 tour
    const topTours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: "$tourId",
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tourInfo",
        },
      },
      {
        $unwind: "$tourInfo",
      },
      {
        $project: {
          _id: 1,
          tourName: "$tourInfo.name",
          tourCode: "$tourInfo.tourCode",
          bookingCount: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Lấy dữ liệu doanh thu theo tháng để vẽ biểu đồ
    const monthlyRevenueByMonth = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
          bookingStatus: { $in: ["confirmed", "completed"] },
          paymentStatus: { $in: ["paid"] },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthLabels = [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ];
    const revenues = new Array(12).fill(0);
    monthlyRevenueByMonth.forEach((item) => {
      revenues[item._id - 1] = item.total;
    });

    // Lấy booking count của top tours để vẽ biểu đồ
    const topToursForChart = topTours.slice(0, 8);

    return res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      monthlyRevenue: Number(monthlyRevenue).toLocaleString("vi-VN"),
      totalBookings,
      avgCapacity,
      newCustomers,
      topTours: topTours.map((tour, index) => ({
        ...tour,
        rank: index + 1,
        rankColor:
          index === 0
            ? "yellow"
            : index === 1
            ? "purple"
            : index === 2
            ? "blue"
            : "gray",
      })),
      // Dữ liệu cho biểu đồ (embed trong page)
      revenueChartData: JSON.stringify({
        labels: monthLabels,
        revenues: revenues,
      }),
      popularToursChartData: JSON.stringify(
        topToursForChart.map((tour) => ({
          name: tour.tourName,
          bookingCount: tour.bookingCount,
        }))
      ),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-tour
const qlyTour = async (req, res) => {
  try {
    return res.render("components/qly-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-tour/trash
const trashTour = async (req, res) => {
  try {
    return res.render("CRUD/qly-tours/trash-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/booking-tour
const bookingTour = (req, res) => {
  try {
    return res.render("components/booking-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-nhan-vien
const qlyNhanVien = (req, res) => {
  try {
    return res.render("components/qly-nhan-vien", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-khach-hang
const qlyKhachHang = (req, res) => {
  try {
    return res.render("components/qly-KH", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/customers/:id
const customerDetail = (req, res) => {
  try {
    return res.render("components/customer-detail", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/doi-tac
const doiTac = (req, res) => {
  try {
    return res.render("components/qly-doi-tac", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/thong-ke
const thongKe = async (req, res) => {
  try {
    // Get booking trends data
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lt: new Date(new Date().getFullYear() + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          bookingCount: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create array with all 12 months
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const bookingCounts = new Array(12).fill(0);
    const revenues = new Array(12).fill(0);

    bookingTrends.forEach((item) => {
      const monthIndex = item._id - 1;
      bookingCounts[monthIndex] = item.bookingCount || 0;
      revenues[monthIndex] = item.revenue || 0;
    });

    // Get tour type distribution
    const tourTypeDistribution = await Tour.aggregate([
      {
        $group: {
          _id: "$tourType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get booking status distribution
    const bookingStatusDistribution = await Booking.aggregate([
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top tours for performance table
    const topTours = await Booking.aggregate([
      {
        $group: {
          _id: "$tourId",
          bookingCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tourInfo",
        },
      },
      { $unwind: "$tourInfo" },
      {
        $project: {
          tourName: "$tourInfo.name",
          tourCode: "$tourInfo.tourCode",
          bookingCount: 1,
          totalRevenue: 1,
          avgRevenue: {
            $divide: ["$totalRevenue", "$bookingCount"],
          },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
    ]);

    const chartData = {
      bookingTrends: {
        labels: monthLabels,
        bookingCounts: bookingCounts,
        revenues: revenues,
      },
      tourTypes: tourTypeDistribution.map((item) => ({
        label: item._id || "Chưa phân loại",
        count: item.count,
      })),
      bookingStatus: bookingStatusDistribution.map((item) => ({
        label: item._id || "Chưa xác định",
        count: item.count,
      })),
      topTours: topTours.map((tour) => ({
        tourName: tour.tourName,
        bookingCount: tour.bookingCount,
        totalRevenue: tour.totalRevenue,
        avgRevenue: Math.round(tour.avgRevenue),
      })),
    };

    return res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      statisticsData: JSON.stringify(chartData),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/settings
const settings = (req, res) => {
  try {
    return res.render("components/settings", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};
// [GET] /admin/qly-coupon
const maGiamGia = (req, res) => {
  try {
    return res.render("components/qly-coupon", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-nhan-tin
const qlyNhanTin = (req, res) => {
  try {
    return res.render("components/qly-nhan-tin", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  dashboard,
  qlyTour,
  trashTour,
  bookingTour,
  qlyNhanVien,
  qlyKhachHang,
  customerDetail,
  doiTac,
  thongKe,
  settings,
  maGiamGia,
  qlyNhanTin,
};
