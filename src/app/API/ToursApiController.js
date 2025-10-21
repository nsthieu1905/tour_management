const { Tour } = require("../models/index");

class TourApiController {
  // [GET] /api/tours
  async findAll(req, res, next) {
    try {
      const { deleted } = req.query;
      const filter = {};
      if (deleted === "true") {
        filter.deleted = true;
      } else if (deleted === "false") {
        filter.deleted = { $ne: true };
      }

      const tours = await Tour.find(filter).lean();
      res.json({
        success: true,
        total: tours.length,
        filterApplied: filter,
        message: "Lấy tours thành công",
        data: tours,
      });
    } catch (next) {}
  }

  // [GET] /api/tours/:id
  async findOne(req, res, next) {
    try {
      const tour = await Tour.findById(req.params.id).lean();
      res.json({ success: true, message: "Thành công", data: tour });
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
      const { price, departures } = req.body;
      const imagePaths = req.files?.map((f) => `/uploads/${f.filename}`) || [];
      req.body = {
        ...req.body,
        price,
        departures: departures ? JSON.parse(departures) : [],
        images: imagePaths,
        thumbnail: imagePaths[0] || "",
        tourType: getTourType(Number(price)),
      };
      const tour = new Tour(req.body);
      await tour.save();
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
      await Tour.delete({ _id: req.params.id });
      res.json({ success: true, message: "Xoá tour thành công" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TourApiController();
