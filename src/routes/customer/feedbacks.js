const express = require("express");
const router = express.Router();
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");
const feedbacksApi = require("../../app/API/FeedbacksApiController");

router.get("/tour/:tourId", feedbacksApi.listByTour);

router.post("/", protectCusRoutes, feedbacksApi.create);
router.get("/user", protectCusRoutes, feedbacksApi.listByUser);
router.post("/:id/like", protectCusRoutes, feedbacksApi.like);
router.post("/:id/dislike", protectCusRoutes, feedbacksApi.dislike);

module.exports = router;
