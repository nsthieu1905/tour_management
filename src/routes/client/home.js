const express = require("express");
const router = express.Router();

const homeController = require("../../app/controllers/client/HomeController");
const tourApiController = require("../../app/API/ToursApiController");
const bookingController = require("../../app/controllers/client/BookingController");

const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get("/", homeController.home);
router.get("/booking-success", bookingController.bookingSuccess);
router.use(protectClientRoutes);
router.get("/tours/:slug", tourApiController.tourDetail);
router.get("/favorites", homeController.favorites);
router.get("/booking/:slug", bookingController.bookingPage);
router.get("/booking-details/:bookingId", bookingController.bookingDetails);
router.get("/my-bookings", bookingController.myBookings);

module.exports = router;
