const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Admin routes for bookings
router.get("/all", protectAdminRoutes, bookingApiController.getAllBookings);

module.exports = router;
