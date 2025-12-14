const express = require("express");
const router = express.Router();
const chatbotController = require("../../app/controllers/client/ChatbotController");

router.post("/message", chatbotController.sendMessage);
router.post("/suggest-tours", chatbotController.suggestTours);

module.exports = router;
