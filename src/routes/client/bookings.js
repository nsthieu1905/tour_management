const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.post(
  "/create-momo-payment",
  protectClientRoutes,
  bookingApiController.createMoMoPayment
);
router.post(
  "/create-bank-payment",
  protectClientRoutes,
  bookingApiController.createBankPayment
);
router.post("/momo-callback", bookingApiController.momoCallback);
router.get(
  "/user/bookings",
  protectClientRoutes,
  bookingApiController.getUserBookings
);

router.get("/:bookingId", protectClientRoutes, bookingApiController.getBooking);

module.exports = router;
