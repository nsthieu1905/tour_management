import moment from "https://cdn.jsdelivr.net/npm/moment@2.29.4/+esm";

function thumbnail(images) {
  return images && images.length > 0 ? images[0] : "/uploads/default.jpg";
}

function badgeClass(type) {
  switch (type) {
    case "Giá tốt":
      return "badge-giatot";
    case "Cao cấp":
      return "badge-caocap";
    case "Tiêu chuẩn":
      return "badge-tieuchuan";
    case "Tiết kiệm":
      return "badge-tietkiem";
    default:
      return "";
  }
}

function badgeIcon(type) {
  switch (type) {
    case "Giá tốt":
      return "fa-tag";
    case "Cao cấp":
      return "fa-gem";
    case "Tiêu chuẩn":
      return "fa-medal";
    case "Tiết kiệm":
      return "fa-crown";
    default:
      return "fa-ticket";
  }
}

function formatPrice(price) {
  if (isNaN(price)) return "0";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(date) {
  if (!date) return "";
  const value = Array.isArray(date) ? date[0] : date; // nếu là mảng thì lấy phần tử đầu tiên
  return moment(value).format("DD/MM/YYYY");
}

function sub(a, b) {
  return a - b;
}

export { thumbnail, badgeClass, badgeIcon, formatPrice, formatDate, sub };
