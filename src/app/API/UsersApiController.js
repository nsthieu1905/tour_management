const { User, Booking } = require("../models/index");

// [GET] /api/auth/current-user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin user",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};
// [GET] /api/customers
const findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const segment = req.query.segment || "all";

    let customers = await User.find({ role: "customer" })
      .select("-password")
      .lean()
      .exec();

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const bookings = await Booking.find({
          userId: customer._id,
          bookingStatus: "completed",
        }).lean();

        const totalSpent = bookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0
        );
        const bookingCount = bookings.length;
        const lastBookingDate =
          bookings.length > 0
            ? bookings.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )[0].createdAt
            : null;

        // Phân loại khách hàng
        let customerType = "Khách mới";
        if (bookingCount === 0) {
          customerType = "Khách mới";
        } else if (totalSpent >= 100000000) {
          customerType = "Kim cương";
        } else if (totalSpent >= 25000000) {
          customerType = "Vàng";
        } else {
          customerType = "Bạc";
        }

        return {
          _id: customer._id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          avatar: customer.avatar,
          totalSpent,
          bookingCount,
          lastBookingDate,
          customerType,
          isReturningCustomer: bookingCount >= 2,
        };
      })
    );

    // Lọc theo segment
    let filteredCustomers = customersWithStats;
    if (segment !== "all") {
      filteredCustomers = customersWithStats.filter(
        (c) => c.customerType === segment
      );
    }

    // Sắp xếp theo chi tiêu giảm dần
    filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Phân trang
    const total = filteredCustomers.length;
    const paginatedCustomers = filteredCustomers.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách khách hàng thành công",
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [GET] /api/customers/:id/detail
const findOne = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id).select("-password").lean().exec();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }

    // Lấy danh sách tour đã đặt
    const bookings = await Booking.find({
      userId: id,
      bookingStatus: "completed",
    })
      .populate({
        path: "tourId",
        select: "tourCode name destination duration price",
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Tính toán thống kê
    const totalSpent = bookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );
    const bookingCount = bookings.length;

    // Phân loại khách hàng
    let customerType = "Khách mới";
    if (bookingCount === 0) {
      customerType = "Khách mới";
    } else if (totalSpent >= 100000000) {
      customerType = "Kim cương";
    } else if (totalSpent >= 25000000) {
      customerType = "Vàng";
    } else {
      customerType = "Bạc";
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết khách hàng thành công",
      data: {
        ...customer,
        customerType,
        totalSpent,
        bookingCount,
        isReturningCustomer: bookingCount >= 2,
        bookings: bookings.map((b) => ({
          _id: b._id,
          bookingCode: b.bookingCode,
          tour: b.tourId,
          numberOfPeople: b.numberOfPeople,
          totalAmount: b.totalAmount,
          bookingStatus: b.bookingStatus,
          paymentStatus: b.paymentStatus,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get customer detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [GET] /api/customers/stats
const getCustomerStats = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }).lean().exec();

    let totalCustomers = customers.length;
    let newCustomers = 0;
    let silverCustomers = 0;
    let goldCustomers = 0;
    let diamondCustomers = 0;
    let returningCustomers = 0;

    await Promise.all(
      customers.map(async (customer) => {
        const bookings = await Booking.countDocuments({
          userId: customer._id,
          bookingStatus: "completed",
        });

        if (bookings === 0) {
          newCustomers++;
        } else {
          const totalSpent = await Booking.aggregate([
            {
              $match: {
                userId: customer._id,
                bookingStatus: "completed",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" },
              },
            },
          ]);

          const spent = totalSpent[0]?.total || 0;

          if (bookings >= 2) {
            returningCustomers++;
          }

          if (spent >= 100000000) {
            diamondCustomers++;
          } else if (spent >= 25000000) {
            goldCustomers++;
          } else {
            silverCustomers++;
          }
        }
      })
    );

    const returnRate =
      totalCustomers > 0
        ? ((returningCustomers / totalCustomers) * 100).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê khách hàng thành công",
      data: {
        totalCustomers,
        newCustomers,
        silverCustomers,
        goldCustomers,
        diamondCustomers,
        returningCustomers,
        returnRate: parseFloat(returnRate),
      },
    });
  } catch (error) {
    console.error("Get customer stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

module.exports = {
  getCurrentUser,
  findAll,
  findOne,
  getCustomerStats,
};
