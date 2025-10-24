const { Tour } = require("../models/index");
const path = require("path");
const fs = require("fs-extra");

class TourApiController {
  // [GET] /api/tours
  async findAll(req, res, next) {
    try {
      const tours = await Tour.find({}).lean();
      if (!tours)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy tour" });

      res.status(200).json({
        success: true,
        total: tours.length,
        message: "Lấy tours thành công",
        data: tours,
      });
    } catch (error) {
      next(error);
    }
  }

  // [GET] api/tours/trash
  async findTrash(req, res, next) {
    try {
      const tours = await Tour.findWithDeleted({ deleted: true }).lean();
      if (!tours)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy tour" });

      res.status(200).json({
        success: true,
        total: tours.length,
        message: "Lấy tours thành công",
        data: tours,
      });
    } catch (error) {
      next(error);
    }
  }

  // [GET] /api/tours/:id
  async findOne(req, res, next) {
    try {
      const tour = await Tour.findById(req.params.id).lean();
      if (!tour)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy tour" });

      res
        .status(200)
        .json({ success: true, message: "Thành công", data: tour });
    } catch (next) {}
  }

  //[POST] /api/tours/add
  async create(req, res, next) {
    const getTourType = (price) => {
      if (price <= 2000000) return "Tiết kiệm";
      if (price > 2000000 && price <= 4000000) return "Tiêu chuẩn";
      if (price > 4000000 && price <= 7000000) return "Giá tốt";
      return "Cao cấp";
    };
    try {
      const { price, departureDates } = req.body;
      const imagePaths = req.files?.map((f) => `/uploads/${f.filename}`) ?? [];
      const tour = new Tour({
        ...req.body,
        price: Number(price),
        departureDates: Array.isArray(departureDates)
          ? departureDates
          : [departureDates],
        images: imagePaths,
        thumbnail: imagePaths[0] || "",
        tourType: getTourType(Number(price)),
      });
      const result = await tour.save();
      if (!result)
        return res
          .status(404)
          .json({ success: false, message: "Tạo tour thất bại" });

      res
        .status(201)
        .json({ success: true, message: "Tạo tour thành công", data: tour });
    } catch (error) {
      next(error);
    }
  }

  // [DELETE] /api/tours/:id
  async softDelete(req, res, next) {
    try {
      const result = await Tour.delete({ _id: req.params.id });
      if (!result)
        return res
          .status(404)
          .json({ success: false, message: "Xoá tour thất bại" });

      res.status(200).json({ success: true, message: "Xoá tour thành công" });
    } catch (error) {
      next(error);
    }
  }

  // [DELETE] /api/tours/trash/:id
  async delete(req, res, next) {
    try {
      const tour = await Tour.findOneWithDeleted({ _id: req.params.id }).lean();

      if (!tour) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tour",
        });
      }

      const result = await Tour.deleteOne({ _id: req.params.id });
      if (!result)
        return res
          .status(404)
          .json({ success: false, message: "Xoá tour thất bại" });

      if (tour.images && tour.images.length > 0) {
        try {
          deleteImages(tour.images);
        } catch (error) {
          console.log(error);
        }
      }
      res.status(200).json({
        success: true,
        message: "Xoá tour và ảnh thành công",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  // [PATCH] /api/tours/trash/restore/:id
  async restore(req, res, next) {
    try {
      const result = await Tour.restore({ _id: req.params.id });
      if (!result)
        return res
          .status(404)
          .json({ success: false, message: "Khôi phục tour thất bại" });

      res
        .status(200)
        .json({ success: true, message: "Khôi phục tour thành công" });
    } catch (error) {
      next(error);
    }
  }
}

// Helpers
function deleteImages(images) {
  if (!images || images.length === 0) return;
  images.forEach((imagePath) => {
    const fullPath = path.join(__dirname, "../../public", imagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(`Không tìm thấy tệp: ${fullPath}`);
    }
  });
}

module.exports = new TourApiController();
