const express = require("express");
const router = express.Router();
const upload = require("../../config/multer");
const tourApiController = require("../../app/API/ToursApiController");

router.get("/", tourApiController.findAll);
router.get("/:id", tourApiController.findOne);
router.post("/add", upload.array("images"), tourApiController.create);
router.delete("/:id", tourApiController.softDelete);

module.exports = router;
