const { Tour } = require("../models/index");
const path = require("path");
const fs = require("fs-extra");
const { notifyTourUpdate } = require("../../utils/NotificationHelper");

// [GET] /api/tours
const findAll = async (req, res) => {
  try {
    const tours = await Tour.find({}).lean();
    return res.status(200).json({
      success: true,
      total: tours.length,
      message: tours.length === 0 ? "Chưa có tour nào" : "Lấy tours thành công",
      data: tours,
    });
  } catch (error) {
    console.error("Lỗi lấy tours:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] api/tours/trash
const findTrash = async (req, res) => {
  try {
    const tours = await Tour.findWithDeleted({ deleted: true }).lean();
    if (!tours)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tour" });

    return res.status(200).json({
      success: true,
      total: tours.length,
      message: "Lấy tours thành công",
      data: tours,
    });
  } catch (error) {
    console.error("Lỗi lấy tours trong thùng rác:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/tours/:id
const findOne = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).lean();
    if (!tour)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tour" });

    return res.status(200).json({
      success: true,
      message: "Lấy tour thành công",
      data: tour,
    });
  } catch (next) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

//[POST] /api/tours/add
const create = async (req, res) => {
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
      tourCode: req.body.tourCode,
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
      return res.status(404).json({
        success: false,
        message: "Tạo tour thất bại",
      });

    // Gửi notification đến tất cả clients về tour mới
    try {
      await notifyTourUpdate({
        name: tour.name,
        description: tour.description,
        tourId: tour._id,
      });
    } catch (err) {
      console.error("Error sending tour update notification:", err.message);
    }

    // Emit socket event for admin panel real-time update
    if (global.io) {
      global.io.emit("tour:created", {
        tourId: tour._id,
        name: tour.name,
        tourType: tour.tourType,
      });
      console.log("📢 [Socket] Emitted tour:created for admin panels");
    }

    return res.status(201).json({
      success: true,
      message: "Tạo tour thành công",
      data: tour,
    });
  } catch (error) {
    console.error("Lỗi tạo tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [DELETE] /api/tours/:id
const softDelete = async (req, res) => {
  try {
    const result = await Tour.delete({ _id: req.params.id });
    if (!result)
      return res.status(404).json({
        success: false,
        message: "Xoá tour thất bại",
      });

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit("tour:deleted", { tourId: req.params.id });
      console.log("📢 [Socket] Emitted tour:deleted for id:", req.params.id);
    }

    return res.status(200).json({
      success: true,
      message: "Xoá tour thành công",
    });
  } catch (error) {
    console.error("Lỗi xoá tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [DELETE] /api/tours/trash/:id
const deleteOne = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: "Xoá tour thất bại",
      });

    if (tour.images && tour.images.length > 0) {
      try {
        deleteImages(tour.images);
      } catch (error) {
        console.log(error);
      }
    }

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit("tour:deleted", { tourId: req.params.id });
      console.log(
        "📢 [Socket] Emitted tour:deleted (permanent) for id:",
        req.params.id
      );
    }

    return res.status(200).json({
      success: true,
      message: "Xoá tour và ảnh thành công",
    });
  } catch (error) {
    console.log("Lỗi xoá vĩnh viễn tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [PATCH] /api/tours/trash/restore/:id
const restore = async (req, res) => {
  try {
    const result = await Tour.restore({ _id: req.params.id });
    if (!result)
      return res.status(404).json({
        success: false,
        message: "Khôi phục tour thất bại",
      });

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit("tour:restored", { tourId: req.params.id });
      console.log("📢 [Socket] Emitted tour:restored for id:", req.params.id);
    }

    return res.status(200).json({
      success: true,
      message: "Khôi phục tour thành công",
    });
  } catch (error) {
    console.error("Lỗi khôi phục tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /tour/:id
const tourDetail = async (req, res) => {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).lean();

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tour",
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

    // Chuyển định dạng departureDates nếu cần
    if (tour.departureDates && Array.isArray(tour.departureDates)) {
      tour.departureDates = tour.departureDates
        .map((item) => {
          if (typeof item === "string" || item instanceof Date) {
            // Format cũ: chỉ là date string
            return {
              date: new Date(item),
              price: tour.price || 0,
            };
          } else if (typeof item === "object" && item.date) {
            // Format mới: object có date và price
            return {
              date: new Date(item.date),
              price: item.price || tour.price || 0,
            };
          }
          return null;
        })
        .filter((d) => d !== null);
    }

    // Lấy thêm 3 tour khác để gợi ý
    const otherTours = await Tour.find({ _id: { $ne: tour._id } })
      .limit(3)
      .lean();

    return res.render("tour-detail", {
      tour,
      otherTours,
      bodyClass: "bg-gray-50",
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết tour:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
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
  deleteOne,
  restore,
  tourDetail,
};
