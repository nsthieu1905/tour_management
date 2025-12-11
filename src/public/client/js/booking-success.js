// Simple price formatter (replicate of formatPrice)
function formatPrice(num) {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Get booking info from sessionStorage first, then fallback to server
let bookingCode = sessionStorage.getItem("bookingCode");
let bookingId = sessionStorage.getItem("bookingId") || window.serverBookingId;
let bookingTotal = sessionStorage.getItem("bookingTotal");
let paymentMethod = sessionStorage.getItem("paymentMethod");

console.log("Initial state:", {
  bookingCode,
  bookingId,
  bookingTotal,
  paymentMethod,
  serverBookingId: window.serverBookingId,
});

// Function to update UI with booking data
function updateBookingUI(booking) {
  if (booking.bookingCode) {
    document.getElementById("booking-code").textContent = booking.bookingCode;
  }
  if (booking.totalPrice) {
    document.getElementById("booking-total").textContent =
      formatPrice(parseInt(booking.totalPrice)) + "₫";
  }

  // Determine payment method from payment status
  const paymentMethod = booking.paymentStatus === "paid" ? "momo" : "cash";
  updateStatusBadge(paymentMethod);

  setupViewDetailsButton(booking._id);
}

// If sessionStorage is empty (after F5), fetch from server
if (!bookingCode || !bookingTotal) {
  if (bookingId) {
    console.log(
      "SessionStorage empty, fetching from server for bookingId:",
      bookingId
    );
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          console.log("Got booking from API:", result.data);
          updateBookingUI(result.data);
        } else {
          console.log("Could not fetch booking from API");
          // Show default/error state
          document.getElementById("booking-code").textContent = "BK000000";
          document.getElementById("booking-total").textContent = "--";
        }
      })
      .catch((err) => {
        console.error("Error fetching booking:", err);
        document.getElementById("booking-code").textContent = "BK000000";
        document.getElementById("booking-total").textContent = "--";
      });
  }
} else {
  // SessionStorage has data, use it
  console.log("Using data from sessionStorage");
  document.getElementById("booking-code").textContent = bookingCode;
  document.getElementById("booking-total").textContent =
    formatPrice(parseInt(bookingTotal)) + "₫";
}

// Function to update status badge
function updateStatusBadge(method) {
  const statusBadge = document.getElementById("payment-status");

  if (method === "cash") {
    console.log("Setting cash status - Chờ thanh toán");
    statusBadge.className =
      "px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Chờ thanh toán";
  } else if (method === "bank_transfer") {
    console.log("Setting bank_transfer status - Đã thanh toán");
    statusBadge.className =
      "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Đã thanh toán";
  } else {
    console.log("Setting momo or default status - Đã thanh toán");
    statusBadge.className =
      "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Đã thanh toán";
  }
}

// Function to set up view details button
function setupViewDetailsButton(id) {
  const viewDetailsBtn = document.getElementById("view-details-btn");
  if (viewDetailsBtn) {
    viewDetailsBtn.href = `/booking-details/${id}`;
  }
}

// Clear sessionStorage after reading
sessionStorage.removeItem("bookingId");
sessionStorage.removeItem("bookingCode");
sessionStorage.removeItem("bookingTotal");
sessionStorage.removeItem("paymentMethod");
