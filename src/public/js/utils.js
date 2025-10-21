// ===========================
// KHỞI TẠO ỨNG DỤNG
// ===========================

/**
 * Khởi tạo ứng dụng khi trang được load
 * - Khởi tạo biểu đồ thống kê
 * - Render bảng nhân viên (nếu có)
 * - Gán sự kiện cho sidebar và search
 */
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo biểu đồ ngay khi load trang
  const statsSection = document.getElementById("statistics");
  const wasHidden = statsSection && statsSection.classList.contains("hidden");

  // Tạm thời hiện section thống kê để khởi tạo biểu đồ
  if (wasHidden) {
    statsSection.classList.remove("hidden");
  }

  // Khởi tạo các biểu đồ
  initCharts();

  // Ẩn lại section nếu ban đầu nó bị ẩn
  if (wasHidden) {
    statsSection.classList.add("hidden");
  }

  // Khởi tạo phần quản lý nhân viên (nếu có)
  const staffTableBody = document.getElementById("staffTableBody");
  if (staffTableBody) {
    renderStaffTable();
    updateStaffStats();
  }

  // Thêm sự kiện click cho các item sidebar
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      const onclickAttr = this.getAttribute("onclick");
      if (onclickAttr) {
        const match = onclickAttr.match(/showSection\('(.+)'\)/);
        if (match) {
          e.preventDefault();
          const sectionId = match[1];
          showSection(sectionId);
        }
      }
    });
  });

  // Thêm chức năng tìm kiếm nhân viên
  const staffSearchInput = document.getElementById("staffSearchInput");
  if (staffSearchInput) {
    staffSearchInput.addEventListener("input", function (e) {
      searchStaff(e.target.value);
    });
  }

  // Xử lý submit form thêm nhân viên
  const addStaffForm = document.getElementById("addStaffForm");
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addNewStaff();
    });
  }
});

/**
 * Thêm các tính năng tương tác
 * - Mô phỏng thông báo real-time
 * - Hiệu ứng hover cho các card
 */
document.addEventListener("DOMContentLoaded", function () {
  // Mô phỏng thông báo real-time
  setInterval(() => {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      const currentCount = parseInt(badge.textContent) || 0;
      if (Math.random() > 0.95) {
        // 5% xác suất mỗi giây
        badge.textContent = currentCount + 1;
      }
    }
  }, 1000);

  // Thêm hiệu ứng hover cho các card
  const cards = document.querySelectorAll(".card-hover");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
      this.style.transition = "transform 0.3s ease";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });
});

// ===========================
// QUẢN LÝ NAVIGATION & LAYOUT
// ===========================

// Highlight khi load trang lần đầu
document.addEventListener("DOMContentLoaded", highlightCurrentPage);

// Highlight khi Turbo load trang mới (không reload)
document.addEventListener("turbo:load", highlightCurrentPage);

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar-item");

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");

    // Xóa highlight cũ
    link.classList.remove(
      "bg-gradient-to-r",
      "from-blue-500",
      "to-purple-600",
      "text-white"
    );
    link.classList.add("text-gray-700");

    // Thêm highlight cho trang hiện tại
    if (currentPath === href || currentPath.startsWith(href + "/")) {
      link.classList.add(
        "bg-gradient-to-r",
        "from-blue-500",
        "to-purple-600",
        "text-white"
      );
      link.classList.remove("text-gray-700");
    }
  });
  // Khởi tạo lại charts nếu có
  if (typeof initCharts === "function") {
    setTimeout(initCharts, 100);
  }
}

/**
 * Chuyển đổi chế độ sáng/tối (Dark mode)
 * Thay đổi icon và class của body
 */
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode");

  const icon = document.querySelector(".fa-moon");
  if (icon) {
    if (isDarkMode) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  }
}

/**
 * Đăng xuất khỏi hệ thống
 */
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    alert("Đăng xuất thành công!");
    // Có thể redirect về trang login: window.location.href = '/login';
  }
}

// ===========================
// QUẢN LÝ MODAL
// ===========================

// Hiển thị modal thêm tour
function showAddTourModal() {
  const modal = document.getElementById("addTourModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Ngăn scroll trang chính
}

// Ẩn modal thêm tour
function hideAddTourModal() {
  const modal = document.getElementById("addTourModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";

  // Reset form khi đóng modal
  const form = modal.querySelector("form");
  if (form) {
    form.reset();
  }
}
// Reset form khi submit
document
  .getElementById("addTourForm")
  ?.addEventListener("submit", function (e) {
    // Nếu bạn đang gửi form qua AJAX thì nên gọi preventDefault()
    e.preventDefault();

    // Giả sử submit xong (hoặc khi nhận response OK)
    this.reset(); // Reset form
    hideAddTourModal(); // Ẩn modal luôn
  });

// Đóng modal khi click bên ngoài
document
  .getElementById("addTourModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) {
      hideAddTourModal();
    }
  });

// Đóng modal khi nhấn phím ESC
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("addTourModal");
    if (modal && !modal.classList.contains("hidden")) {
      hideAddTourModal();
    }
  }
});

// Xử lý chọn nhiều ngày khởi hành
const departureInput = document.getElementById("departureInput");
const departureList = document.getElementById("departureList");
const departuresData = document.getElementById("departuresData");

let departures = [];

departureInput.addEventListener("change", () => {
  const date = departureInput.value;
  if (date && !departures.includes(date)) {
    departures.push(date);
    departures.sort((a, b) => new Date(a) - new Date(b)); // Sắp xếp ngày tháng
    renderDepartures();
  }
  departureInput.value = "";
});

function renderDepartures() {
  departureList.innerHTML = "";
  departures.forEach((date, index) => {
    // Format lại ngày kiểu: dd/mm/yyyy
    const formatted = new Date(date).toLocaleDateString("vi-VN");
    const item = document.createElement("div");
    item.className = "departure-item";
    item.innerHTML = `
      <span>${formatted}</span>
      <button type="button" onclick="removeDeparture(${index})">✕</button>
    `;
    departureList.appendChild(item);
  });

  departuresData.value = JSON.stringify(departures);
}

function removeDeparture(index) {
  departures.splice(index, 1);
  renderDepartures();
}

// Xử lý hiển thị ảnh
const tourImagesInput = document.getElementById("tourImages");
const imagePreview = document.getElementById("imagePreview");
const imagesData = document.getElementById("imagesData");
const thumbnailData = document.getElementById("thumbnailData");

let imagesArray = [];

tourImagesInput.addEventListener("change", () => {
  const files = Array.from(tourImagesInput.files);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagesArray.push(e.target.result);
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
});

function renderPreview() {
  imagePreview.innerHTML = "";
  imagesArray.forEach((src, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-preview-item";
    if (index === 0) wrapper.classList.add("thumbnail");

    const img = document.createElement("img");
    img.src = src;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "✕";
    removeBtn.onclick = () => {
      imagesArray.splice(index, 1);
      renderPreview();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    imagePreview.appendChild(wrapper);
  });

  // Gán dữ liệu vào input hidden để gửi về server
  imagesData.value = JSON.stringify(imagesArray);
  thumbnailData.value = imagesArray.length > 0 ? imagesArray[0] : "";
}

// Tùy chọn: hỗ trợ kéo thả ảnh
const uploadContainer = document.getElementById("uploadContainer");
uploadContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadContainer.style.background =
    "linear-gradient(135deg, #eef2ff, #e0e7ff)";
});

uploadContainer.addEventListener("dragleave", () => {
  uploadContainer.style.background = "#f9fafb";
});

uploadContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadContainer.style.background = "#f9fafb";

  const files = Array.from(e.dataTransfer.files);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagesArray.push(ev.target.result);
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Lấy chữ cái đầu của tên để làm avatar
 * @param {string} name - Tên đầy đủ
 * @returns {string} Chữ cái đầu (tối đa 2 ký tự)
 */
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Lấy mã màu ngẫu nhiên cho avatar
 * @returns {string} Mã màu hex (không có #)
 */
function getRandomColor() {
  const colors = ["667eea", "10b981", "f59e0b", "ef4444", "8b5cf6", "06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Lấy class CSS tương ứng với trạng thái nhân viên
 * @param {string} status - Trạng thái nhân viên
 * @returns {string} Class CSS
 */
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "leave":
      return "bg-yellow-100 text-yellow-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Chuyển đổi mã trạng thái sang text hiển thị
 * @param {string} status - Mã trạng thái
 * @returns {string} Text hiển thị
 */
function getStatusText(status) {
  switch (status) {
    case "active":
      return "Đang làm việc";
    case "leave":
      return "Nghỉ phép";
    case "inactive":
      return "Nghỉ việc";
    default:
      return "Không xác định";
  }
}

/**
 * Định dạng ngày theo chuẩn Việt Nam
 * @param {string} dateString - Chuỗi ngày định dạng ISO
 * @returns {string} Ngày định dạng dd/mm/yyyy
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

/**
 * Định dạng số tiền theo chuẩn Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} Số tiền đã định dạng (VD: 25.000.000 ₫)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
