const express = require("express");
const router = express.Router();

const homeController = require("../../app/controllers/client/HomeController");
const tourApiController = require("../../app/API/ToursApiController");
const bookingController = require("../../app/controllers/client/BookingController");

const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get("/", homeController.home);
router.get("/tours", homeController.toursList);
router.get("/tours/:slug", tourApiController.tourDetail);
router.get("/tours/:slug/feedbacks", tourApiController.tourFeedbacks);
router.get("/booking/:slug", bookingController.bookingPage);
router.use(protectClientRoutes);
router.get("/profile", homeController.profile);
router.get("/favorites", homeController.favorites);
router.get("/booking-success", bookingController.bookingSuccess);
router.get("/booking-details/:bookingId", bookingController.bookingDetails);
router.get("/my-bookings", bookingController.myBookings);

module.exports = router;
