const express = require("express");
const router = express.Router();
const upload = require("../../../config/multer");
const tourApiController = require("../../../app/API/ToursApiController");
const {
  authenticateFromCookie,
  authenticate,
} = require("../../../middleware/authMiddleware");

router.delete("/trash/:id", tourApiController.forceDelete);
router.patch("/trash/restore/:id", tourApiController.restore);
router.get("/trash", tourApiController.findTrash);
router.post("/add", upload.array("images"), tourApiController.create);
router.delete("/:id", tourApiController.softDelete);
router.get("/:id", tourApiController.findOne);
// Sử dụng authenticateFromCookie: kiểm tra token từ cookie hoặc Authorization header
router.get("/", authenticateFromCookie, tourApiController.findAll);

module.exports = router;
