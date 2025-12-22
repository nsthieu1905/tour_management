const { User, Booking } = require("../models/index");
const bcrypt = require("bcrypt");

// [GET] /api/auth/current-user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(200).json({
        success: true,
        data: {
          user: null,
          loggedIn: false,
        },
      });
    }

    const user = await User.findById(userId);

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
        loggedIn: true,
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

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác thực được người dùng",
      });
    }

    const user = await User.findById(userId).select("-password -metadata");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { fullName, email, phone, gender, dateOfBirth } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác thực được người dùng",
      });
    }

    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(?:\+84|0|84)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng kiểm tra lại thông tin",
        errors: errors,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng",
          errors: {
            email: "Email đã được sử dụng",
          },
        });
      }
      user.email = email.toLowerCase();
    }

    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
        },
      },
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác thực được người dùng",
      });
    }

    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu cũ";
    }

    if (!newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng kiểm tra lại thông tin",
        errors: errors,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu cũ không chính xác",
        errors: {
          currentPassword: "Mật khẩu cũ không chính xác",
        },
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
      error: error.message,
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
    const search = req.query.search || "";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Lấy tất cả khách hàng
    let customers = await User.find({ role: "customer" })
      .select("-password")
      .lean()
      .exec();

    // Tính toán thống kê và phân loại cho từng khách hàng
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

    // Áp dụng các bộ lọc
    let filteredCustomers = customersWithStats;

    // Filter theo segment (phân khúc)
    if (segment !== "all") {
      filteredCustomers = filteredCustomers.filter(
        (c) => c.customerType === segment
      );
    }

    // Filter theo ngày (ngày cuối cùng đặt tour trong khoảng startDate - endDate)
    if (startDate || endDate) {
      filteredCustomers = filteredCustomers.filter((c) => {
        if (!c.lastBookingDate) return false;

        const lastBooking = new Date(c.lastBookingDate);

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Bao gồm cả ngày end
          return lastBooking >= start && lastBooking <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          return lastBooking >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return lastBooking <= end;
        }

        return true;
      });
    }

    // Filter theo tìm kiếm (tên, email, số điện thoại)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter((c) => {
        const fullNameMatch = c.fullName?.toLowerCase().includes(searchLower);
        const emailMatch = c.email?.toLowerCase().includes(searchLower);
        const phoneMatch = c.phone?.toLowerCase().includes(searchLower);
        return fullNameMatch || emailMatch || phoneMatch;
      });
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
  getProfile,
  updateProfile,
  changePassword,
  findAll,
  findOne,
  getCustomerStats,
};
