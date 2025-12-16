const { Feedback, Booking, Tour } = require("../models/index");
const mongoose = require("mongoose");

async function updateTourRating(tourId) {
  const agg = await Feedback.aggregate([
    { $match: { tourId, status: "active" } },
    {
      $group: { _id: "$tourId", count: { $sum: 1 }, avg: { $avg: "$rating" } },
    },
  ]);
  const data = agg[0] || { count: 0, avg: 0 };
  await Tour.findByIdAndUpdate(tourId, {
    $set: {
      "rating.count": data.count,
      "rating.average": Number(data.avg.toFixed(1)) || 0,
    },
  });
}

// POST /api/feedbacks
const create = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { bookingId, rating, comment } = req.body || {};

    if (!bookingId || !rating) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu bookingId hoặc rating" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn" });
    if (String(booking.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền đánh giá đơn này" });
    }
    if (booking.bookingStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ đánh giá khi đơn đã hoàn thành",
      });
    }
    if (booking.reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Đơn này đã được đánh giá" });
    }

    const doc = await Feedback.create({
      tourId: booking.tourId,
      userId,
      bookingId: booking._id,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment?.toString()?.trim() || "",
    });

    booking.reviewId = doc._id;
    await booking.save();

    await updateTourRating(booking.tourId);

    return res
      .status(201)
      .json({ success: true, message: "Gửi đánh giá thành công", data: doc });
  } catch (error) {
    console.error("Create feedback error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/feedbacks/tour/:tourId
const listByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const oid = mongoose.Types.ObjectId.isValid(tourId)
      ? new mongoose.Types.ObjectId(tourId)
      : tourId; // fallback casting by mongoose
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [itemsRaw, total] = await Promise.all([
      Feedback.find({ tourId: oid, status: "active" })
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments({ tourId: oid, status: "active" }),
    ]);
    const curUserId = req.user?.userId ? String(req.user.userId) : null;
    const items = (itemsRaw || []).map((it) => ({
      ...it,
      hasLiked: curUserId
        ? (it.likedBy || []).some((u) => String(u) === curUserId)
        : false,
      hasDisliked: curUserId
        ? (it.dislikedBy || []).some((u) => String(u) === curUserId)
        : false,
    }));

    return res.status(200).json({
      success: true,
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List feedbacks error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/feedbacks/user
const listByUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const items = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error("List my feedbacks error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/feedbacks/by-booking/:bookingId
const getByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const fb = await Feedback.findOne({ bookingId }).lean();
    if (!fb)
      return res
        .status(404)
        .json({ success: false, message: "Chưa có nhận xét" });
    return res.status(200).json({ success: true, data: fb });
  } catch (error) {
    console.error("Get feedback by booking error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /api/feedbacks/:id/like
const like = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    const fb = await Feedback.findById(id);
    if (!fb)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhận xét" });
    fb.dislikedBy = (fb.dislikedBy || []).filter(
      (u) => String(u) !== String(userId)
    );
    const liked = (fb.likedBy || []).some((u) => String(u) === String(userId));
    if (liked) {
      fb.likedBy = fb.likedBy.filter((u) => String(u) !== String(userId));
    } else {
      fb.likedBy = [...(fb.likedBy || []), userId];
    }
    await fb.save();
    return res
      .status(200)
      .json({
        success: true,
        data: { likes: fb.likedBy.length, dislikes: fb.dislikedBy.length },
      });
  } catch (error) {
    console.error("Like feedback error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /api/feedbacks/:id/dislike
const dislike = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    const fb = await Feedback.findById(id);
    if (!fb)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhận xét" });
    fb.likedBy = (fb.likedBy || []).filter((u) => String(u) !== String(userId));
    const disliked = (fb.dislikedBy || []).some(
      (u) => String(u) === String(userId)
    );
    if (disliked) {
      fb.dislikedBy = fb.dislikedBy.filter((u) => String(u) !== String(userId));
    } else {
      fb.dislikedBy = [...(fb.dislikedBy || []), userId];
    }
    await fb.save();
    return res
      .status(200)
      .json({
        success: true,
        data: { likes: fb.likedBy.length, dislikes: fb.dislikedBy.length },
      });
  } catch (error) {
    console.error("Dislike feedback error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  create,
  listByTour,
  listByUser,
  getByBooking,
  like,
  dislike,
};
