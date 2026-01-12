const express = require("express");
const router = express.Router();
const doiTacApiController = require("../../app/API/DoiTacApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/", doiTacApiController.findAll);
router.get("/types", doiTacApiController.getTypes);
router.get("/services/search", doiTacApiController.searchServices);
router.get("/:id/services", doiTacApiController.getServicesByPartner);
router.post("/:id/services", doiTacApiController.createPartnerService);
router.put("/services/:serviceId", doiTacApiController.updatePartnerService);
router.delete("/services/:serviceId", doiTacApiController.deletePartnerService);
router.get("/:id", doiTacApiController.getById);
router.post("/", doiTacApiController.create);
router.put("/:id", doiTacApiController.update);
router.patch("/:id/status", doiTacApiController.updateStatus);
router.delete("/:id", doiTacApiController.deleteOne);

module.exports = router;
