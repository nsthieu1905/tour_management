const { Tour } = require("../models/index");
const path = require("path");
const fs = require("fs-extra");

// [GET] /api/tours
const findAll = async (req, res, next) => {
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
};

// [GET] api/tours/trash
const findTrash = async (req, res, next) => {
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
};

// [GET] /api/tours/:id
const findOne = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).lean();
    if (!tour)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tour" });

    res
      .status(200)
      .json({ success: true, message: "Đều lệ thành công", data: tour });
  } catch (next) {}
};

//[POST] /api/tours/add
const create = async (req, res, next) => {
  const getTourType = (price) => {
    if (price <= 2000000) return "Tiết kiệm";
    if (price > 2000000 && price <= 4000000) return "Tiêu chuẩn";
    if (price > 4000000 && price <= 7000000) return "Giá tốt";
    return "Cao cấp";
  };
  try {
    let { price, departureDates, itinerary } = req.body;
    const imagePaths = req.files?.map((f) => `/uploads/${f.filename}`) ?? [];

    // Xử lý itinerary từ form fields
    let parsedItinerary = [];

    if (itinerary) {
      if (Array.isArray(itinerary)) {
        // Lọc bỏ các phần tử là string (JSON string không cần)
        parsedItinerary = itinerary
          .filter((item) => typeof item === "object" && item !== null)
          .map((item, index) => ({
            day: index + 1,
            destinations: item.destinations || "",
            description: item.description || "",
          }));
      } else if (typeof itinerary === "string") {
        try {
          parsedItinerary = JSON.parse(itinerary);
        } catch (e) {
          console.error("Failed to parse itinerary:", e.message);
          parsedItinerary = [];
        }
      }
    }

    // Xử lý departureDates - chuyển từ array string thành array objects {date, price}
    let parsedDepartureDates = [];
    if (departureDates) {
      if (typeof departureDates === "string") {
        try {
          // Nếu là JSON string
          departureDates = JSON.parse(departureDates);
        } catch (e) {
          // Nếu là single date
          departureDates = [departureDates];
        }
      }

      if (Array.isArray(departureDates)) {
        parsedDepartureDates = departureDates.map((item) => {
          // Nếu item là object có date và price
          if (typeof item === "object" && item.date && item.price) {
            return {
              date: new Date(item.date),
              price: Number(item.price),
            };
          }
          // Nếu item chỉ là date string, dùng price mặc định
          return {
            date: new Date(item),
            price: Number(price),
          };
        });
      }
    }

    const tourData = {
      name: req.body.name,
      description: req.body.description,
      destination: req.body.destination,
      duration: req.body.duration,
      capacity: req.body.capacity,
      price: Number(price),
      departureDates:
        parsedDepartureDates.length > 0
          ? parsedDepartureDates
          : [
              {
                date: new Date(),
                price: Number(price),
              },
            ],
      itinerary: parsedItinerary,
      images: imagePaths,
      thumbnail: imagePaths[0] || "",
      tourType: getTourType(Number(price)),
    };

    const tour = new Tour(tourData);
    const result = await tour.save();

    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Tạo tour thất bại" });

    res
      .status(201)
      .json({ success: true, message: "Tạo tour thành công", data: tour });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [DELETE] /api/tours/:id
const softDelete = async (req, res, next) => {
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
};

// [DELETE] /api/tours/trash/:id
const forceDelete = async (req, res, next) => {
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
};

// [PATCH] /api/tours/trash/restore/:id
const restore = async (req, res, next) => {
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
};

// [GET] /tour/:id
const tourDetail = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).lean();

    if (!tour) {
      return res.status(404).render("error", {
        message: "Tour không tồn tại",
        bodyClass: "bg-gray-50",
      });
    }

    // Parse stringified arrays nếu cần
    if (typeof tour.highlights === "string") {
      tour.highlights = tour.highlights.split("\n").filter((h) => h.trim());
    }

    if (typeof tour.includes === "string") {
      tour.includes = tour.includes.split("\n").filter((i) => i.trim());
    }

    if (typeof tour.excludes === "string") {
      tour.excludes = tour.excludes.split("\n").filter((e) => e.trim());
    }

    if (typeof tour.cancellationPolicy === "string") {
      tour.cancellationPolicy = tour.cancellationPolicy
        .split("\n")
        .filter((p) => p.trim());
    }

    // Normalize departureDates - handle both old format (array of dates) and new format (array of {date, price})
    if (tour.departureDates && Array.isArray(tour.departureDates)) {
      tour.departureDates = tour.departureDates
        .map((item) => {
          if (typeof item === "string" || item instanceof Date) {
            // Old format: just date
            return {
              date: new Date(item),
              price: tour.price || 0,
            };
          } else if (typeof item === "object" && item.date) {
            // New format: {date, price}
            return {
              date: new Date(item.date),
              price: item.price || tour.price || 0,
            };
          }
          return null;
        })
        .filter((d) => d !== null);
    }

    // Get other tours
    const otherTours = await Tour.find({ _id: { $ne: tour._id } })
      .limit(3)
      .lean();

    res.render("tour-detail", {
      tour,
      otherTours,
      // layout: false,
      bodyClass: "bg-gray-50",
    });
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  findAll,
  findTrash,
  findOne,
  create,
  softDelete,
  forceDelete,
  tourDetail,
  restore,
};
