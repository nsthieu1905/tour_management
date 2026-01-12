const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/all", bookingApiController.getAllBookings);
router.post("/confirm-payment", bookingApiController.confirmPayment);
router.post("/confirm-booking", bookingApiController.confirmBooking);
router.post("/complete", bookingApiController.completeBooking);
router.post("/request-refund", bookingApiController.requestRefund);
router.post("/approve-refund", bookingApiController.approveRefund);
router.post("/reject-refund", bookingApiController.rejectRefund);
router.post("/cancel", bookingApiController.cancelBooking);

module.exports = router;
