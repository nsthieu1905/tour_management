const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.post("/momo-callback", bookingApiController.momoCallback);

router.post(
  "/create-momo-payment",
  protectCusRoutes,
  bookingApiController.createMoMoPayment,
);
router.post(
  "/create-bank-payment",
  protectCusRoutes,
  bookingApiController.createBankPayment,
);
router.get(
  "/user/bookings",
  protectCusRoutes,
  bookingApiController.getUserBookings,
);

router.get(
  "/:bookingId",
  (req, res, next) => {
    const { bookingId } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return next("router");
    }
    return next();
  },
  protectCusRoutes,
  bookingApiController.getBooking,
);

module.exports = router;
