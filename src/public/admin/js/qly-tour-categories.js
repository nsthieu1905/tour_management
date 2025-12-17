import { Modal, Notification } from "../../utils/modal.js";
import { apiGet, apiPost, apiPatch, apiDelete } from "../../utils/api.js";

let allCategories = [];
let currentEditingId = null;
let currentSearch = "";

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("categories-list")) {
    initCategoryUI();
    getCategories();
  }
});

function initCategoryUI() {
  const searchInput = document.getElementById("categorySearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = String(searchInput.value || "")
        .trim()
        .toLowerCase();
      renderCategories();
    });
  }

  const form = document.getElementById("categoryForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitCategory();
    });
  }

  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("categoryModal");
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      window.hideCategoryModal();
    }
  });

  window.showAddCategoryModal = () => {
    currentEditingId = null;
    openCategoryModal({});
  };

  window.hideCategoryModal = () => {
    const modal = document.getElementById("categoryModal");
    const form = document.getElementById("categoryForm");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    if (form) form.reset();
    const idInput = document.getElementById("categoryId");
    if (idInput) idInput.value = "";
  };
}

async function getCategories() {
  try {
    const res = await apiGet("/api/tour-categories");
    if (!res) return;

    const result = await res.json();
    if (!result?.success) {
      Notification.error(result?.message || "Không thể tải danh mục tour");
      return;
    }

    allCategories = result.data || [];
    renderCategories();
  } catch (err) {
    console.error(err);
    Notification.error("Lỗi khi tải danh mục tour");
  }
}

function renderCategories() {
  const container = document.getElementById("categories-list");
  const empty = document.getElementById("empty-categories-list");
  if (!container || !empty) return;

  const filtered = !currentSearch
    ? allCategories
    : allCategories.filter((c) => {
        const name = String(c.name || "").toLowerCase();
        const desc = String(c.description || "").toLowerCase();
        return name.includes(currentSearch) || desc.includes(currentSearch);
      });

  if (!filtered.length) {
    container.innerHTML = "";
    empty.innerHTML = `
      <div class="text-center py-16">
        <i class="fas fa-list text-5xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 mb-1">Chưa có danh mục</h3>
        <p class="text-sm text-gray-500">Hãy tạo danh mục tour để nhóm tour hiển thị ở trang người dùng.</p>
      </div>
    `;
    return;
  }

  empty.innerHTML = "";
  container.innerHTML = filtered
    .map((c) => {
      const order = Number(c.order) || 0;
      const desc = c.description ? String(c.description) : "";
      return `
        <div class="p-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <div class="font-bold text-gray-900">${escapeHtml(
                c.name || ""
              )}</div>
              <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Mục: ${order}</span>
            </div>
            ${
              desc
                ? `<div class="text-sm text-gray-600 mt-2">${escapeHtml(
                    desc
                  )}</div>`
                : ""
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              data-edit-category="${c._id}"
            >
              <i class="fas fa-edit mr-1"></i>Sửa
            </button>
            <button
              class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              data-delete-category="${c._id}"
            >
              <i class="fas fa-trash mr-1"></i>Xoá
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  bindCategoryActions();
}

function bindCategoryActions() {
  document.querySelectorAll("[data-edit-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit-category");
      const category = allCategories.find((x) => String(x._id) === String(id));
      if (!category) return;
      currentEditingId = id;
      openCategoryModal(category);
    });
  });

  document.querySelectorAll("[data-delete-category]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-category");
      await deleteCategory(id);
    });
  });
}

function openCategoryModal(category) {
  const modal = document.getElementById("categoryModal");
  const title = document.getElementById("categoryModalTitle");
  const submitBtn = document.getElementById("categorySubmitBtn");

  const idInput = document.getElementById("categoryId");
  const nameInput = document.getElementById("categoryName");
  const descInput = document.getElementById("categoryDescription");
  const orderInput = document.getElementById("categoryOrder");

  if (idInput) idInput.value = currentEditingId || "";
  if (nameInput) nameInput.value = category?.name || "";
  if (descInput) descInput.value = category?.description || "";
  if (orderInput) orderInput.value = category?.order ?? "";

  if (title)
    title.textContent = currentEditingId
      ? "Chỉnh sửa danh mục"
      : "Thêm danh mục";
  if (submitBtn) submitBtn.textContent = currentEditingId ? "Cập nhật" : "Lưu";

  if (modal) modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

async function submitCategory() {
  const name = String(
    document.getElementById("categoryName")?.value || ""
  ).trim();
  const description = String(
    document.getElementById("categoryDescription")?.value || ""
  );
  const orderRaw = String(
    document.getElementById("categoryOrder")?.value ?? ""
  ).trim();
  const order = orderRaw === "" ? null : Number(orderRaw) || 0;

  if (!name) {
    Notification.error("Vui lòng nhập tên danh mục");
    return;
  }

  try {
    let res;
    if (currentEditingId) {
      const payload = { name, description };
      if (order !== null) payload.order = order;
      res = await apiPatch(`/api/tour-categories/${currentEditingId}`, payload);
    } else {
      const payload = { name, description };
      if (order !== null) payload.order = order;
      res = await apiPost("/api/tour-categories/add", payload);
    }

    if (!res) return;
    const result = await res.json();

    if (res.ok && result?.success) {
      Notification.success(
        currentEditingId
          ? "Cập nhật danh mục thành công"
          : "Tạo danh mục thành công"
      );
      window.hideCategoryModal();
      currentEditingId = null;
      await getCategories();
    } else {
      Notification.error(result?.message || "Có lỗi xảy ra");
    }
  } catch (err) {
    console.error(err);
    Notification.error("Lỗi khi lưu danh mục");
  }
}

async function deleteCategory(id) {
  const category = allCategories.find((x) => String(x._id) === String(id));
  if (!category) return;

  Modal.confirm({
    title: "Xoá danh mục",
    message: `Bạn có chắc muốn xoá danh mục <b>${escapeHtml(
      category.name || ""
    )}</b>?<br/>Tour đang thuộc danh mục này sẽ được chuyển về <b>không thuộc danh mục</b>.`,
    icon: "fa-trash",
    iconColor: "red",
    confirmText: "Xoá",
    cancelText: "Huỷ",
    confirmColor: "red",
    onConfirm: async () => {
      const res = await apiDelete(`/api/tour-categories/${id}`);
      if (!res) return;
      const result = await res.json();
      if (res.ok && result?.success) {
        Notification.success("Xoá danh mục thành công");
        await getCategories();
      } else {
        Notification.error(result?.message || "Xoá danh mục thất bại");
      }
    },
  });
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
