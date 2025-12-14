const { User } = require("../models/index");

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

    // Tạo user mới với role mặc định là 'admin'
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      password: password,
      role: "admin",
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
    const staffList = await User.find({ role: "admin" }).select(
      "-password -metadata"
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: staffList,
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
    const { fullName, email, phone, status, department } = req.body;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (staff.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể cập nhật nhân viên admin",
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

    if (staff.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có thể cập nhật trạng thái nhân viên admin",
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

module.exports = {
  create,
  findAll,
  deleteOne,
  update,
  updateStatus,
};
