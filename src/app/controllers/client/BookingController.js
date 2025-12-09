const { Tour, Booking } = require("../../models/index");
const MoMoService = require("../../services/MoMoService");

// GET /booking/:slug
const bookingPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).lean();

    res.render("tour-booking", {
      tour: tour,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking page error:", error);
  }
};

// GET /booking-success
const bookingSuccess = async (req, res) => {
  try {
    // 🔥 Handle MoMo callback from query params
    const { resultCode, extraData, signature, transId, amount } = req.query;

    if (resultCode !== undefined) {
      console.log("🔔 ========================================");
      console.log("🔔 MoMo Redirect Callback received!");
      console.log("🔔 Query params:", req.query);
      console.log("🔔 ========================================");

      // Verify signature if provided
      if (signature && extraData) {
        const isValidSignature = MoMoService.verifySignature(req.query);
        console.log(
          `Signature verification: ${
            isValidSignature ? "✅ PASSED" : "❌ FAILED"
          }`
        );
      }

      // Process callback
      if (resultCode === "0") {
        // Payment successful
        console.log("✅ Result code = 0 (SUCCESS)");

        if (extraData) {
          console.log(`📂 Fetching booking with ID: ${extraData}`);
          const booking = await Booking.findById(extraData);

          if (booking) {
            console.log(`✅ Found booking: ${booking._id}`);
            console.log(
              `   - Before: bookingStatus=${booking.bookingStatus}, paymentStatus=${booking.paymentStatus}`
            );

            // Update booking status
            booking.bookingStatus = "confirmed";
            booking.paymentStatus = "paid";

            booking.payments.push({
              amount: parseInt(amount) || 0,
              method: "momo",
              transactionId: transId,
              status: "success",
              paidAt: new Date(),
            });

            await booking.save();

            console.log(
              `✅ Booking ${booking._id} confirmed and marked as paid`
            );
            console.log(
              `   - After: bookingStatus=${booking.bookingStatus}, paymentStatus=${booking.paymentStatus}`
            );
          } else {
            console.error(`❌ Booking not found with ID: ${extraData}`);
          }
        } else {
          console.warn("⚠️ extraData is empty!");
        }
      } else {
        // Payment failed
        console.log(`❌ Result code != 0 (FAILED): ${resultCode}`);

        if (extraData) {
          const booking = await Booking.findById(extraData);
          if (booking) {
            booking.payments.push({
              amount: parseInt(amount) || 0,
              method: "momo",
              transactionId: transId,
              status: "failed",
              paidAt: new Date(),
            });

            await booking.save();
            console.log(
              `⚠️ Payment failed for booking ${booking._id}, will auto-expire`
            );
          }
        }
      }
    }

    res.render("booking-success");
  } catch (error) {
    console.error("Booking success page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

// GET /booking-details/:bookingId
const bookingDetails = async (req, res) => {
  try {
    res.render("booking-detail", {
      bookingId: req.params.bookingId,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking details page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

// GET /my-bookings
const myBookings = async (req, res) => {
  try {
    res.render("my-bookings", {
      user: req.user,
    });
  } catch (error) {
    console.error("My bookings page error:", error);
    res.status(500).send("Lỗi hiển thị trang");
  }
};

module.exports = { bookingPage, bookingSuccess, bookingDetails, myBookings };
