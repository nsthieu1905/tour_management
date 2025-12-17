import { Modal, Notification } from "../../utils/modal.js";
import { apiGet } from "../../utils/api.js";

// ============================================
// BIẾN TOÀN CỤC
// ============================================
let selectedTours = [];

function initHomeBannerSlider() {
  const slider = document.getElementById("homeBannerSlider");
  if (!slider) return;

  const track = slider.querySelector(".home-slider__track");
  const baseItems = Array.from(slider.querySelectorAll(".home-slider__item"));
  const dots = Array.from(slider.querySelectorAll(".home-slider__dot"));
  const prevBtn = slider.querySelector(".home-slider__prev");
  const nextBtn = slider.querySelector(".home-slider__next");

  if (!track || baseItems.length === 0) return;

  const bannerUrl = (index) => `/images/banner${String(index)}.jpg`;
  const bannerCache = new Map();

  const resolveBanner = (index) => {
    const key = Number(index || 0);
    if (!key) return Promise.resolve(null);
    if (bannerCache.has(key)) return bannerCache.get(key);

    const p = new Promise((resolve) => {
      const src = bannerUrl(key);
      const probe = new Image();
      probe.onload = () => resolve(src);
      probe.onerror = () => resolve(null);
      probe.src = src;
    });

    bannerCache.set(key, p);
    return p;
  };

  // Infinite loop: clone last to head, first to tail
  if (baseItems.length > 1) {
    const firstClone = baseItems[0].cloneNode(true);
    const lastClone = baseItems[baseItems.length - 1].cloneNode(true);
    track.insertBefore(lastClone, baseItems[0]);
    track.appendChild(firstClone);
  }

  const items = Array.from(slider.querySelectorAll(".home-slider__item"));
  const realCount = baseItems.length;

  // Prepare images (only banner1.jpg..banner5.jpg; keep placeholder when missing)
  items.forEach((item) => {
    const img = item.querySelector(".home-slider__img");
    const placeholder = item.querySelector(".home-slider__placeholder");
    const bannerIndex = Number(img?.dataset?.banner || 0);
    if (!img || !bannerIndex) return;

    img.classList.add("home-slider__img--hidden");
    placeholder?.classList.remove("home-slider__placeholder--hidden");

    resolveBanner(bannerIndex).then((src) => {
      if (!src) {
        img.classList.add("home-slider__img--hidden");
        placeholder?.classList.remove("home-slider__placeholder--hidden");
        return;
      }

      img.src = src;
      img.classList.remove("home-slider__img--hidden");
      placeholder?.classList.add("home-slider__placeholder--hidden");
    });
  });

  let current = realCount > 1 ? 1 : 0;
  let timer = null;
  let isTransitioning = false;

  const setTransitionEnabled = (enabled) => {
    track.style.transition = enabled ? "transform 450ms ease" : "none";
  };

  const getRealIndex = () => {
    if (realCount <= 1) return 0;
    if (current === 0) return realCount - 1;
    if (current === realCount + 1) return 0;
    return current - 1;
  };

  const render = () => {
    track.style.transform = `translateX(-${current * 100}%)`;
    const realIndex = getRealIndex();
    dots.forEach((d, i) => {
      if (i === realIndex) d.classList.add("is-active");
      else d.classList.remove("is-active");
    });
  };

  const goToReal = (realIndex) => {
    if (realCount <= 1) {
      current = 0;
      render();
      return;
    }
    current = Math.min(Math.max(0, Number(realIndex) + 1), realCount + 1);
    render();
  };

  const next = () => {
    if (realCount <= 1 || isTransitioning) return;
    isTransitioning = true;
    setTransitionEnabled(true);
    current = Math.min(current + 1, realCount + 1);
    render();
  };

  const prev = () => {
    if (realCount <= 1 || isTransitioning) return;
    isTransitioning = true;
    setTransitionEnabled(true);
    current = Math.max(current - 1, 0);
    render();
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => {
      if (!isTransitioning) next();
    }, 4500);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  prevBtn?.addEventListener("click", () => {
    prev();
    start();
  });

  nextBtn?.addEventListener("click", () => {
    next();
    start();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      if (realCount <= 1 || isTransitioning) return;
      const idx = Number(dot.dataset.slide || 0);
      goToReal(idx);
      start();
    });
  });

  track.addEventListener("transitionend", () => {
    if (realCount <= 1) return;

    isTransitioning = false;

    if (current === 0) {
      setTransitionEnabled(false);
      current = realCount;
      render();
      track.offsetHeight;
      setTransitionEnabled(true);
      return;
    }

    if (current === realCount + 1) {
      setTransitionEnabled(false);
      current = 1;
      render();
      track.offsetHeight;
      setTransitionEnabled(true);
    }
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);

  setTransitionEnabled(true);
  goToReal(0);
  start();
}

// ============================================
// CHỨC NĂNG SO SÁNH TOUR
// ============================================

/**
 * Bật/tắt chọn tour để so sánh
 */
function toggleCompare(button, tourId) {
  const checkbox = button.parentElement.querySelector(".compare-checkbox");
  const isSelected = checkbox.checked;

  if (!isSelected && selectedTours.length >= 3) {
    Notification.error("Chỉ có thể so sánh tối đa 3 tours");
    return;
  }

  checkbox.checked = !isSelected;

  if (!isSelected) {
    selectedTours.push(tourId);
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add("bg-green-500", "text-white");
    button.classList.remove("bg-white", "text-gray-700");
  } else {
    selectedTours = selectedTours.filter((id) => id !== tourId);
    button.innerHTML = '<i class="fas fa-plus"></i>';
    button.classList.remove("bg-green-500", "text-white");
    button.classList.add("bg-white", "text-gray-700");
  }

  updateCompareButton();
}

/**
 * Cập nhật trạng thái và số lượng tour được chọn trên nút so sánh
 */
function updateCompareButton() {
  const fab = document.getElementById("compareFloatingBtn");
  const countEl = document.getElementById("compareFloatingCount");
  if (!fab || !countEl) return;

  countEl.textContent = String(selectedTours.length);

  if (selectedTours.length > 0) {
    fab.classList.remove("compare-fab--hidden");
  } else {
    fab.classList.add("compare-fab--hidden");
  }

  if (selectedTours.length < 2) {
    fab.classList.add("compare-fab--disabled");
  } else {
    fab.classList.remove("compare-fab--disabled");
  }
}

/**
 * Hiển thị modal so sánh tour
 */
async function showComparison() {
  const modal = document.getElementById("comparisonModal");
  const content = document.getElementById("comparisonContent");

  if (!modal || !content) return;

  // Load dữ liệu tours từ API
  try {
    const responses = await Promise.all(
      selectedTours.map((id) => apiGet(`/api/tours/${id}`))
    );
    const payloads = await Promise.all(responses.map((r) => r.json()));
    const tours = payloads
      .map((p) => (p && p.success ? p.data : null))
      .filter(Boolean);

    if (tours.length < 2) {
      Notification.error("Vui lòng chọn ít nhất 2 tour hợp lệ để so sánh.");
      return;
    }

    content.innerHTML = tours
      .map((t) => {
        const priceDisplay =
          typeof t.price === "number"
            ? t.price.toLocaleString("vi-VN") + " VND"
            : "-";
        const img =
          t.thumbnail || (t.images && t.images[0]) || "/images/no-image.png";
        const ratingAvg = t?.rating?.average ?? 0;
        const ratingCount = t?.rating?.count ?? 0;
        const duration = t?.duration
          ? `${t.duration.days || 0} ngày ${t.duration.nights || 0} đêm`
          : "-";
        const destination = t?.destination || "-";
        const tourType = t?.tourType || "-";

        return `
          <div class="border rounded-xl overflow-hidden bg-white shadow-sm">
            <div class="h-40 bg-gray-100 overflow-hidden">
              <img src="${img}" alt="${t.name}" class="w-full h-full object-cover" />
            </div>
            <div class="p-4">
              <h3 class="font-bold text-lg mb-2 line-clamp-2">${t.name}</h3>
              <div class="space-y-2 text-sm text-gray-700">
                <div class="flex justify-between">
                  <span>Giá</span>
                  <span class="font-semibold text-indigo-600">${priceDisplay}</span>
                </div>
                <div class="flex justify-between">
                  <span>Thời lượng</span>
                  <span>${duration}</span>
                </div>
                <div class="flex justify-between">
                  <span>Điểm đến</span>
                  <span>${destination}</span>
                </div>
                <div class="flex justify-between">
                  <span>Hạng tour</span>
                  <span>${tourType}</span>
                </div>
                <div class="flex justify-between">
                  <span>Đánh giá</span>
                  <span><i class="fas fa-star text-yellow-400"></i> ${ratingAvg} (${ratingCount})</span>
                </div>
              </div>
              <button class="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors" onclick="window.location.href='/tours/${t.slug}'">
                Xem chi tiết
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    modal.classList.add("active");
  } catch (err) {
    console.error("Lỗi tải dữ liệu so sánh:", err);
    Notification.error(
      "Không thể tải dữ liệu tour để so sánh. Vui lòng thử lại."
    );
  }
}

/**
 * Đóng modal so sánh tour
 */
function closeComparison() {
  const modal = document.getElementById("comparisonModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// ============================================
// ĐỊNH GIÁ ĐỘNG THEO NHU CẦU
// ============================================

/**
 * Khởi tạo hệ thống định giá động
 */
function initDynamicPricing() {
  const priceElements = document.querySelectorAll(
    ".text-2xl.font-bold.text-indigo-600"
  );

  // Có thể thêm tooltip hoặc hiệu ứng cho giá
  // Code đã được comment vì có thể gây ảnh hưởng đến UX
}

// ============================================
// XỬ LÝ ĐÓNG MODAL
// ============================================

// Đóng modal khi click bên ngoài
document.addEventListener("click", function (e) {
  // Chỉ đóng modal so sánh, không ảnh hưởng đến các modal khác
  if (e.target.id === "comparisonModal") {
    closeComparison();
  }
});

// ============================================
// KHỞI TẠO TRANG
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const aiSearch = document.getElementById("aiSearch");
  const homeSearchBtn = document.getElementById("homeSearchBtn");

  const goToSearch = () => {
    const q = String(aiSearch?.value || "").trim();
    const url = q ? `/tours?q=${encodeURIComponent(q)}` : "/tours";
    window.location.href = url;
  };

  if (homeSearchBtn) {
    homeSearchBtn.addEventListener("click", goToSearch);
  }

  if (aiSearch) {
    aiSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goToSearch();
      }
    });
  }

  // Lắng nghe sự kiện click nút so sánh (floating)
  const compareFab = document.getElementById("compareFloatingBtn");
  if (compareFab) {
    compareFab.addEventListener("click", function () {
      if (selectedTours.length < 2) {
        Notification.error("Vui lòng chọn ít nhất 2 tours để so sánh");
        return;
      }
      showComparison();
    });
  }

  initHomeBannerSlider();

  // Khởi tạo các tính năng nâng cao
  initDynamicPricing();

  // KHÔNG XỬ LÝ FLOATING BUTTONS Ở ĐÂY
  // Đã được xử lý trong floating-buttons.js
});

// Expose functions for inline onclick handlers
window.toggleCompare = toggleCompare;
window.showComparison = showComparison;
window.closeComparison = closeComparison;
