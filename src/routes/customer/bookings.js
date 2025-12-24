const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.post("/momo-callback", bookingApiController.momoCallback);

router.post(
  "/create-momo-payment",
  protectCusRoutes,
  bookingApiController.createMoMoPayment
);
router.post(
  "/create-bank-payment",
  protectCusRoutes,
  bookingApiController.createBankPayment
);
router.get(
  "/user/bookings",
  protectCusRoutes,
  bookingApiController.getUserBookings
);

router.get("/:bookingId", protectCusRoutes, bookingApiController.getBooking);

module.exports = router;
