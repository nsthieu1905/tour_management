const { User, Booking } = require("../models/index");
const bcrypt = require("bcrypt");

// [GET] /api/admin/profile
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

// [POST] admin/add-staff
const create = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      gender,
      dateOfBirth,
      password,
      passwordConfirm,
      role,
    } = req.body;

    // Validate required fields
    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Vui lòng nhập tên nhân viên";
    }

    if (!email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ (vd: user@example.com)";
    }

    if (!phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(?:\+84|0|84)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }

    if (role && role !== "admin" && role !== "staff") {
      errors.role = "Phân quyền không hợp lệ";
    }

    // Nếu có lỗi validation, trả về ngay
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
        errors: errors,
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được đăng ký",
        errors: {
          email: "Email đã được đăng ký",
        },
      });
    }

    const staffRole = role || "staff";

    // Tạo user mới với role mặc định là 'staff'
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      password: password,
      role: staffRole,
      status: "active",
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/staffs
const findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy tổng số nhân viên
    const total = await User.countDocuments({
      role: { $in: ["admin", "staff"] },
    });

    // Lấy dữ liệu nhân viên với phân trang
    const staffList = await User.find({ role: { $in: ["admin", "staff"] } })
      .select("-password -metadata")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: staffList,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

// [DELETE] /api/admin/staff/:id
const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    // Kiểm tra để không xóa chính mình
    if (staff._id.toString() === req.user?.userId?.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa chính mình",
      });
    }

    // Xóa nhân viên
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [PUT] /api/admin/staff/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, status, department, role } = req.body;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (staff.role !== "admin" && staff.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể cập nhật nhân viên",
      });
    }

    if (role && role !== "admin" && role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Phân quyền không hợp lệ",
      });
    }

    // Kiểm tra email nếu thay đổi
    if (email && email !== staff.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }
      staff.email = email.toLowerCase();
    }

    // Cập nhật các trường
    if (fullName) staff.fullName = fullName.trim();
    if (phone) staff.phone = phone;
    if (status) staff.status = status;
    if (department) staff.department = department;
    if (role) staff.role = role;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    console.error("Error in updateStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [PATCH] /api/admin/staff/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ (active hoặc inactive)",
      });
    }

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (staff.role !== "admin" && staff.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể cập nhật trạng thái nhân viên",
      });
    }

    // Kiểm tra để không vô hiệu hóa chính mình
    if (
      staff._id.toString() === req.user?.userId?.toString() &&
      status === "inactive"
    ) {
      return res.status(400).json({
        success: false,
        message: "Không thể vô hiệu hóa tài khoản của chính mình",
      });
    }

    staff.status = status;
    await staff.save();

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái nhân viên thành công (${
        status === "active" ? "Hoạt động" : "Tạm dừng"
      })`,
      data: {
        id: staff._id,
        status: staff.status,
        fullName: staff.fullName,
      },
    });
  } catch (error) {
    console.error("Error in updateStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [PUT] /api/admin/staff/update-profile
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

    // Validation
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

    // Check if email is already used by another user
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

    // Update fields
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

// [PUT] /api/staffs/change-password
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log("changePassword called - userId:", userId);
    console.log("req.user:", req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác thực được người dùng",
      });
    }

    // Validation
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

    // Kiểm tra mật khẩu cũ
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return res.status(500).json({
        success: false,
        message: "Lỗi truy cập cơ sở dữ liệu",
        error: dbError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    console.log("User found:", user.email);
    console.log("Comparing password...");
    console.log(
      "Current password hash:",
      user.password.substring(0, 20) + "...",
    );

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi xác thực mật khẩu",
        error: bcryptError.message,
      });
    }

    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu cũ không chính xác",
        errors: {
          currentPassword: "Mật khẩu cũ không chính xác",
        },
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    try {
      await user.save();
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lưu mật khẩu mới",
        error: saveError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  create,
  findAll,
  deleteOne,
  update,
  updateStatus,
  updateProfile,
  changePassword,
};
