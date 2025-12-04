const sum = (a, b) => {
  return a + b;
};

const sub = (a, b) => {
  return a - b;
};

const eq = (a, b) => {
  return a === b;
};

const thumbnail = (images) => {
  return images && images.length > 0 ? images[0] : "/uploads/default.jpg";
};

const badgeClass = (type) => {
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
};

const badgeIcon = (type) => {
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
};

const formatPrice = (price) => {
  if (isNaN(price)) return "0";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatDate = (date) => {
  if (!date) return "";

  // Handle array of dates or array of {date, price} objects
  let value = Array.isArray(date) ? date[0] : date;

  // If it's an object with a date property, extract the date
  if (typeof value === "object" && value !== null && value.date) {
    value = value.date;
  }

  const d = new Date(value);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return "";
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export {
  sum,
  sub,
  eq,
  thumbnail,
  badgeClass,
  badgeIcon,
  formatPrice,
  formatDate,
};
