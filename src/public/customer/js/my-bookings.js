import { apiGet, apiPost } from "../../utils/api.js";
import { Notification } from "../../utils/modal.js";

let bookings = [];
let filteredBookings = [];
let currentFeedback = { bookingId: null, rating: 0 };

async function loadBookings() {
  try {
    const response = await apiGet("/api/bookings/user/bookings");
    const result = await response.json();

    if (!result.success) {
      showError();
      return;
    }

    bookings = result.data || [];
    filteredBookings = bookings;
    displayBookings();
  } catch (error) {
    console.error("Error:", error);
    showError();
  }
}

function displayBookings() {
  const container = document.getElementById("bookings-container");
  const emptyState = document.getElementById("empty-state");

  if (filteredBookings.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  container.innerHTML = filteredBookings
    .map((booking) => createBookingCard(booking))
    .join("");

  // Add click handlers
  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const bookingId = e.target.dataset.bookingId;
      window.location.href = `/booking-details/${bookingId}`;
    });
  });
  // Review buttons
  document.querySelectorAll("[data-review-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-review-id");
      openFeedbackModal(id);
    });
  });
}

function createBookingCard(booking) {
  const tour = booking.tourId || {};
  const tourName = tour.name || "(Tour không còn tồn tại)";
  const tourSlug = tour.slug;
  const statusBadge = getStatusBadge(booking.bookingStatus);
  const paymentBadge = getPaymentStatusBadge(booking.paymentStatus);
  const canReview = booking.bookingStatus === "completed" && !booking.reviewId;
  const canViewReview = Boolean(booking.reviewId && tourSlug);

  return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">${tourName}</h3>
                <p class="text-sm text-gray-500">Mã đơn: <span class="font-mono font-semibold">${
                  booking.bookingCode
                }</span></p>
              </div>
              <div class="flex gap-2">
                ${statusBadge}
                ${paymentBadge}
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-b border-gray-200">
              <div>
                <p class="text-sm text-gray-500">Ngày khởi hành</p>
                <p class="font-semibold text-gray-900">${formatDate(
                  booking.departureDate
                )}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Số khách</p>
                <p class="font-semibold text-gray-900">${
                  booking.numberOfPeople
                } người</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Tổng tiền</p>
                <p class="font-semibold text-blue-600">${formatPrice(
                  booking.totalAmount
                )}₫</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Ngày đặt</p>
                <p class="font-semibold text-gray-900">${formatDate(
                  booking.createdAt
                )}</p>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                class="view-details-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                data-booking-id="${booking._id}"
              >
                <i class="bi bi-eye mr-2"></i>Xem chi tiết
              </button>
              <a
                href="${tourSlug ? `/booking/${tourSlug}` : "#"}"
                class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-center transition-colors"
              >
                <i class="bi bi-arrow-repeat mr-2"></i>Đặt lại
              </a>
              ${
                canReview
                  ? `<button class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors" data-review-id="${booking._id}">
                      <i class="fas fa-star mr-2"></i>Đánh giá
                     </button>`
                  : canViewReview
                  ? `<a class="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-2 px-4 rounded-lg text-center transition-colors" href="/tours/${tourSlug}/feedbacks">
                       <i class=\"fas fa-comment-dots mr-2\"></i>Xem nhận xét
                     </a>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
}

function getStatusBadge(status) {
  const badges = {
    pre_booking:
      '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Đang hủy</span>',
    pending:
      '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">Chờ xác nhận</span>',
    confirmed:
      '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Đã xác nhận</span>',
    refund_requested:
      '<span class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">Chờ hoàn tiền</span>',
    refunded:
      '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Đã hoàn tiền</span>',
    completed:
      '<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">Hoàn thành</span>',
    cancelled:
      '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Đã hủy</span>',
  };
  return badges[status] || status;
}

function getPaymentStatusBadge(status) {
  const badges = {
    pending:
      '<span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">Chờ TT</span>',
    paid: '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Đã TT</span>',
    partial:
      '<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">TT 1 phần</span>',
    refunded:
      '<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Hoàn tiền</span>',
  };
  return badges[status] || status;
}

function formatDate(dateStr) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateStr).toLocaleDateString("vi-VN", options);
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(price));
}

function showError() {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("error-state").classList.remove("hidden");
}

// Search and Filter
document.getElementById("search-box").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  filteredBookings = bookings.filter(
    (b) =>
      b.bookingCode.toLowerCase().includes(query) ||
      (b.tourId?.name || "").toLowerCase().includes(query)
  );
  displayBookings();
});

document.getElementById("status-filter").addEventListener("change", (e) => {
  const status = e.target.value;
  filteredBookings = status
    ? bookings.filter((b) => b.bookingStatus === status)
    : bookings;
  displayBookings();
});

// Load bookings on page load
window.addEventListener("DOMContentLoaded", () => {
  loadBookings();
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
});

// ==========================
// Feedback modal handlers
// ==========================
function openFeedbackModal(bookingId) {
  currentFeedback = { bookingId, rating: 0 };
  const modal = document.getElementById("feedbackModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  // reset
  setStarVisual(0);
  document.getElementById("fb-comment").value = "";
}

function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function setStarVisual(n) {
  const stars = document.querySelectorAll("#fb-stars [data-star]");
  stars.forEach((i) => {
    const idx = Number(i.getAttribute("data-star"));
    i.classList.toggle("text-yellow-400", idx <= n);
    i.classList.toggle("text-gray-300", idx > n);
  });
  document.getElementById("fb-stars-text").textContent =
    n > 0 ? `${n}/5` : "Chọn số sao";
}

document.getElementById("fb-stars").addEventListener("mousemove", (e) => {
  const t = e.target.closest("[data-star]");
  if (!t) return;
  setStarVisual(Number(t.getAttribute("data-star")));
});
document.getElementById("fb-stars").addEventListener("click", (e) => {
  const t = e.target.closest("[data-star]");
  if (!t) return;
  currentFeedback.rating = Number(t.getAttribute("data-star"));
  setStarVisual(currentFeedback.rating);
});
document
  .getElementById("fb-close")
  .addEventListener("click", closeFeedbackModal);
document
  .getElementById("fb-cancel")
  .addEventListener("click", closeFeedbackModal);

document.getElementById("fb-submit").addEventListener("click", async () => {
  if (!currentFeedback.bookingId || !currentFeedback.rating) {
    Notification.error("Vui lòng chọn số sao");
    return;
  }
  const body = JSON.stringify({
    bookingId: currentFeedback.bookingId,
    rating: currentFeedback.rating,
    comment: document.getElementById("fb-comment").value.trim(),
  });
  try {
    const res = await apiPost("/api/feedbacks", body);
    const result = await res.json();
    if (!res.ok) {
      Notification.error(result.message || "Gửi đánh giá thất bại");
      return;
    }
    Notification.success("Cảm ơn bạn đã đánh giá!");
    closeFeedbackModal();
    loadBookings();
  } catch (err) {
    console.error(err);
    Notification.error("Có lỗi xảy ra");
  }
});
