const express = require("express");
const router = express.Router();
const protectClientRoutes = require("../../middleware/protectClientRoutes");
const feedbacksApi = require("../../app/API/FeedbacksApiController");

router.use(protectClientRoutes);

router.post("/", feedbacksApi.create);
router.get("/tour/:tourId", feedbacksApi.listByTour);
router.get("/user", feedbacksApi.listByUser);
router.post("/:id/like", feedbacksApi.like);
router.post("/:id/dislike", feedbacksApi.dislike);

module.exports = router;
