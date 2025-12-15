const { Tour, Booking, User, Activity } = require("../models/index");
const mongoose = require("mongoose");

// [GET] /api/statistics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Lấy ngày đầu tiên của tháng hiện tại
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Tổng doanh thu tháng này
    const monthlyRevenue = await Booking.aggregate([
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

    // Tổng số đơn đặt tháng này
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth },
      bookingStatus: { $in: ["confirmed", "completed"] },
    });

    // Tỷ lệ lấp đầy trung bình
    const avgCapacity = await Tour.aggregate([
      {
        $group: {
          _id: null,
          avgFilled: {
            $avg: {
              $multiply: [
                { $divide: ["$capacity.current", "$capacity.max"] },
                100,
              ],
            },
          },
        },
      },
    ]);

    // Khách hàng mới tháng này
    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth },
    });

    // Top 10 tour đặt nhiều nhất tháng này
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
          growth: { $first: "$totalAmount" },
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

    // Hoạt động gần đây
    const recentActivities = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalBookings: totalBookings,
        avgCapacity: avgCapacity[0]?.avgFilled?.toFixed(1) || 0,
        newCustomers: newCustomers,
        topTours: topTours,
        recentActivities: recentActivities,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy statistics dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/revenue
const getRevenueStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Doanh thu theo tháng trong năm
    const monthlyRevenue = await Booking.aggregate([
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

    // Đưa tất cả 12 tháng vào mảng với giá trị 0
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

    monthlyRevenue.forEach((item) => {
      revenues[item._id - 1] = item.total;
    });

    return res.status(200).json({
      success: true,
      data: {
        labels: monthLabels,
        revenues: revenues,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy revenue stats:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/popular-tours
const getPopularTours = async (req, res) => {
  try {
    const tours = await Tour.find({ deleted: false })
      .sort({ bookingCount: -1 })
      .limit(10)
      .lean();

    const toursWithBookings = await Promise.all(
      tours.map(async (tour) => {
        const bookings = await Booking.countDocuments({
          tourId: tour._id,
          bookingStatus: { $in: ["confirmed", "completed"] },
        });
        return {
          ...tour,
          bookingCount: bookings,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: toursWithBookings,
    });
  } catch (error) {
    console.error("Lỗi lấy popular tours:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/booking-trends
const getBookingTrends = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Xu hướng đặt tour theo tháng
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $in: ["$paymentStatus", ["paid"]] }, "$totalAmount", 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Đưa tất cả 12 tháng vào mảng với giá trị 0
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
    const bookingCounts = new Array(12).fill(0);
    const revenues = new Array(12).fill(0);

    bookingTrends.forEach((item) => {
      bookingCounts[item._id - 1] = item.count;
      revenues[item._id - 1] = item.revenue;
    });

    return res.status(200).json({
      success: true,
      data: {
        labels: monthLabels,
        bookingCounts: bookingCounts,
        revenues: revenues,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy booking trends:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/tour-type-distribution
const getTourTypeDistribution = async (req, res) => {
  try {
    const distribution = await Tour.aggregate([
      {
        $match: { deleted: false },
      },
      {
        $group: {
          _id: "$tourType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Lỗi lấy tour type distribution:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/booking-status-distribution
const getBookingStatusDistribution = async (req, res) => {
  try {
    const distribution = await Booking.aggregate([
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Lỗi lấy booking status distribution:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueStats,
  getPopularTours,
  getBookingTrends,
  getTourTypeDistribution,
  getBookingStatusDistribution,
};
