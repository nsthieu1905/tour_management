const express = require("express");
const router = express.Router();
const bookingApiController = require("../../app/API/BookingApiController");

router.post("/create-momo-payment", bookingApiController.createMoMoPayment);
router.post("/create-bank-payment", bookingApiController.createBankPayment);
router.post("/momo-callback", bookingApiController.momoCallback);
router.get("/:bookingId", bookingApiController.getBooking);

module.exports = router;
