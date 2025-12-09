// Simple price formatter (replicate of formatPrice)
function formatPrice(num) {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Get booking info from sessionStorage
let bookingCode = sessionStorage.getItem("bookingCode") || "BK000000";
let bookingId = sessionStorage.getItem("bookingId");
let bookingTotal = sessionStorage.getItem("bookingTotal") || "0";
let paymentMethod = sessionStorage.getItem("paymentMethod");

console.log("Initial sessionStorage:", {
  bookingCode,
  bookingId,
  bookingTotal,
  paymentMethod,
});

document.getElementById("booking-code").textContent = bookingCode;
document.getElementById("booking-total").textContent =
  formatPrice(parseInt(bookingTotal)) + "₫";

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

// If paymentMethod not found in sessionStorage, try to fetch from booking
if (!paymentMethod && bookingId) {
  console.log("Fetching booking details to get paymentMethod...");
  fetch(`/api/bookings/${bookingId}`)
    .then((res) => res.json())
    .then((result) => {
      if (result.success && result.data) {
        paymentMethod = result.data.paymentMethod;
        console.log("Got paymentMethod from API:", paymentMethod);
        updateStatusBadge(paymentMethod);

        // Set up view details button
        setupViewDetailsButton(bookingId);
      } else {
        console.log("Could not fetch booking, using default (momo)");
        updateStatusBadge("momo");
      }
    })
    .catch((err) => {
      console.error("Error fetching booking:", err);
      updateStatusBadge("momo");
    });
} else {
  updateStatusBadge(paymentMethod);

  // Set up view details button
  if (bookingId) {
    setupViewDetailsButton(bookingId);
  }
}

// Function to set up view details button
function setupViewDetailsButton(id) {
  const viewDetailsBtn = document.getElementById("view-details-btn");
  if (viewDetailsBtn) {
    viewDetailsBtn.href = `/booking-details/${id}`;
  }
}

// Clear sessionStorage
sessionStorage.removeItem("bookingId");
sessionStorage.removeItem("bookingCode");
sessionStorage.removeItem("bookingTotal");
sessionStorage.removeItem("paymentMethod");
