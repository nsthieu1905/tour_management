const { User } = require("../models/index");

// [GET] /api/admin/staff
const getStaffList = async (req, res) => {
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

// [GET] /api/admin/staff/:id
const getStaffDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id).select("-password -metadata");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (staff.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Người dùng này không phải nhân viên admin",
      });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error in getStaffDetail:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [DELETE] /api/admin/staff/:id
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

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
        message: "Chỉ có thể xóa nhân viên admin",
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
const updateStaff = async (req, res) => {
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

module.exports = {
  getStaffList,
  getStaffDetail,
  deleteStaff,
  updateStaff,
};
