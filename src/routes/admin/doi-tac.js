const express = require("express");
const router = express.Router();
const doiTacApiController = require("../../app/API/DoiTacApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

// Get all partners with filters
router.get("/", doiTacApiController.findAll);

// Get single partner by ID
router.get("/:id", doiTacApiController.getById);

// Create new partner
router.post("/", doiTacApiController.create);

// Update partner
router.put("/:id", doiTacApiController.update);

// Update partner status
router.patch("/:id/status", doiTacApiController.updateStatus);

// Delete partner
router.delete("/:id", doiTacApiController.deleteOne);

module.exports = router;
