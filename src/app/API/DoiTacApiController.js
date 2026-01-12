const { Doi_tac, PartnerService, Tour } = require("../models/index");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// [GET] /api/doi-tac
const findAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      status = "",
      destination = "",
    } = req.query;

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    if (destination) {
      filter.destination = { $regex: destination, $options: "i" };
    }

    if (type && type !== "all") {
      filter.type = { $regex: `^${escapeRegex(type)}$`, $options: "i" };
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
      destination: partner.destination || "",
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

// [GET] /api/doi-tac/types
const getTypes = async (req, res) => {
  try {
    const types = await Doi_tac.distinct("type", { type: { $ne: "" } });

    const normalized = (types || [])
      .map((t) => String(t || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi"));

    return res.status(200).json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    console.error("Error fetching partner types:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tải loại hình đối tác",
      error: error.message,
    });
  }
};

// ===========================
// PARTNER SERVICES
// ===========================

// [GET] /api/doi-tac/:id/services
const getServicesByPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Doi_tac.findById(id).lean();
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    const services = await PartnerService.find({ partnerId: id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching partner services:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tải danh sách dịch vụ",
      error: error.message,
    });
  }
};

// [POST] /api/doi-tac/:id/services
const createPartnerService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category = "other",
      unit = "per_booking",
      price = 0,
      supplyQuantity = 0,
      status = "active",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên dịch vụ",
      });
    }

    const partnerExists = await Doi_tac.exists({ _id: id });
    if (!partnerExists) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác",
      });
    }

    const service = await PartnerService.create({
      partnerId: id,
      name: name.trim(),
      category,
      unit,
      price: Number(price) || 0,
      supplyQuantity: Math.max(0, Number(supplyQuantity) || 0),
      status: typeof status === "string" ? status : "active",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    console.error("Error creating partner service:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo dịch vụ",
      error: error.message,
    });
  }
};

// [PUT] /api/doi-tac/services/:serviceId
const updatePartnerService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, category, unit, price, status, supplyQuantity } = req.body;

    const service = await PartnerService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    if (typeof name === "string" && name.trim()) service.name = name.trim();
    if (typeof category === "string") service.category = category;
    if (typeof unit === "string") service.unit = unit;
    if (price !== undefined) service.price = Number(price) || 0;
    if (supplyQuantity !== undefined)
      service.supplyQuantity = Math.max(0, Number(supplyQuantity) || 0);
    if (typeof status === "string") service.status = status;

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    console.error("Error updating partner service:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật dịch vụ",
      error: error.message,
    });
  }
};

// [DELETE] /api/doi-tac/services/:serviceId
const deletePartnerService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await PartnerService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    await Promise.all([
      PartnerService.deleteOne({ _id: serviceId }),
      Tour.updateMany(
        { "partnerServices.serviceId": serviceId },
        { $pull: { partnerServices: { serviceId } } }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "Xoá dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error deleting partner service:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xoá dịch vụ",
      error: error.message,
    });
  }
};

// [GET] /api/doi-tac/services/search
const searchServices = async (req, res) => {
  try {
    const {
      category = "",
      destination = "",
      status = "active",
      partnerStatus = "active",
    } = req.query;

    if (!String(category || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại dịch vụ (category)",
      });
    }

    const partnerFilter = {};
    if (String(partnerStatus || "").trim()) {
      partnerFilter.status = partnerStatus;
    }
    if (destination) {
      partnerFilter.destination = { $regex: destination, $options: "i" };
    }

    const partners = await Doi_tac.find(partnerFilter)
      .select("name destination status")
      .lean();

    const partnerIds = partners.map((p) => p._id);
    const partnerById = new Map(partners.map((p) => [String(p._id), p]));

    const serviceFilter = {
      partnerId: { $in: partnerIds },
      category: {
        $regex: `^${escapeRegex(String(category).trim())}$`,
        $options: "i",
      },
    };
    if (status && status !== "all") {
      serviceFilter.status = status;
    }

    const services = await PartnerService.find(serviceFilter)
      .sort({ createdAt: -1 })
      .lean();

    const formatted = (services || [])
      .map((s) => {
        const partner = partnerById.get(String(s.partnerId));
        if (!partner) return null;
        return {
          _id: s._id,
          name: s.name,
          category: s.category,
          unit: s.unit,
          price: s.price,
          supplyQuantity: s.supplyQuantity,
          status: s.status,
          partner: {
            _id: partner._id,
            name: partner.name,
            destination: partner.destination || "",
            status: partner.status,
          },
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error searching partner services:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm dịch vụ",
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
    const { name, email, phone, type, destination = "" } = req.body;

    // Validation
    if (!name || !email || !type || !String(destination || "").trim()) {
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
      destination,
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
    const { name, email, phone, type, destination } = req.body;

    if (destination !== undefined && !String(destination || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập điểm đến",
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
    if (destination !== undefined) partner.destination = destination;
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

    const serviceIds = await PartnerService.find({ partnerId: id })
      .select("_id")
      .lean();
    const ids = serviceIds.map((s) => s._id);

    // Delete partner + cascade delete its services + remove from all tours
    await Promise.all([
      Doi_tac.findByIdAndDelete(id),
      PartnerService.deleteMany({ partnerId: id }),
      ids.length > 0
        ? Tour.updateMany(
            { "partnerServices.serviceId": { $in: ids } },
            { $pull: { partnerServices: { serviceId: { $in: ids } } } }
          )
        : Promise.resolve(),
    ]);

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
  getTypes,
  getById,
  create,
  update,
  updateStatus,
  deleteOne,
  searchServices,
  getServicesByPartner,
  createPartnerService,
  updatePartnerService,
  deletePartnerService,
};
