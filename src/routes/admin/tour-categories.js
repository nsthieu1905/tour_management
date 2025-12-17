const express = require("express");
const router = express.Router();
const tourCategoryController = require("../../app/API/TourCategoryApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/", tourCategoryController.findAll);
router.get("/:id", tourCategoryController.findOne);
router.post("/add", tourCategoryController.create);
router.patch("/:id", tourCategoryController.update);
router.delete("/:id", tourCategoryController.deleteOne);

module.exports = router;
