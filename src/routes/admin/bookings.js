const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Admin routes for bookings
router.get("/all", protectAdminRoutes, bookingApiController.getAllBookings);

// Confirm payment (quầy tính)
router.post(
  "/confirm-payment",
  protectAdminRoutes,
  bookingApiController.confirmPayment
);

// Confirm booking
router.post(
  "/confirm-booking",
  protectAdminRoutes,
  bookingApiController.confirmBooking
);

// Complete booking
router.post(
  "/complete",
  protectAdminRoutes,
  bookingApiController.completeBooking
);

// Request refund (from customer)
router.post(
  "/request-refund",
  protectAdminRoutes,
  bookingApiController.requestRefund
);

// Approve refund
router.post(
  "/approve-refund",
  protectAdminRoutes,
  bookingApiController.approveRefund
);

// Reject refund
router.post(
  "/reject-refund",
  protectAdminRoutes,
  bookingApiController.rejectRefund
);

// Cancel booking
router.post("/cancel", protectAdminRoutes, bookingApiController.cancelBooking);

module.exports = router;
