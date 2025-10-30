const express = require("express");
const router = express.Router();
const upload = require("../../../config/multer");
const tourApiController = require("../../../app/API/ToursApiController");

router.delete("/trash/:id", tourApiController.delete);
router.patch("/trash/restore/:id", tourApiController.restore);
router.get("/trash", tourApiController.findTrash);
router.post("/add", upload.array("images"), tourApiController.create);
router.delete("/:id", tourApiController.softDelete);
router.get("/:id", tourApiController.findOne);
router.get("/", tourApiController.findAll);

module.exports = router;
