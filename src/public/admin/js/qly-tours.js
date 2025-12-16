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

  tourSocket.on("tour:updated", (data) => {
    console.log("🔄 [Tour] Received tour update:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
  });

  tourSocket.on("tour:deleted", (data) => {
    console.log("🗑️ [Tour] Received tour delete:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
    if (document.getElementById("trash-list")) {
      getToursTrash();
    }
  });

  tourSocket.on("tour:restored", (data) => {
    console.log("♻️ [Tour] Received tour restore:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
    if (document.getElementById("trash-list")) {
      getToursTrash();
    }
  });

  tourSocket.on("tour:created", (data) => {
    console.log("✨ [Tour] Received tour creation:", data);
    if (document.getElementById("tours-list")) {
      getTours();
    }
  });
}

// Global variables
let allTours = [];
let currentEditingTourId = null;

document.addEventListener("DOMContentLoaded", function () {
  initTourManagement();
  initTourSocket();
  if (document.getElementById("tours-list")) getTours();
  if (document.getElementById("trash-list")) getToursTrash();
  if (document.getElementById("addTourForm")) initTourForm();
  initFilterAndSearch();
});

// ===========================
// KHỞI TẠO QUẢN LÝ TOUR
// ===========================

function initTourManagement() {
  initDepartureDates();
  initTourImagePreview();
  initItineraryGenerator();
  modalHandlers(() => {
    departureDates = [];
    imagesArray = [];
    currentEditingTourId = null;
    renderDepartures();
  });
}

// ===========================
// FILTER AND SEARCH
// ===========================

function initFilterAndSearch() {
  const tourTypeFilter = document.getElementById("tourTypeFilter");
  const searchInput = document.getElementById("tourSearchInput");

  if (!tourTypeFilter || !searchInput) {
    console.warn("Search/Filter elements not found in DOM");
    return;
  }

  tourTypeFilter.addEventListener("change", filterTours);
  searchInput.addEventListener("input", filterTours);
}

function filterTours() {
  const tourTypeFilter = document.getElementById("tourTypeFilter");
  const searchInput = document.getElementById("tourSearchInput");

  if (!tourTypeFilter || !searchInput) {
    console.warn("Search/Filter elements not found");
    return;
  }

  const selectedType = tourTypeFilter.value.trim() || "";
  const searchTerm = searchInput.value.toLowerCase().trim() || "";

  let filteredTours = allTours;

  if (selectedType && selectedType !== "" && selectedType !== "-- Tất cả --") {
    filteredTours = filteredTours.filter(
      (tour) => tour.tourType && tour.tourType.trim() === selectedType
    );
  }

  if (searchTerm) {
    filteredTours = filteredTours.filter(
      (tour) =>
        (tour.name && tour.name.toLowerCase().includes(searchTerm)) ||
        (tour.destination &&
          tour.destination.toLowerCase().includes(searchTerm)) ||
        (tour.tourCode && tour.tourCode.toLowerCase().includes(searchTerm))
    );
  }

  renderTours(filteredTours);
}

function renderTours(tours) {
  const container = document.getElementById("tours-list");
  const emptyContainer = document.getElementById("empty-tours-list");

  if (tours.length === 0) {
    container.innerHTML = "";
    emptyContainer.innerHTML = `
      <div class="text-center py-20 bg-white rounded-xl shadow-sm">
        <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          Không có tour nào
        </h3>
      </div>
    `;
    return;
  }

  emptyContainer.innerHTML = "";
  container.innerHTML = tours
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

          <div class="flex space-x-2">
            <button
              data-edit-id="${tour._id}"
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

  softDeleteTour();
  editTour();
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

  if (departuresData) {
    departuresData.value = JSON.stringify(departureDates);
  }
}

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

  daysInput.addEventListener("change", () => {
    generateItineraryFields(daysInput.value);
  });

  daysInput.addEventListener("input", () => {
    generateItineraryFields(daysInput.value);
  });
}

function generateItineraryFields(days) {
  const itineraryFields = document.getElementById("itineraryFields");
  const container = document.getElementById("itineraryContainer");

  if (!itineraryFields) return;

  if (!days || days <= 0) {
    container.style.display = "none";
    itineraryFields.innerHTML = "";
    return;
  }

  container.style.display = "block";
  const daysNum = parseInt(days);
  itineraryFields.innerHTML = "";

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
        if (loadedCount === files.length) {
          renderImagePreview();
          tourImages.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  });

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

  window.showAddTourModal = function () {
    currentEditingTourId = null;
    const modalTitle = modal.querySelector("h3");
    const submitBtn = modal.querySelector('button[type="submit"]');

    modalTitle.textContent = "Thêm tour mới";
    submitBtn.textContent = "Thêm tour";
    submitBtn.className =
      "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const form = modal.querySelector("form");
    if (form) form.reset();
    clearFormErrors(form);
  };

  window.hideAddTourModal = function () {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";

    const form = modal.querySelector("form");
    if (form) {
      form.reset();
      clearFormErrors(form);
    }

    const preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = "";

    const departureList = document.getElementById("departureList");
    if (departureList) departureList.innerHTML = "";

    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddTourModal();
    }
  });
}

// ===========================
// VALIDATION FUNCTIONS
// ===========================

function validateTourCode(tourCode) {
  if (!tourCode || tourCode.trim().length === 0) {
    return "Mã tour là bắt buộc";
  }
  if (tourCode.trim().length < 3) {
    return "Mã tour phải có ít nhất 3 ký tự";
  }
  const existingTour = allTours.find(
    (tour) =>
      tour.tourCode.toLowerCase() === tourCode.toLowerCase() &&
      tour._id !== currentEditingTourId
  );
  if (existingTour) {
    return "Mã tour đã tồn tại";
  }
  return null;
}

function validateTourName(name) {
  if (!name || name.trim().length === 0) {
    return "Tên tour là bắt buộc";
  }
  if (name.trim().length < 5) {
    return "Tên tour phải có ít nhất 5 ký tự";
  }
  return null;
}

function validateDestination(destination) {
  if (!destination || destination.trim().length === 0) {
    return "Điểm đến là bắt buộc";
  }
  return null;
}

function validateDays(days) {
  if (!days || parseInt(days) <= 0) {
    return "Số ngày phải lớn hơn 0";
  }
  return null;
}

function validateNights(nights) {
  if (!nights || parseInt(nights) < 0) {
    return "Số đêm không hợp lệ";
  }
  return null;
}

function validatePrice(price) {
  if (!price || parseFloat(price) <= 0) {
    return "Giá tour phải lớn hơn 0";
  }
  return null;
}

function validateCapacity(capacity) {
  if (!capacity || parseInt(capacity) <= 0) {
    return "Sức chứa phải lớn hơn 0";
  }
  return null;
}

function validateDepartureDates() {
  if (departureDates.length === 0) {
    return "Phải có ít nhất một ngày khởi hành";
  }
  return null;
}

function validateImages() {
  if (!currentEditingTourId && imagesArray.length === 0) {
    return "Phải có ít nhất một ảnh tour";
  }
  return null;
}

async function validateTourForm(formData) {
  const errors = {};

  const tourCodeError = validateTourCode(formData.get("tourCode"));
  if (tourCodeError) errors.tourCode = tourCodeError;

  const nameError = validateTourName(formData.get("name"));
  if (nameError) errors.name = nameError;

  const destError = validateDestination(formData.get("destination"));
  if (destError) errors.destination = destError;

  const daysError = validateDays(formData.get("duration[days]"));
  if (daysError) errors.days = daysError;

  const nightsError = validateNights(formData.get("duration[nights]"));
  if (nightsError) errors.nights = nightsError;

  const priceError = validatePrice(formData.get("price"));
  if (priceError) errors.price = priceError;

  const capacityError = validateCapacity(formData.get("capacity[max]"));
  if (capacityError) errors.capacity = capacityError;

  const datesError = validateDepartureDates();
  if (datesError) errors.departureDates = datesError;

  const imagesError = validateImages();
  if (imagesError) errors.images = imagesError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function showFormErrors(form, errors) {
  clearFormErrors(form);

  Object.keys(errors).forEach((field) => {
    let input;

    if (field === "days") {
      input = form.querySelector('input[name="duration[days]"]');
    } else if (field === "nights") {
      input = form.querySelector('input[name="duration[nights]"]');
    } else if (field === "capacity") {
      input = form.querySelector('input[name="capacity[max]"]');
    } else if (field === "departureDates") {
      input = document.getElementById("departureInput");
    } else if (field === "images") {
      input = document.getElementById("uploadContainer");
    } else {
      input = form.querySelector(`[name="${field}"]`);
    }

    if (input) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "text-red-500 text-sm mt-1 error-message";
      errorDiv.textContent = errors[field];

      if (input.parentElement) {
        input.parentElement.appendChild(errorDiv);
      }

      input.classList.add("border-red-500");
    }
  });
}

function clearFormErrors(form) {
  const errorMessages = form.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());

  const errorInputs = form.querySelectorAll(".border-red-500");
  errorInputs.forEach((input) => input.classList.remove("border-red-500"));
}

// ===========================
// LOAD TOURS
// ===========================

async function getTours() {
  try {
    const res = await apiGet("/api/tours");

    if (!res) return;

    const result = await res.json();
    allTours = result.data;

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
    }

    renderTours(result.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

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
              <span></span>
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
    console.error(error);
  }
}

// ===========================
// FORM INITIALIZATION
// ===========================

function initTourForm() {
  const form = document.getElementById("addTourForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Validate form
    const validation = await validateTourForm(formData);
    if (!validation.isValid) {
      showFormErrors(form, validation.errors);
      return;
    }

    // Clear errors
    clearFormErrors(form);

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
        if (item.file) {
          formData.append("images", item.file);
        }
      });
    }

    try {
      let res;
      if (currentEditingTourId) {
        // Update tour
        res = await apiPatch(`/api/tours/${currentEditingTourId}`, formData);
      } else {
        // Create tour
        res = await apiPost("/api/tours/add", formData);
      }

      if (!res) return;
      const result = await res.json();

      if (res.ok) {
        Notification.success(
          currentEditingTourId
            ? "Cập nhật tour thành công!"
            : "Thêm tour thành công!"
        );
        window.hideAddTourModal();
        getTours();
      } else {
        Notification.error(result.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error(error);
      Notification.error("Đã xảy ra lỗi khi xử lý tour!");
    }
  });
}

// ===========================
// EDIT TOUR
// ===========================

function editTour() {
  const editButtons = document.querySelectorAll("[data-edit-id]");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit-id");

      try {
        const res = await apiGet(`/api/tours/${id}`);
        if (!res) return;

        const result = await res.json();
        if (!res.ok) {
          Notification.error("Không thể tải thông tin tour!");
          return;
        }

        const tour = result.data;
        currentEditingTourId = id;

        // Update modal title and button
        const modal = document.getElementById("addTourModal");
        const modalTitle = modal.querySelector("h3");
        const submitBtn = modal.querySelector('button[type="submit"]');

        modalTitle.textContent = "Chỉnh sửa tour";
        submitBtn.textContent = "Cập nhật";
        submitBtn.className =
          "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600";

        // Fill form with tour data
        const form = document.getElementById("addTourForm");
        form.querySelector('[name="tourCode"]').value = tour.tourCode || "";
        form.querySelector('[name="name"]').value = tour.name || "";
        form.querySelector('[name="destination"]').value =
          tour.destination || "";
        form.querySelector('[name="duration[days]"]').value =
          tour.duration?.days || "";
        form.querySelector('[name="duration[nights]"]').value =
          tour.duration?.nights || "";
        form.querySelector('[name="price"]').value = tour.price || "";
        form.querySelector('[name="description"]').value =
          tour.description || "";
        form.querySelector('[name="capacity[max]"]').value =
          tour.capacity?.max || "";

        // Fill departure dates
        departureDates = [];
        if (tour.departureDates && tour.departureDates.length > 0) {
          tour.departureDates.forEach((dateObj) => {
            const date = new Date(dateObj.date || dateObj);
            const formatted = date.toISOString().split("T")[0];
            departureDates.push(formatted);
          });
        }
        renderDepartures();

        // Fill itinerary
        if (tour.itinerary && tour.itinerary.length > 0) {
          generateItineraryFields(tour.duration.days);
          setTimeout(() => {
            tour.itinerary.forEach((item, index) => {
              const destInput = form.querySelector(
                `[name="itinerary[${index}][destinations]"]`
              );
              const descInput = form.querySelector(
                `[name="itinerary[${index}][description]"]`
              );
              if (destInput) destInput.value = item.destinations || "";
              if (descInput) descInput.value = item.description || "";
            });
          }, 100);
        }

        // Fill images
        imagesArray = [];
        if (tour.images && tour.images.length > 0) {
          tour.images.forEach((imagePath) => {
            imagesArray.push({
              src: imagePath,
              file: null, // Existing image, no file object
            });
          });
          renderImagePreview();
        }

        // Show modal
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      } catch (error) {
        console.error("Error loading tour:", error);
        Notification.error("Không thể tải thông tin tour!");
      }
    });
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
            console.error(error);
            Notification.error("Đã xảy ra lỗi khi xóa tour!");
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
            Notification.error("Đã xảy ra lỗi khi xóa tour!");
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
            console.error(error);
            Notification.error("Đã xảy ra lỗi khi khôi phục tour!");
          }
        },
      });
    });
  });
}
