import {
  thumbnail,
  badgeClass,
  badgeIcon,
  formatPrice,
  formatDate,
  sub,
} from "../../utils/helpers.js";
import { Modal, Notification } from "../../utils/modal.js";
import {
  apiCall,
  apiGet,
  apiPost,
  apiDelete,
  apiPatch,
} from "../../utils/api.js";

//================================
// QUẢN LÝ TOUR - qly-tours.js
//================================

// Socket.io initialization
let tourSocket = null;
function initTourSocket() {
  if (tourSocket) return;
  tourSocket = io();

  // Listen for tour updates from other admins
  tourSocket.on("tour:updated", (data) => {
    console.log("🔄 [Tour] Received tour update:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
  });

  // Listen for tour deletions
  tourSocket.on("tour:deleted", (data) => {
    console.log("🗑️ [Tour] Received tour delete:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
    if (document.getElementById("trash-list")) {
      getToursTrash();
    }
  });

  // Listen for tour restoration
  tourSocket.on("tour:restored", (data) => {
    console.log("♻️ [Tour] Received tour restore:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
    if (document.getElementById("trash-list")) {
      getToursTrash();
    }
  });

  // Listen for tour creation (for admins viewing the list)
  tourSocket.on("tour:created", (data) => {
    console.log("✨ [Tour] Received tour creation:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
  });
}

// Chờ DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  initTourManagement();
  initTourSocket();
  if (document.getElementById("tours-list")) getTours();
  if (document.getElementById("trash-list")) getToursTrash();
  if (document.getElementById("addTourForm")) createTour();
});

// ===========================
// KHỞI TẠO QUẢN LÝ TOUR
// ===========================

function initTourManagement() {
  // Khởi tạo chức năng ngày khởi hành
  initDepartureDates();

  // Khởi tạo preview ảnh tour
  initTourImagePreview();

  // Khởi tạo sinh trường lịch trình
  initItineraryGenerator();

  // Khởi tạo modal handlers
  modalHandlers(() => {
    departureDates = [];
    imagesArray = [];
    renderDepartures();
  });
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
// SINH TRƯỜNG LỊCH TRÌNH CHI TIẾT
// ===========================

function initItineraryGenerator() {
  const daysInput = document.querySelector('input[name="duration[days]"]');
  const itineraryFields = document.getElementById("itineraryFields");

  if (!daysInput || !itineraryFields) return;

  // Lắng nghe sự thay đổi số ngày
  daysInput.addEventListener("change", () => {
    generateItineraryFields(daysInput.value);
  });

  // Lắng nghe sự thay đổi khi người dùng gõ
  daysInput.addEventListener("input", () => {
    generateItineraryFields(daysInput.value);
  });
}

function generateItineraryFields(days) {
  const itineraryFields = document.getElementById("itineraryFields");
  const container = document.getElementById("itineraryContainer");

  if (!itineraryFields) return;

  // Nếu không có số ngày hoặc bằng 0, ẩn container
  if (!days || days <= 0) {
    container.style.display = "none";
    itineraryFields.innerHTML = "";
    return;
  }

  container.style.display = "block";
  const daysNum = parseInt(days);
  itineraryFields.innerHTML = "";

  // Tạo các textarea cho từng ngày
  for (let i = 1; i <= daysNum; i++) {
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "mb-4";
    fieldGroup.innerHTML = `
      <div class="border border-gray-300 rounded-lg p-4">
        <label class="block text-sm font-semibold text-gray-900 mb-3">
          Ngày ${i}
        </label>
        
        <div class="mb-3">
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Điểm du lịch
          </label>
          <input 
            type="text"
            name="itinerary[${i - 1}][destinations]"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="VD: TP.HCM - Bangkok, Chợ Đồng Xuân - Hồ Hoàn Kiếm..."
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Mô tả lịch trình
          </label>
          <textarea 
            name="itinerary[${i - 1}][description]"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Nhập chi tiết hoạt động, thời gian, ăn uống... cho ngày ${i}"
          ></textarea>
        </div>
      </div>
    `;
    itineraryFields.appendChild(fieldGroup);
  }
}

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
    if (files.length === 0) return;

    let loadedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagesArray.push({
          src: e.target.result,
          file: file,
        });
        loadedCount++;
        // Chỉ render khi tất cả files đã load xong
        if (loadedCount === files.length) {
          renderImagePreview();
          // Reset input file để có thể chọn lại file
          tourImages.value = "";
        }
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

function modalHandlers(onCloseCallback = null) {
  const modal = document.getElementById("addTourModal");
  if (!modal) return;

  // Hiển thị modal
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

    // Gọi callback để reset dữ liệu từ file gọi
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  // Đóng modal khi nhấn ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddTourModal();
    }
  });
}

// ===========================
// LOAD MORE TOURS (Optional)
// ===========================

// Lấy danh sách tour
async function getTours() {
  try {
    const res = await apiGet("/api/tours");

    if (!res) return;

    const result = await res.json();
    const container = document.getElementById("tours-list");
    const emptyContainer = document.getElementById("empty-tours-list");
    if (result.data.length === 0) {
      container.innerHTML = "";
      emptyContainer.innerHTML = `
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
                data-tour-id="${tour._id}"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="mb-3">
              <h3 class="text-xl font-bold text-gray-900">${tour.name}</h3>
              <p class="text-sm text-gray-600">
                ${tour.duration.days} ngày ${tour.duration.nights} đêm
              </p>
            </div>
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

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i class="fas fa-edit mr-1"></i>Chỉnh sửa
              </button>
              <button
                class="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                onclick="window.open('/tours/${tour.slug}', '_blank')"
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
    softDeleteTour();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Lấy danh sách tour trong thùng rác
async function getToursTrash() {
  try {
    const res = await apiGet("/api/tours/trash");

    if (!res) return;

    const result = await res.json();
    const container = document.getElementById("trash-list");
    const emptyContainer = document.getElementById("empty-trash-list");
    if (result.data.length === 0) {
      container.innerHTML = "";
      emptyContainer.innerHTML = `
      <div class="text-center text-gray-500 mt-20">
        <i class="fa-solid fa-trash text-5xl mb-4 text-gray-400"></i>
        <p>Không có tour nào trong thùng rác</p>
        <button
          onclick="window.location.href='/admin/qly-tour'"
          class="mt-6 bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <i class="fa-solid fa-arrow-left mr-2"></i>Quay lại trang Quản lý Tour
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
          </div>
          <div class="p-6">
            <div class="mb-3">
              <h3 class="text-xl font-bold text-gray-900">${tour.name}</h3>
              <p class="text-sm text-gray-600">
                ${tour.duration.days} ngày ${tour.duration.nights} đêm
              </p>
            </div>
            <div class="flex justify-between items-center mb-4">
              <span class="text-2xl font-bold text-blue-600">
                ${formatPrice(tour.price)} VND
              </span>
              <div class="text-right">
                <p class="text-sm text-gray-600">ngày xoá</p>
                <p class="text-lg font-semibold text-gray-600">
                  <span>
                <i class="fas fa-calendar mr-1"></i>${formatDate(
                  tour.deletedAt
                )}
              </span>
                </p>
              </div>
            </div>
            <div
              class="flex items-center justify-between text-sm text-gray-600 mb-4"
            >
              <span>
                
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

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                data-restore-id="${tour._id}"
                class="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              >
                <i class="fa-solid fa-rotate-left mr-1"></i>Khôi phục
              </button>
              <button
                data-trash-id="${tour._id}"
                class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <i class="fa-solid fa-trash-can mr-1"></i>Xoá vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }
    deleteTour();
    restoreTour();
  } catch (error) {
    next(error);
  }
}

// ===========================
// ADD TOUR
// ===========================

async function createTour() {
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
        console.log(err);
      }
    }

    // Thêm ảnh từ imagesArray vào FormData
    if (imagesArray.length > 0) {
      // Xóa images cũ nếu có từ input file
      formData.delete("images");

      // Thêm từng ảnh từ imagesArray
      imagesArray.forEach((item) => {
        formData.append("images", item.file);
      });
    }

    try {
      const res = await apiPost("/api/tours/add", formData);

      if (!res) return;
      const result = await res.json();
      if (res.ok) {
        Notification.success("Thêm tour thành công!");
        window.hideAddTourModal();
        getTours();
      } else {
        Notification.error("Có lỗi xảy ra!");
      }
    } catch (error) {
      next(error);
      Modal.alert({
        title: "Lỗi",
        message: "Đã xảy ra lỗi khi thêm tour!",
        icon: "fa-exclamation-triangle",
        iconColor: "red",
      });
    }
  });
}

// ===========================
// SOFT DELETE TOUR
// ===========================

function softDeleteTour() {
  const deleteButtons = document.querySelectorAll("[data-tour-id]");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tour-id");
      Modal.confirm({
        title: "Xóa tour",
        message: "Bạn có chắc chắn muốn xóa tour này không?",
        icon: "fa-trash",
        iconColor: "red",
        confirmText: "Xóa",
        confirmColor: "red",

        onConfirm: async () => {
          try {
            const res = await apiDelete(`/api/tours/${id}`);

            if (!res) return;
            if (res.ok) {
              Notification.success("Xoá tour thành công!");
              getTours();
            } else {
              Notification.error("Có lỗi xảy ra!");
            }
          } catch (error) {
            next(error);
            Modal.alert({
              title: "Lỗi",
              message: "Đã xảy ra lỗi khi xóa tour!",
              icon: "fa-exclamation-triangle",
              iconColor: "red",
            });
          }
        },
      });
    });
  });
}

// ===========================
// DELETE TOUR
// ===========================

function deleteTour() {
  const deleteButtons = document.querySelectorAll("[data-trash-id]");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-trash-id");
      Modal.confirm({
        title: "Xóa tour",
        message: "Bạn có chắc chắn muốn xóa tour này không?",
        icon: "fa-trash",
        iconColor: "red",
        confirmText: "Xóa",
        confirmColor: "red",

        onConfirm: async () => {
          try {
            const url = `/api/tours/trash/${id}`;
            const res = await apiDelete(url);

            if (!res) return;
            const result = await res.json();
            if (res.ok) {
              Notification.success("Xoá tour thành công!");
              getToursTrash();
            } else {
              Notification.error("Có lỗi xảy ra!");
            }
          } catch (error) {
            console.log(error);
            next(error);
            Modal.alert({
              title: "Lỗi",
              message: "Đã xảy ra lỗi khi xóa tour!",
              icon: "fa-exclamation-triangle",
              iconColor: "red",
            });
          }
        },
      });
    });
  });
}
// ===========================
// RESTORE TOUR
// ===========================

function restoreTour() {
  const deleteButtons = document.querySelectorAll("[data-restore-id]");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-restore-id");
      Modal.confirm({
        title: "Khôi phục tour",
        message: "Bạn có chắc chắn muốn khôi phục tour này không?",
        icon: "fa-undo",
        iconColor: "blue",
        confirmText: "Khôi phục",
        confirmColor: "blue",

        onConfirm: async () => {
          try {
            const res = await apiPatch(`/api/tours/trash/restore/${id}`);

            if (!res) return;

            if (res.ok) {
              Notification.success("Khôi phục tour thành công!");
              getToursTrash();
            } else {
              Notification.error("Có lỗi xảy ra!");
            }
          } catch (error) {
            next(error);
            Modal.alert({
              title: "Lỗi",
              message: "Đã xảy ra lỗi khi khôi phục tour!",
              icon: "fa-exclamation-triangle",
              iconColor: "red",
            });
          }
        },
      });
    });
  });
}
