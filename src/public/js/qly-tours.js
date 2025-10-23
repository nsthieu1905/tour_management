import {
  thumbnail,
  badgeClass,
  badgeIcon,
  formatPrice,
  formatDate,
  sub,
} from "./helper.js";

//========================
// QUẢN LÝ TOUR - qly-tours.js
//========================

// Chờ DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  initTourManagement();
  initDeleteTourButtons();
});

// ===========================
// KHỞI TẠO QUẢN LÝ TOUR
// ===========================

function initTourManagement() {
  // Xử lý form submit tour
  const tourForm = document.querySelector("#tourForm");
  if (tourForm) {
    tourForm.addEventListener("submit", function (e) {
      console.log("Tour form submitted");
    });
  }

  // Khởi tạo chức năng ngày khởi hành
  initDepartureDates();

  // Khởi tạo preview ảnh tour
  initTourImagePreview();

  // Khởi tạo modal handlers
  initTourModalHandlers();
}

// ===========================
// XỬ LÝ NGÀY KHỞI HÀNH
// ===========================

let departureDates = [];

function initDepartureDates() {
  const departureInput = document.getElementById("departureInput");
  const departureList = document.getElementById("departureList");

  if (!departureInput || !departureList) return;

  departureInput.addEventListener("change", () => {
    const date = departureInput.value;
    if (date && !departureDates.includes(date)) {
      departureDates.push(date);
      departureDates.sort((a, b) => new Date(a) - new Date(b));
      renderDepartures();
    }
    departureInput.value = "";
  });
}

function renderDepartures() {
  const departureList = document.getElementById("departureList");
  const departuresData = document.getElementById("departuresData");

  if (!departureList) return;

  departureList.innerHTML = "";
  departureDates.forEach((date, index) => {
    const formatted = new Date(date).toLocaleDateString("vi-VN");
    const item = document.createElement("div");
    item.className = "departure-item";
    item.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      margin: 4px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 6px;
      font-size: 14px;
    `;
    item.innerHTML = `
      <span>${formatted}</span>
      <button type="button" 
        onclick="removeDeparture(${index})"
        style="background: none; border: none; color: #4f46e5; cursor: pointer; font-size: 18px; padding: 0; line-height: 1;">
        ✕
      </button>
    `;
    departureList.appendChild(item);
  });

  // Cập nhật vào hidden input dưới dạng JSON
  if (departuresData) {
    departuresData.value = JSON.stringify(departureDates);
  }
}

// Expose function globally để có thể gọi từ onclick
window.removeDeparture = function (index) {
  departureDates.splice(index, 1);
  renderDepartures();
};

// ===========================
// XỬ LÝ PREVIEW ẢNH TOUR
// ===========================

let imagesArray = [];

function initTourImagePreview() {
  const tourImages = document.getElementById("tourImages");
  const imagePreview = document.getElementById("imagePreview");

  if (!tourImages || !imagePreview) return;

  // Xử lý khi chọn file
  tourImages.addEventListener("change", function (e) {
    const files = Array.from(this.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagesArray.push({
          src: e.target.result,
          file: file,
        });
        renderImagePreview();
      };
      reader.readAsDataURL(file);
    });
  });

  // Xử lý drag & drop cho upload container
  const uploadContainer = document.getElementById("uploadContainer");
  if (uploadContainer) {
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
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            imagesArray.push({
              src: ev.target.result,
              file: file,
            });
            renderImagePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }
}

function renderImagePreview() {
  const imagePreview = document.getElementById("imagePreview");
  if (!imagePreview) return;

  imagePreview.innerHTML = "";
  imagesArray.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "relative group";
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      margin: 8px;
    `;

    const img = document.createElement("img");
    img.src = item.src;
    img.style.cssText = `
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "✕";
    removeBtn.type = "button";
    removeBtn.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // Hiện nút xóa khi hover
    wrapper.addEventListener("mouseenter", () => {
      removeBtn.style.opacity = "1";
    });
    wrapper.addEventListener("mouseleave", () => {
      removeBtn.style.opacity = "0";
    });

    removeBtn.onclick = () => {
      imagesArray.splice(index, 1);
      renderImagePreview();
      updateFileInput();
    };

    // Hiển thị badge "Ảnh đại diện" cho ảnh đầu tiên
    if (index === 0) {
      const badge = document.createElement("span");
      badge.textContent = "Ảnh đại diện";
      badge.style.cssText = `
        position: absolute;
        bottom: 4px;
        left: 4px;
        background: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      `;
      wrapper.appendChild(badge);
    }

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    imagePreview.appendChild(wrapper);
  });
}

function updateFileInput() {
  const tourImages = document.getElementById("tourImages");
  if (!tourImages) return;

  // Tạo DataTransfer mới để cập nhật files
  const dataTransfer = new DataTransfer();
  imagesArray.forEach((item) => {
    if (item.file) {
      dataTransfer.items.add(item.file);
    }
  });
  tourImages.files = dataTransfer.files;
}

// ===========================
// XỬ LÝ MODAL TOUR
// ===========================

function initTourModalHandlers() {
  const modal = document.getElementById("addTourModal");
  if (!modal) return;

  // Expose global functions cho modal
  window.showAddTourModal = function () {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.hideAddTourModal = function () {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";

    // Reset form
    const form = modal.querySelector("form");
    if (form) form.reset();

    // Clear previews
    const preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = "";

    const departureList = document.getElementById("departureList");
    if (departureList) departureList.innerHTML = "";

    // Reset mảng
    departureDates = [];
    imagesArray = [];
  };

  // Đóng modal khi click bên ngoài
  modal.addEventListener("click", function (e) {
    if (e.target === this) {
      window.hideAddTourModal();
    }
  });

  // Đóng modal khi nhấn ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddTourModal();
    }
  });
}

// ===========================
// XOÁ TOUR
// ===========================

function initDeleteTourButtons() {
  const deleteButtons = document.querySelectorAll(".delete-tour-btn");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async function () {
      const tourId = this.dataset.id;
      const tourName = this.dataset.name || "tour này";

      const confirmed = confirm(`Bạn có chắc muốn xoá ${tourName} không?`);
      if (!confirmed) return;

      try {
        const res = await fetch(`/admin/qly-tour/${tourId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          alert("Xoá tour thành công!");

          const row = this.closest("tr");
          if (row) {
            row.style.opacity = "0";
            setTimeout(() => row.remove(), 300);
          } else {
            window.location.reload();
          }
        } else {
          const err = await res.text();
          alert("Lỗi khi xoá tour: " + err);
        }
      } catch (err) {
        console.error("Delete tour error:", err);
        alert("Đã có lỗi xảy ra khi xoá tour!");
      }
    });
  });
}

// ===========================
// EDIT TOUR (Optional)
// ===========================

window.editTour = function (tourId) {
  console.log("Edit tour:", tourId);
};

window.viewTourDetails = function (tourId) {
  console.log("View tour:", tourId);
};

// ===========================
// LOAD MORE TOURS (Optional)
// ===========================

async function getTours() {
  try {
    const res = await fetch("/api/tours");
    const result = await res.json();
    const container = document.getElementById("tours-list");

    if (!result || result.length === 0) {
      container.innerHTML = `
      <div class="text-center py-20 bg-white rounded-xl shadow-sm">
        <i class="fas fa-suitcase-rolling text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          Chưa có tour nào được thêm
        </h3>
        <p class="text-gray-500 mb-6">
          Hãy bắt đầu bằng cách thêm tour đầu tiên của bạn.
        </p>
        <button
          onclick="showAddTourModal()"
          class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          <i class="fas fa-plus mr-2"></i>Thêm tour đầu tiên
        </button>
      </div>
      `;
      return;
    } else {
      container.innerHTML = result.data
        .map(
          (tour) => `
      <div class="tour-card card-hover rounded-xl shadow-sm overflow-hidden">
          <div class="h-48 relative">
            <img
              src="${thumbnail(tour.images)}"
              alt="${tour.name}"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-4 left-4">
              <span class="tour-badge ${badgeClass(tour.tourType)}">
                <i class="fas ${badgeIcon(tour.tourType)}"></i>
                ${tour.tourType}
              </span>
            </div>
            <div class="absolute top-4 right-4">
              <button
                class="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200 shadow-md hover:shadow-lg"
                data-id="${tour._id}"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="absolute bottom-4 left-4 text-white">
              <h3 class="text-xl font-bold">${tour.name}</h3>
              <p class="text-sm opacity-90">
                ${tour.duration.days} ngày ${tour.duration.nights} đêm
              </p>
            </div>
          </div>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <span class="text-2xl font-bold text-blue-600">
                ${formatPrice(tour.price)} VND
              </span>
              <div class="text-right">
                <p class="text-sm text-gray-600">Còn lại</p>
                <p class="text-lg font-semibold text-orange-600">
                  ${sub(tour.capacity.max, tour.capacity.current)}/${
            tour.capacity.max
          } chỗ
                </p>
              </div>
            </div>
            <div
              class="flex items-center justify-between text-sm text-gray-600 mb-4"
            >
              <span>
                <i class="fas fa-calendar mr-1"></i>${formatDate(
                  tour.departureDates
                )}
              </span>
              <span>
                <i class="fas fa-users mr-1 text-blue-600"></i
                >${tour.capacity.current}
              </span>
              <span>
                <i class="fas fa-star mr-1 text-yellow-400"></i
                >${tour.rating.average} (${tour.rating.count})
              </span>
            </div>
            <div class="flex space-x-2">
              <button
                class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i class="fas fa-edit mr-1"></i>Chỉnh sửa
              </button>
              <button
                class="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <i class="fas fa-eye mr-1"></i>Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
getTours();

// ===========================
// ADD TOUR
// ===========================

function createTour() {
  const form = document.getElementById("addTourForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Lấy departureDates từ hidden input và parse JSON
    const departuresDataInput = document.getElementById("departuresData");
    if (departuresDataInput && departuresDataInput.value) {
      try {
        const dates = JSON.parse(departuresDataInput.value);

        // Xóa departureDates cũ nếu có
        formData.delete("departureDates");

        // Thêm từng ngày vào formData
        dates.forEach((date) => {
          formData.append("departureDates[]", date);
        });
      } catch (err) {
        console.error("Error parsing departure dates:", err);
      }
    }

    console.log("FormData keys:", [...formData.keys()]);
    console.log("FormData values:", [...formData.values()]);

    try {
      const response = await fetch("/api/tours/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Tạo tour thành công!");
        form.reset();
        departureDates = []; // Reset mảng
        renderDepartures(); // Clear UI
        window.hideAddTourModal();
        getTours(); // Reload danh sách tour
      } else {
        alert(result.message || "Có lỗi xảy ra!");
        console.error(result);
      }
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      alert("Đã có lỗi xảy ra!");
    }
  });
}

createTour();
