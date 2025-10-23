const express = require("express");
const router = express.Router();
const upload = require("../../config/multer");
const tourApiController = require("../../app/API/ToursApiController");

router.get("/", tourApiController.findAll);
router.get("/trash", tourApiController.findTrash);
router.get("/:id", tourApiController.findOne);
router.post("/add", upload.array("images"), tourApiController.create);
router.delete("/:id", tourApiController.softDelete);
router.delete("/trash/:id", tourApiController.delete);
router.patch("/trash/restore/:id", tourApiController.restore);

module.exports = router;
