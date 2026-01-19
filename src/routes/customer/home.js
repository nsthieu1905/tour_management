const express = require("express");
const router = express.Router();

const homeController = require("../../app/controllers/customer/HomeController");
const tourApiController = require("../../app/API/ToursApiController");
const bookingController = require("../../app/controllers/customer/BookingController");

const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.get("/", homeController.home);
router.get("/tours", homeController.toursList);
router.get("/tours/:slug", tourApiController.tourDetail);
router.get("/tours/:slug/feedbacks", tourApiController.tourFeedbacks);
router.get("/booking/:slug", bookingController.bookingPage);
router.get("/booking-success", bookingController.bookingSuccess);

router.use(protectCusRoutes);

router.get("/profile", homeController.profile);
router.get("/favorites", homeController.favorites);
router.get("/booking-details/:bookingId", bookingController.bookingDetails);
router.get("/my-bookings", bookingController.myBookings);

module.exports = router;
