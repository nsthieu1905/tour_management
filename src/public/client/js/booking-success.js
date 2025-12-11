// Simple price formatter (replicate of formatPrice)
function formatPrice(num) {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Get booking info from sessionStorage OR localStorage first, then fallback to server
let bookingCode =
  sessionStorage.getItem("bookingCode") || localStorage.getItem("bookingCode");
let bookingId =
  sessionStorage.getItem("bookingId") ||
  localStorage.getItem("bookingId") ||
  window.serverBookingId;
let bookingTotal =
  sessionStorage.getItem("bookingTotal") ||
  localStorage.getItem("bookingTotal");
let paymentMethod =
  sessionStorage.getItem("paymentMethod") ||
  localStorage.getItem("paymentMethod");

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

// Clear sessionStorage but keep localStorage for F5 reload
// Only clear when user leaves the page (by clicking home button or similar)
sessionStorage.removeItem("bookingId");
sessionStorage.removeItem("bookingCode");
sessionStorage.removeItem("bookingTotal");
sessionStorage.removeItem("paymentMethod");

// Clear localStorage when user navigates away from booking-success
// Option 1: Clear when user clicks "Về trang chủ" button
document.querySelectorAll('a[href="/"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.removeItem("bookingId");
    localStorage.removeItem("bookingCode");
    localStorage.removeItem("bookingTotal");
    localStorage.removeItem("paymentMethod");
  });
});

// Option 2: Clear after 30 minutes or when creating a new booking
// Clean up old booking data if more than 30 minutes have passed
const lastBookingTime = localStorage.getItem("lastBookingTime");
const currentTime = new Date().getTime();
if (
  lastBookingTime &&
  currentTime - parseInt(lastBookingTime) > 30 * 60 * 1000
) {
  localStorage.removeItem("bookingId");
  localStorage.removeItem("bookingCode");
  localStorage.removeItem("bookingTotal");
  localStorage.removeItem("paymentMethod");
  localStorage.removeItem("lastBookingTime");
}
