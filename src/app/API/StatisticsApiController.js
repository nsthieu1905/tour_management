const { Tour, Booking, User } = require("../models/index");

const parseDateRange = (req, fallbackStart, fallbackEnd) => {
  const { startDate, endDate } = req.query;

  let start = new Date(fallbackStart);
  start.setHours(0, 0, 0, 0);

  let end = new Date(fallbackEnd);
  end.setHours(23, 59, 59, 999);

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      parsedStart.setHours(0, 0, 0, 0);
      start = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      parsedEnd.setHours(23, 59, 59, 999);
      end = parsedEnd;
    }
  }

  if (start > end) {
    start = new Date(fallbackStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(fallbackEnd);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// [GET] /api/statistics/dashboard
const getDashboardStatistics = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const { start: rangeStart, end: rangeEnd } = parseDateRange(
      req,
      startOfMonth,
      currentDate
    );

    const monthlyRevenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
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
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
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
    const avgCapacity = Number(avgCapacityData[0]?.avgFilled?.toFixed(1) || 0);

    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    });

    const topTours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
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
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
          bookingStatus: { $in: ["confirmed", "completed"] },
          paymentStatus: { $in: ["paid"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const revenueMap = new Map(
      monthlyRevenueByMonth.map((item) => [
        `${item._id.year}-${item._id.month}`,
        item.total,
      ])
    );

    const monthLabels = [];
    const revenues = [];
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const endCursor = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
    const isSingleYear = rangeStart.getFullYear() === rangeEnd.getFullYear();

    while (cursor <= endCursor) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth() + 1;
      monthLabels.push(isSingleYear ? `T${month}` : `T${month}/${year}`);
      revenues.push(revenueMap.get(`${year}-${month}`) || 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const topVIPCustomers = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
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

    return res.status(200).json({
      success: true,
      data: {
        range: {
          startDate: rangeStart.toISOString(),
          endDate: rangeEnd.toISOString(),
        },
        metrics: {
          monthlyRevenue,
          totalBookings,
          avgCapacity,
          newCustomers,
        },
        charts: {
          revenue: { labels: monthLabels, revenues },
          popularTours: topTours.slice(0, 5).map((t) => ({
            name: t.tourName,
            bookingCount: t.bookingCount,
          })),
        },
        lists: {
          topTours: topTours.slice(0, 10).map((t) => ({
            tourName: t.tourName,
            bookingCount: t.bookingCount,
            totalRevenue: t.totalRevenue,
          })),
          topVIPCustomers: topVIPCustomers.map((c) => ({
            userName: c.userName,
            bookingCount: c.bookingCount,
            totalSpent: c.totalSpent,
          })),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/statistics/thong-ke
const getThongKeStatistics = async (req, res) => {
  try {
    const currentDate = new Date();
    const fallbackEnd = new Date(currentDate);
    fallbackEnd.setHours(23, 59, 59, 999);
    const fallbackStart = new Date(currentDate);
    fallbackStart.setDate(fallbackStart.getDate() - 30);
    fallbackStart.setHours(0, 0, 0, 0);

    const { start: startDate, end: endDate } = parseDateRange(
      req,
      fallbackStart,
      fallbackEnd
    );

    const rangeDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    const trendEndDate = new Date(startDate);
    trendEndDate.setHours(0, 0, 0, 0);
    const trendStartDate = new Date(startDate);
    trendStartDate.setDate(trendStartDate.getDate() - rangeDays);
    trendStartDate.setHours(0, 0, 0, 0);

    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const avgDailyRevenue = rangeDays > 0 ? totalRevenue / rangeDays : 0;
    const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const customerBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
          createdAt: { $gte: startDate, $lte: endDate },
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

    const tourTypes = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const bookingStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const topTours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const toursWithDetails = await Promise.all(
      topTours.map(async (tour) => {
        const recentBookings = await Booking.countDocuments({
          tourId: tour._id,
          createdAt: { $gte: startDate, $lte: endDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        });

        const previousBookings = await Booking.countDocuments({
          tourId: tour._id,
          createdAt: { $gte: trendStartDate, $lt: trendEndDate },
          bookingStatus: { $in: ["confirmed", "completed"] },
        });

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

    return res.status(200).json({
      success: true,
      data: {
        range: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        kpis: {
          avgDailyRevenue,
          avgOrderValue,
          totalRevenue,
          repeatRate: Number(repeatRate.toFixed(1)),
        },
        seasonalTrends: {
          labels: ["Xuân", "Hạ", "Thu", "Đông"],
          percentages: seasonalPercentages.map((p) => parseFloat(p)),
          tourCounts: seasonalTourCounts,
        },
        tourTypes: tourTypesWithPercent,
        bookingStatus: bookingStatusWithPercent,
        topTours: toursWithDetails,
      },
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
  getDashboardStatistics,
  getThongKeStatistics,
};
