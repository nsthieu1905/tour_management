import { apiCall, apiGet } from "../../utils/api.js";

const listEl = document.getElementById("fb-list");
const emptyEl = document.getElementById("fb-empty");
let state = { star: 0, sort: "newest", data: [], page: 1, limit: 10, total: 0 };

async function loadFeedbacks() {
  try {
    const container = document.getElementById("fb-list");
    const tourIdAttr = container?.getAttribute("data-tour-id");
    const tour = window.__TOUR__;
    const candidate = tourIdAttr || (tour && tour._id);
    const oidRegex = /^[a-fA-F0-9]{24}$/;
    const tourId =
      typeof candidate === "string" && oidRegex.test(candidate)
        ? candidate
        : null;
    if (!tourId) {
      console.error("Không tìm thấy tourId hợp lệ để tải nhận xét");
      return;
    }
    const res = await apiGet(
      `/api/feedbacks/tour/${tourId}?page=${state.page}&limit=${state.limit}`
    );
    const result = await res.json();
    if (!result.success) throw new Error(result.message || "Load failed");
    state.data = result.data || [];
    state.total = result.pagination?.total || state.data.length;
    render();
  } catch (e) {
    console.error(e);
    listEl.innerHTML =
      "<div class='text-center text-red-500'>Không thể tải nhận xét</div>";
  }
}

function render() {
  let rows = state.data.slice();
  if (state.star > 0)
    rows = rows.filter((r) => Math.round(r.rating) === state.star);
  rows.sort((a, b) => {
    const likesA = (a.likedBy?.length || 0) - (a.dislikedBy?.length || 0);
    const likesB = (b.likedBy?.length || 0) - (b.dislikedBy?.length || 0);
    if (state.sort === "newest")
      return new Date(b.createdAt) - new Date(a.createdAt);
    if (state.sort === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);
    if (state.sort === "highest")
      return (
        likesB - likesA ||
        b.rating - a.rating ||
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    if (state.sort === "lowest")
      return (
        likesA - likesB ||
        a.rating - b.rating ||
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    return 0;
  });

  if (rows.length === 0) {
    emptyEl.classList.remove("hidden");
    listEl.innerHTML = "";
    return;
  }
  emptyEl.classList.add("hidden");
  listEl.innerHTML = rows
    .map((r) => {
      const likeCount = r.likedBy?.length || 0;
      const dislikeCount = r.dislikedBy?.length || 0;
      const name = r.userId?.fullName || "Người dùng";
      const likeActive = r.hasLiked;
      const dislikeActive = r.hasDisliked;
      return `
      <div class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <i class="fas fa-user-circle text-gray-400 text-xl"></i>
            <div class="text-sm font-medium text-gray-800">${name}</div>
            <div class="text-yellow-400 ml-3">${"★".repeat(
              Math.round(r.rating)
            )}${"☆".repeat(5 - Math.round(r.rating))}</div>
            <div class="text-sm text-gray-500">${new Date(
              r.createdAt
            ).toLocaleDateString("vi-VN")}</div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <button class="fb-like px-3 py-1 rounded-full ${
              likeActive
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 hover:bg-gray-200"
            }" data-id="${
        r._id
      }"><i class="fas fa-thumbs-up mr-1"></i><span>${likeCount}</span></button>
            <button class="fb-dislike px-3 py-1 rounded-full ${
              dislikeActive
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 hover:bg-gray-200"
            }" data-id="${
        r._id
      }"><i class="fas fa-thumbs-down mr-1"></i><span>${dislikeCount}</span></button>
          </div>
        </div>
        ${
          r.comment
            ? `<div class="text-gray-800 mb-3">${escapeHtml(r.comment)}</div>`
            : ""
        }
      </div>`;
    })
    .join("");

  // bind like/dislike
  document
    .querySelectorAll(".fb-like")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        react(btn.getAttribute("data-id"), "like", btn, true)
      )
    );
  document
    .querySelectorAll(".fb-dislike")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        react(btn.getAttribute("data-id"), "dislike", btn, true)
      )
    );

  renderPagination();
}

function escapeHtml(s) {
  return s.replace(
    /[&<>"]+/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// Events
window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("__TOUR_DATA__");
  try {
    window.__TOUR__ = el ? JSON.parse(el.textContent) : null;
  } catch {
    window.__TOUR__ = null;
  }
  // bind filters after DOM ready
  const setActive = (val) => {
    document.querySelectorAll(".fb-filter").forEach((b) => {
      const isActive = Number(b.getAttribute("data-star")) === val;
      b.classList.toggle("bg-yellow-100", isActive);
      b.classList.toggle("text-yellow-700", isActive);
      b.classList.toggle("border-yellow-300", isActive);
    });
  };
  Array.from(document.querySelectorAll(".fb-filter")).forEach((btn) =>
    btn.addEventListener("click", () => {
      state.star = Number(btn.getAttribute("data-star"));
      setActive(state.star);
      render();
    })
  );
  setActive(state.star);
  document.getElementById("fb-sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  loadFeedbacks();
});

async function react(id, action, btnEl, colorize) {
  try {
    const res = await apiCall(`/api/feedbacks/${id}/${action}`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) return;
    // update counters in place
    const card = btnEl.closest(".bg-white.rounded-xl");
    if (!card) return;
    const likeSpan = card.querySelector(".fb-like span");
    const dislikeSpan = card.querySelector(".fb-dislike span");
    if (likeSpan && dislikeSpan) {
      likeSpan.textContent = json.data.likes;
      dislikeSpan.textContent = json.data.dislikes;
    }
    if (colorize) {
      // Đổi màu xanh cho nút vừa click
      const isLike = action === "like";
      const likeBtn = card.querySelector(".fb-like");
      const dislikeBtn = card.querySelector(".fb-dislike");
      if (isLike) {
        likeBtn.classList.add("bg-green-100", "text-green-700");
        dislikeBtn.classList.remove("bg-green-100", "text-green-700");
      } else {
        dislikeBtn.classList.add("bg-green-100", "text-green-700");
        likeBtn.classList.remove("bg-green-100", "text-green-700");
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function renderPagination() {
  const pag = document.getElementById("fb-pagination");
  const pages = Math.max(1, Math.ceil(state.total / state.limit));
  if (!pag) return;
  if (pages <= 1) {
    pag.innerHTML = "";
    return;
  }
  let html = "";
  const mkBtn = (p, label = p, active = false) =>
    `<button data-page="${p}" class="px-3 py-1 rounded-lg border ${
      active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
    }">${label}</button>`;
  html += mkBtn(Math.max(1, state.page - 1), "‹", false);
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) {
      html += mkBtn(p, p, p === state.page);
    } else if (Math.abs(p - state.page) === 2) {
      html += `<span class="px-2">…</span>`;
    }
  }
  html += mkBtn(Math.min(pages, state.page + 1), "›", false);
  pag.innerHTML = html;
  pag.querySelectorAll("button[data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      const next = Number(b.getAttribute("data-page"));
      if (next && next !== state.page) {
        state.page = next;
        loadFeedbacks();
      }
    })
  );
}
