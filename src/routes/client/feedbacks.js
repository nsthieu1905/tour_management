const express = require("express");
const router = express.Router();
const protectClientRoutes = require("../../middleware/protectClientRoutes");
const feedbacksApi = require("../../app/API/FeedbacksApiController");
router.get("/tour/:tourId", feedbacksApi.listByTour);

router.post("/", protectClientRoutes, feedbacksApi.create);
router.get("/user", protectClientRoutes, feedbacksApi.listByUser);
router.post("/:id/like", protectClientRoutes, feedbacksApi.like);
router.post("/:id/dislike", protectClientRoutes, feedbacksApi.dislike);

module.exports = router;
