const { Tour } = require("../../models/index");

// GET /booking/:slug
const bookingPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).lean();

    res.render("tour-booking", {
      tour: tour,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking page error:", error);
  }
};

// GET /booking-success
const bookingSuccess = async (req, res) => {
  try {
    res.render("booking-success");
  } catch (error) {
    console.error("Booking success page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

// GET /booking-details/:bookingId
const bookingDetails = async (req, res) => {
  try {
    res.render("booking-detail", {
      bookingId: req.params.bookingId,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking details page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

// GET /my-bookings
const myBookings = async (req, res) => {
  try {
    res.render("my-bookings", {
      user: req.user,
    });
  } catch (error) {
    console.error("My bookings page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

module.exports = { bookingPage, bookingSuccess, bookingDetails, myBookings };
