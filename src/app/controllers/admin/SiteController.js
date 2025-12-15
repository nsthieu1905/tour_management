const { Tour, Booking, User } = require("../../models/index");

const formatRevenue = (value) => {
  const num = Number(value) || 0;
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  return num.toLocaleString("vi-VN");
};

// [GET] /admin/dashboard
const dashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

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

    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth },
      bookingStatus: { $in: ["confirmed", "completed"] },
    });

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

    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth },
    });

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
        $sort: {
          bookingCount: -1,
          totalRevenue: -1,
        },
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

    const topToursForChart = topTours.slice(0, 5);

    const topVIPCustomers = await Booking.aggregate([
      {
        $match: {
          bookingStatus: { $in: ["confirmed", "completed"] },
          paymentStatus: { $in: ["paid"] },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalSpent: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          userName: "$userInfo.fullName",
          totalSpent: 1,
          bookingCount: 1,
        },
      },
    ]);

    return res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      monthlyRevenue: formatRevenue(monthlyRevenue),
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
      topExpensiveTours: topTours.slice(0, 10).map((tour, index) => {
        let rankColor = "gray";
        let bgColor = "white";
        let borderColor = "gray-100";

        if (index === 0) {
          rankColor = "yellow";
          bgColor = "yellow-50";
          borderColor = "yellow-500";
        } else if (index === 1) {
          rankColor = "purple";
          bgColor = "purple-50";
          borderColor = "purple-400";
        } else if (index === 2) {
          rankColor = "blue";
          bgColor = "blue-50";
          borderColor = "blue-500";
        }

        return {
          ...tour,
          rank: index + 1,
          isTopThree: index < 3,
          rankColor,
          bgColor,
          borderColor,
          totalRevenue: formatRevenue(tour.totalRevenue),
        };
      }),
      topVIPCustomers: topVIPCustomers.map((customer, index) => {
        let rankColor = "gray";
        let bgColor = "white";
        let borderColor = "gray-100";

        if (index === 0) {
          rankColor = "yellow";
          bgColor = "yellow-50";
          borderColor = "yellow-500";
        } else if (index === 1) {
          rankColor = "purple";
          bgColor = "purple-50";
          borderColor = "purple-400";
        } else if (index === 2) {
          rankColor = "blue";
          bgColor = "blue-50";
          borderColor = "blue-500";
        }

        return {
          ...customer,
          rank: index + 1,
          isTopThree: index < 3,
          rankColor,
          bgColor,
          borderColor,
          totalSpent: formatRevenue(customer.totalSpent),
        };
      }),
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
    // Lấy số ngày từ query (mặc định 30 ngày)
    const days = parseInt(req.query.days) || 30;
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - days);

    // Ngày để tính xu hướng (từ ngày days+1 đến days*2)
    const trendStartDate = new Date(currentDate);
    trendStartDate.setDate(trendStartDate.getDate() - days * 2);
    const trendEndDate = new Date(currentDate);
    trendEndDate.setDate(trendEndDate.getDate() - days);

    // Tổng doanh thu và số đơn trong khoảng thời gian
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalBookings = revenueData[0]?.totalBookings || 0;

    // Doanh thu trung bình/ngày
    const avgDailyRevenue = days > 0 ? totalRevenue / days : 0;

    // Giá trị đơn hàng trung bình
    const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Tỷ lệ đặt lại (khách hàng đặt >= 2 lần trong khoảng thời gian)
    const customerBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
          userId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$userId",
          bookingCount: { $sum: 1 },
        },
      },
    ]);

    const repeatCustomers = customerBookings.filter(
      (c) => c.bookingCount >= 2
    ).length;
    const totalCustomers = customerBookings.length;
    const repeatRate =
      totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    const seasonalData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentDate.getFullYear(), 0, 1) },
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const seasons = { spring: 0, summer: 0, autumn: 0, winter: 0 };

    seasonalData.forEach((item) => {
      if (item._id >= 1 && item._id <= 3) seasons.spring += item.count;
      else if (item._id >= 4 && item._id <= 6) seasons.summer += item.count;
      else if (item._id >= 7 && item._id <= 9) seasons.autumn += item.count;
      else if (item._id >= 10 && item._id <= 12) seasons.winter += item.count;
    });

    const totalSeasonalBookings = Object.values(seasons).reduce(
      (a, b) => a + b,
      0
    );
    const seasonalPercentages =
      totalSeasonalBookings > 0
        ? [
            ((seasons.spring / totalSeasonalBookings) * 100).toFixed(1),
            ((seasons.summer / totalSeasonalBookings) * 100).toFixed(1),
            ((seasons.autumn / totalSeasonalBookings) * 100).toFixed(1),
            ((seasons.winter / totalSeasonalBookings) * 100).toFixed(1),
          ]
        : [0, 0, 0, 0];

    const seasonalTourCounts = [
      seasons.spring,
      seasons.summer,
      seasons.autumn,
      seasons.winter,
    ];

    // ===========================
    // 3. PHÂN LOẠI TOUR
    // ===========================
    const tourTypes = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $lookup: {
          from: "tours",
          localField: "tourId",
          foreignField: "_id",
          as: "tourInfo",
        },
      },
      {
        $unwind: "$tourInfo",
      },
      {
        $group: {
          _id: "$tourInfo.tourType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          label: "$_id",
          count: 1,
        },
      },
    ]);

    // Tính % cho từng loại tour
    const totalTourBookings = tourTypes.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const tourTypesWithPercent = tourTypes.map((item) => ({
      ...item,
      percentage:
        totalTourBookings > 0
          ? ((item.count / totalTourBookings) * 100).toFixed(1)
          : 0,
    }));

    // ===========================
    // 4. TRẠNG THÁI ĐẶT TOUR (3 trạng thái)
    // ===========================
    const bookingStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["cancelled", "refunded", "completed"] },
        },
      },
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          label: "$_id",
          count: 1,
        },
      },
    ]);

    // Tính % cho trạng thái
    const totalStatusBookings = bookingStatus.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const bookingStatusWithPercent = bookingStatus.map((item) => ({
      ...item,
      percentage:
        totalStatusBookings > 0
          ? ((item.count / totalStatusBookings) * 100).toFixed(1)
          : 0,
    }));

    // ===========================
    // 5. TOP TOURS VÀ HIỆU SUẤT
    // ===========================
    const topTours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: "$tourId",
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalPeople: { $sum: "$numberOfPeople" },
        },
      },
      {
        $sort: {
          bookingCount: -1,
          totalRevenue: -1,
        },
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
          bookingCount: 1,
          totalRevenue: 1,
          totalPeople: 1,
          maxCapacity: "$tourInfo.capacity.max",
        },
      },
    ]);

    // Tính xu hướng và tỷ lệ lấp đầy cho từng tour
    const toursWithDetails = await Promise.all(
      topTours.map(async (tour) => {
        // Số booking trong khoảng thời gian gần nhất (days ngày gần nhất)
        const recentBookings = await Booking.countDocuments({
          tourId: tour._id,
          createdAt: { $gte: startDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        });

        // Số booking trong khoảng thời gian trước đó (từ ngày 31-61 trở về trước)
        const previousBookings = await Booking.countDocuments({
          tourId: tour._id,
          createdAt: { $gte: trendStartDate, $lt: trendEndDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        });

        // Tính xu hướng
        let trendPercent = 0;
        let trendDirection = "neutral";

        if (previousBookings > 0) {
          trendPercent = (
            ((recentBookings - previousBookings) / previousBookings) *
            100
          ).toFixed(1);
          trendDirection = parseFloat(trendPercent) > 0 ? "up" : "down";
        } else if (recentBookings > 0) {
          trendPercent = 100;
          trendDirection = "up";
        }

        // Tính tỷ lệ lấp đầy
        const totalCapacity = tour.maxCapacity * tour.bookingCount;
        const capacityRate =
          totalCapacity > 0
            ? ((tour.totalPeople / totalCapacity) * 100).toFixed(1)
            : 0;

        return {
          tourName: tour.tourName,
          bookingCount: tour.bookingCount,
          totalRevenue: tour.totalRevenue,
          capacityRate: capacityRate,
          trendPercent: Math.abs(parseFloat(trendPercent)),
          trendDirection: trendDirection,
        };
      })
    );

    return res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      selectedDays: days,
      statisticsData: JSON.stringify({
        kpis: {
          avgDailyRevenue: avgDailyRevenue,
          avgOrderValue: avgOrderValue,
          totalRevenue: totalRevenue,
          repeatRate: repeatRate.toFixed(1),
        },
        seasonalTrends: {
          labels: ["Xuân", "Hạ", "Thu", "Đông"],
          percentages: seasonalPercentages.map((p) => parseFloat(p)),
          tourCounts: seasonalTourCounts,
        },
        tourTypes: tourTypesWithPercent,
        bookingStatus: bookingStatusWithPercent,
        topTours: toursWithDetails,
      }),
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
