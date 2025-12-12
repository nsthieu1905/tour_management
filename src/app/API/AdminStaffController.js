const { User } = require("../models/index");

/**
 * [GET] /api/admin/staff
 * Lấy danh sách tất cả nhân viên (users với role = 'admin')
 */
const getStaffList = async (req, res) => {
  try {
    console.log("📋 [AdminStaffController] Fetching staff list...");

    // Lấy tất cả users với role 'admin'
    const staffList = await User.find({ role: "admin" }).select(
      "-password -metadata"
    );

    console.log(
      `✅ [AdminStaffController] Found ${staffList.length} staff members`
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: staffList,
    });
  } catch (error) {
    console.error(
      "❌ [AdminStaffController] Error fetching staff list:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhân viên",
      error: error.message,
    });
  }
};

/**
 * [GET] /api/admin/staff/:id
 * Lấy thông tin chi tiết của một nhân viên
 */
const getStaffDetail = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(
      `📋 [AdminStaffController] Fetching staff detail for ID: ${id}`
    );

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

    console.log(
      `✅ [AdminStaffController] Staff detail found:`,
      staff.fullName
    );

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error(
      "❌ [AdminStaffController] Error fetching staff detail:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin nhân viên",
    });
  }
};

/**
 * [DELETE] /api/admin/staff/:id
 * Xóa một nhân viên khỏi hệ thống
 */
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [AdminStaffController] Deleting staff with ID: ${id}`);

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

    console.log(`✅ [AdminStaffController] Staff deleted successfully`);

    return res.status(200).json({
      success: true,
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    console.error("❌ [AdminStaffController] Error deleting staff:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa nhân viên",
    });
  }
};

/**
 * [PUT] /api/admin/staff/:id
 * Cập nhật thông tin nhân viên
 */
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, status, department } = req.body;

    console.log(`📝 [AdminStaffController] Updating staff with ID: ${id}`);

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

    console.log(`✅ [AdminStaffController] Staff updated successfully`);

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    console.error("❌ [AdminStaffController] Error updating staff:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin nhân viên",
    });
  }
};

module.exports = {
  getStaffList,
  getStaffDetail,
  deleteStaff,
  updateStaff,
};
