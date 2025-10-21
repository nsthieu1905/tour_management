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
  initDepartureDatePicker();

  // Khởi tạo preview ảnh tour
  initTourImagePreview();

  // Khởi tạo modal handlers
  initTourModalHandlers();
}

// ===========================
// XỬ LÝ NGÀY KHỞI HÀNH
// ===========================

function initDepartureDatePicker() {
  const departureInput = document.getElementById("departureInput");
  if (!departureInput) return;

  let departures = [];

  departureInput.addEventListener("change", function (e) {
    const date = e.target.value;
    if (date && !departures.includes(date)) {
      departures.push(date);
      departures.sort((a, b) => new Date(a) - new Date(b));
      updateDepartureList(departures);
    }
    e.target.value = "";
  });

  function updateDepartureList(datesArray) {
    const list = document.getElementById("departureList");
    if (!list) return;

    list.innerHTML = datesArray
      .map(
        (date, index) => `
        <div class="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
          <span class="text-sm">${new Date(date).toLocaleDateString(
            "vi-VN"
          )}</span>
          <button type="button" onclick="removeTourDeparture(${index})" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `
      )
      .join("");

    const departuresData = document.getElementById("departuresData");
    if (departuresData) {
      departuresData.value = JSON.stringify(datesArray);
    }
  }

  // Expose hàm xóa departure để dùng inline onclick
  window.removeTourDeparture = function (index) {
    departures.splice(index, 1);
    updateDepartureList(departures);
  };
}

// ===========================
// XỬ LÝ PREVIEW ẢNH TOUR
// ===========================

function initTourImagePreview() {
  const tourImages = document.getElementById("tourImages");
  // if (!tourImages) return;

  // tourImages.addEventListener("change", function (e) {
  //   previewTourImages(this);
  // });

  // Xử lý drag & drop cho upload container (nếu có)
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

      // tourImages.files = e.dataTransfer.files;
      // previewTourImages(tourImages);
    });
  }
}

// function previewTourImages(input) {
//   const preview = document.getElementById("imagePreview");
//   if (!preview || !input.files) return;

//   preview.innerHTML = "";

//   Array.from(input.files).forEach((file, index) => {
//     const reader = new FileReader();
//     reader.onload = function (e) {
//       const div = document.createElement("div");
//       div.className = "relative group";
//       div.innerHTML = `
//         <img src="${e.target.result}" class="w-full h-24 object-cover rounded shadow-sm" />

//       `;
//       preview.appendChild(div);
//     };
//     reader.readAsDataURL(file);
//   });
// }

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

  // Reset form sau khi submit
  const tourForm = document.getElementById("addTourForm");
  if (tourForm) {
    tourForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // Xử lý submit logic ở đây
      this.reset();
      window.hideAddTourModal();
    });
  }
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

          // Tìm và xoá hàng trong bảng
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

// Có thể thêm các function edit tour tương tự
window.editTour = function (tourId) {
  console.log("Edit tour:", tourId);
  // Logic edit tour
};

window.viewTourDetails = function (tourId) {
  console.log("View tour:", tourId);
  // Logic xem chi tiết tour
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
