import { apiGet } from "../../utils/api.js";

// Định dạng giá tiền
function formatPrice(num) {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Lấy thông tin booking từ sessionStorage HOẶC localStorage, sau đó fallback sang server
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

// Cập nhật UI với dữ liệu booking
function updateBookingUI(booking) {
  if (booking.bookingCode) {
    document.getElementById("booking-code").textContent = booking.bookingCode;
  }
  if (booking.totalPrice) {
    document.getElementById("booking-total").textContent =
      formatPrice(parseInt(booking.totalPrice)) + "₫";
  }

  // Sử dụng payment method từ booking object (hoặc fallback kiểm tra paymentStatus)
  const paymentMethod =
    booking.paymentMethod ||
    (booking.paymentStatus === "paid" ? "momo" : "cash");
  updateStatusBadge(paymentMethod);

  setupViewDetailsButton(booking._id);
}

// Nếu sessionStorage trống (sau khi F5), lấy từ server
if (!bookingCode || !bookingTotal) {
  if (bookingId) {
    apiGet(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          updateBookingUI(result.data);
        } else {
          // Hiển thị trạng thái mặc định/lỗi
          document.getElementById("booking-code").textContent = "BK000000";
          document.getElementById("booking-total").textContent = "--";
        }
      })
      .catch((err) => {
        document.getElementById("booking-code").textContent = "BK000000";
        document.getElementById("booking-total").textContent = "--";
      });
  }
} else {
  // SessionStorage có dữ liệu, sử dụng nó
  document.getElementById("booking-code").textContent = bookingCode;
  document.getElementById("booking-total").textContent =
    formatPrice(parseInt(bookingTotal)) + "₫";

  // Cập nhật badge trạng thái thanh toán
  if (paymentMethod) {
    updateStatusBadge(paymentMethod);
  }
}

// Cập nhật badge trạng thái thanh toán
function updateStatusBadge(method) {
  const statusBadge = document.getElementById("payment-status");

  if (method === "cash") {
    statusBadge.className =
      "px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Chờ thanh toán";
  } else if (method === "bank_transfer") {
    statusBadge.className =
      "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Đã thanh toán";
  } else {
    statusBadge.className =
      "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium";
    statusBadge.textContent = "Đã thanh toán";
  }
}

// Thiết lập nút xem chi tiết
function setupViewDetailsButton(id) {
  const viewDetailsBtn = document.getElementById("view-details-btn");
  if (viewDetailsBtn) {
    viewDetailsBtn.href = `/booking-details/${id}`;
  }
}

// Xóa sessionStorage nhưng giữ localStorage để F5 reload
sessionStorage.removeItem("bookingId");
sessionStorage.removeItem("bookingCode");
sessionStorage.removeItem("bookingTotal");
sessionStorage.removeItem("paymentMethod");

// Xóa localStorage khi người dùng rời khỏi trang booking-success
// Xóa khi người dùng click nút "Về trang chủ"
document.querySelectorAll('a[href="/"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.removeItem("bookingId");
    localStorage.removeItem("bookingCode");
    localStorage.removeItem("bookingTotal");
    localStorage.removeItem("paymentMethod");
  });
});

// Xóa dữ liệu booking cũ nếu đã quá 30 phút
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
