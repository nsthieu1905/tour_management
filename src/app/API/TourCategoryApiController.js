const { TourCategory, Tour } = require("../models/index");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findAll = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { description: rx }];
    }

    const categories = await TourCategory.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Lỗi lấy danh mục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

const findOne = async (req, res) => {
  try {
    const category = await TourCategory.findById(req.params.id).lean();
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Lỗi lấy danh mục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

const create = async (req, res) => {
  try {
    const { name, description = "", order } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên danh mục",
      });
    }

    const existed = await TourCategory.findOne({ name: String(name).trim() });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục đã tồn tại",
      });
    }

    const rawOrder = order;
    const hasOrder =
      rawOrder !== undefined &&
      rawOrder !== null &&
      String(rawOrder).trim() !== "" &&
      Number(rawOrder) > 0;

    const last = await TourCategory.findOne({}).sort({ order: -1 }).lean();
    const maxOrder = Number(last?.order) || 0;

    let desiredOrder = hasOrder ? Number(rawOrder) || 0 : maxOrder + 1;
    if (desiredOrder <= 0) desiredOrder = maxOrder + 1;
    if (desiredOrder > maxOrder + 1) desiredOrder = maxOrder + 1;

    if (desiredOrder <= maxOrder) {
      await TourCategory.updateMany(
        { order: { $gte: desiredOrder } },
        { $inc: { order: 1 } }
      );
    }

    const category = await TourCategory.create({
      name: String(name).trim(),
      description: String(description || ""),
      order: desiredOrder,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("Lỗi tạo danh mục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

const update = async (req, res) => {
  try {
    const { name, description, order } = req.body;

    const category = await TourCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    if (name !== undefined) {
      if (!String(name || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tên danh mục",
        });
      }

      const existed = await TourCategory.findOne({
        name: String(name).trim(),
        _id: { $ne: category._id },
      });
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Tên danh mục đã tồn tại",
        });
      }

      category.name = String(name).trim();
    }

    if (description !== undefined) {
      category.description = String(description || "");
    }

    if (order !== undefined && order !== null && String(order).trim() !== "") {
      const oldOrder = Number(category.order) || 0;
      const total = await TourCategory.countDocuments({});
      let newOrder = Number(order) || 0;

      if (newOrder < 1) newOrder = 1;
      if (newOrder > total) newOrder = total;

      if (newOrder !== oldOrder) {
        if (oldOrder > 0) {
          if (newOrder < oldOrder) {
            await TourCategory.updateMany(
              {
                _id: { $ne: category._id },
                order: { $gte: newOrder, $lt: oldOrder },
              },
              { $inc: { order: 1 } }
            );
          } else {
            await TourCategory.updateMany(
              {
                _id: { $ne: category._id },
                order: { $gt: oldOrder, $lte: newOrder },
              },
              { $inc: { order: -1 } }
            );
          }
        }

        category.order = newOrder;
      }
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("Lỗi cập nhật danh mục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

const deleteOne = async (req, res) => {
  try {
    const category = await TourCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    const deletedOrder = Number(category.order) || 0;

    await Promise.all([
      TourCategory.deleteOne({ _id: req.params.id }),
      Tour.updateMany(
        { categoryId: req.params.id },
        { $set: { categoryId: null } }
      ),
      deletedOrder > 0
        ? TourCategory.updateMany(
            { order: { $gt: deletedOrder } },
            { $inc: { order: -1 } }
          )
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Xoá danh mục thành công",
    });
  } catch (error) {
    console.error("Lỗi xoá danh mục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  findAll,
  findOne,
  create,
  update,
  deleteOne,
};
