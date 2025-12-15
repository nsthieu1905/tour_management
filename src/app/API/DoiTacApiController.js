const Doi_tac = require("../models/Doi_tac");

// [GET] /api/doi-tac
const findAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      status = "",
    } = req.query;

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Doi_tac.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));

    // Fetch data
    const partners = await Doi_tac.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    // Format response
    const formattedPartners = partners.map((partner) => ({
      _id: partner._id,
      name: partner.name,
      email: partner.email,
      phone: partner.phone || "Chưa cập nhật",
      type: partner.type,
      status: partner.status,
      rating: partner.rating.average.toFixed(1),
      reviewCount: partner.rating.count,
      totalRevenue: partner.totalRevenue,
    }));

    return res.status(200).json({
      success: true,
      data: formattedPartners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: pages,
        total: total,
      },
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tải danh sách đối tác",
      error: error.message,
    });
  }
};

// [GET] /api/doi-tac/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Doi_tac.findById(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    return res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    console.error("Error fetching partner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tải thông tin đối tác",
      error: error.message,
    });
  }
};

// [POST] /api/doi-tac
const create = async (req, res) => {
  try {
    const { name, email, phone, type } = req.body;

    // Validation
    if (!name || !email || !type) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // Check email already exists
    const existingPartner = await Doi_tac.findOne({ email });
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng",
      });
    }

    // Create new partner
    const newPartner = new Doi_tac({
      name,
      email,
      phone,
      type,
      status: "active",
    });

    await newPartner.save();

    return res.status(201).json({
      success: true,
      message: "Đối tác được tạo thành công",
      data: newPartner,
    });
  } catch (error) {
    console.error("Error creating partner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đối tác",
      error: error.message,
    });
  }
};

// [PUT] /api/doi-tac/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, type } = req.body;

    // Check if partner exists
    const partner = await Doi_tac.findById(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    // Check email if changed
    if (email && email !== partner.email) {
      const existingPartner = await Doi_tac.findOne({ email });
      if (existingPartner) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }
    }

    // Update partner
    if (name) partner.name = name;
    if (email) partner.email = email;
    if (phone) partner.phone = phone;
    if (type) partner.type = type;

    await partner.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật đối tác thành công",
      data: partner,
    });
  } catch (error) {
    console.error("Error updating partner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đối tác",
      error: error.message,
    });
  }
};

// [PATCH] /api/doi-tac/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    // Check if partner exists
    const partner = await Doi_tac.findById(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    // Update status
    partner.status = status;
    await partner.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: partner,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái",
      error: error.message,
    });
  }
};

// [DELETE] /api/doi-tac/:id
const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if partner exists
    const partner = await Doi_tac.findById(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    // Delete partner
    await Doi_tac.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xoá đối tác thành công",
    });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xoá đối tác",
      error: error.message,
    });
  }
};

module.exports = {
  findAll,
  getById,
  create,
  update,
  updateStatus,
  deleteOne,
};
