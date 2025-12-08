const { Tour } = require("../../models/index");

class BookingController {
  // GET /booking/:tourId - Show booking page
  async bookingPage(req, res, next) {
    try {
      const { tourId } = req.params;
      const tour = await Tour.findById(tourId).lean();

      //   if (!tour) {
      //     return res.status(404).render("client/pages/not-found", {
      //       message: "Tour không tồn tại",
      //     });
      //   }

      res.render("tour-booking", {
        tour: tour,
        user: req.user,
      });
    } catch (error) {
      console.error("Booking page error:", error);
    }
  }
}

module.exports = new BookingController();
