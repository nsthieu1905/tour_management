const pathParts = window.location.pathname.split("/");
const bookingId = pathParts[pathParts.length - 1];
if (!bookingId) {
  showError("Không có mã đơn");
} else {
  loadBookingDetail(bookingId);
}
async function loadBookingDetail(id) {
  try {
    const res = await fetch(`/api/bookings/${id}`);
    const result = await res.json();
    if (!result.success) {
      showError(result.message);
      return;
    }
    displayBookingDetail(result.data);
  } catch (error) {
    showError("Có lỗi xảy ra");
  }
}
function displayBookingDetail(booking) {
  const tour = booking.tourId;
  document.getElementById("booking-code").querySelector("span").textContent =
    booking.bookingCode;
  document.getElementById("customer-name").textContent =
    booking.contactInfo.name;
  document.getElementById("customer-email").textContent =
    booking.contactInfo.email;
  document.getElementById("customer-phone").textContent =
    booking.contactInfo.phone;
  document.getElementById("tour-name").textContent = tour.name;
  document.getElementById("departure-date").textContent = new Date(
    booking.departureDate
  ).toLocaleDateString("vi-VN");
  document.getElementById("guest-count").textContent =
    booking.numberOfPeople + " người";
  const pricePerPerson = tour.price;
  const subtotal = booking.subtotal;
  const discountAmount = booking.discountAmount || 0;
  const total = booking.totalAmount;
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "₫";
  document.getElementById("price-per-person").textContent = fmt(pricePerPerson);
  document.getElementById("quantity").textContent = booking.numberOfPeople;
  document.getElementById("subtotal").textContent = fmt(subtotal);
  document.getElementById("total-amount").textContent = fmt(total);
  if (booking.couponId) {
    document.getElementById("coupon-section").classList.remove("hidden");
    document.getElementById("coupon-code").textContent = booking.couponId.code;
    document.getElementById("discount-amount").textContent =
      fmt(discountAmount);
  }
  const paymentLabels = {
    momo: "Ví MoMo",
    bank_transfer: "Chuyển khoản",
    cash: "Thanh toán khi tour",
    vnpay: "VNPay",
  };
  document.getElementById("payment-method").textContent =
    paymentLabels[booking.paymentMethod] || booking.paymentMethod;
  const statusBadge =
    {
      pending:
        '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Chờ TT</span>',
      paid: '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Đã TT</span>',
    }[booking.paymentStatus] || booking.paymentStatus;
  document.getElementById("payment-status").innerHTML = statusBadge;
  const bookingBadge =
    {
      pre_booking:
        '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">Đang hủy</span>',
      pending:
        '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Chờ xác nhận</span>',
      confirmed:
        '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Đã xác nhận</span>',
    }[booking.bookingStatus] || booking.bookingStatus;
  document.getElementById("booking-status").innerHTML = bookingBadge;
  if (booking.paymentStatus === "paid") {
    document.getElementById("success-banner").classList.remove("hidden");
  }
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
}
function showError(msg) {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("error-state").classList.remove("hidden");
}
