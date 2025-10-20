// Chờ DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  // Xử lý form submit
  const tourForm = document.querySelector("#tourForm");
  if (tourForm) {
    tourForm.addEventListener("submit", function (e) {
      // Không cần xử lý gì thêm nếu dùng duration[days]
      console.log("Form submitted");
    });
  }

  // Xử lý ngày khởi hành
  const departureInput = document.getElementById("departureInput");
  if (departureInput) {
    let departures = [];

    departureInput.addEventListener("change", function (e) {
      const date = e.target.value;
      if (date && !departures.includes(date)) {
        departures.push(date);
        updateDepartureList();
      }
      e.target.value = "";
    });

    function updateDepartureList() {
      const list = document.getElementById("departureList");
      if (!list) return;

      list.innerHTML = departures
        .map(
          (date, index) => `
        <div class="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
          <span class="text-sm">${new Date(date).toLocaleDateString(
            "vi-VN"
          )}</span>
          <button type="button" onclick="removeDeparture(${index})" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `
        )
        .join("");

      const departuresData = document.getElementById("departuresData");
      if (departuresData) {
        departuresData.value = JSON.stringify(departures);
      }
    }

    // Hàm xóa departure
    window.removeDeparture = function (index) {
      departures.splice(index, 1);
      updateDepartureList();
    };
  }

  // Xử lý preview ảnh
  const tourImages = document.getElementById("tourImages");
  if (tourImages) {
    tourImages.addEventListener("change", function (e) {
      previewImages(this);
    });
  }

  function previewImages(input) {
    const preview = document.getElementById("imagePreview");
    if (!preview || !input.files) return;

    preview.innerHTML = "";

    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement("div");
        div.className = "relative";
        div.innerHTML = `
          <img src="${e.target.result}" class="w-full h-24 object-cover rounded" />
        `;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  // Hàm show/hide modal
  window.showAddTourModal = function () {
    const modal = document.getElementById("addTourModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  };

  window.hideAddTourModal = function () {
    const modal = document.getElementById("addTourModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  };
});
