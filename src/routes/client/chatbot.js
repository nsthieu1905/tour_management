const express = require("express");
const router = express.Router();
const chatbotController = require("../../app/controllers/client/ChatbotController");

// Chat cơ bản
router.post("/message", chatbotController.sendMessage);

// Chat về tour cụ thể
router.post("/tour-inquiry", chatbotController.tourInquiry);

// Gợi ý tour
router.post("/suggest-tours", chatbotController.suggestTours);

// Lấy quick replies
router.get("/quick-replies", chatbotController.getQuickReplies);

module.exports = router;
