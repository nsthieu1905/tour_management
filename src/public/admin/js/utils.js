export function initAdmin() {
  initSidebarGroups();
  highlightCurrentPage();
}

function initSidebarGroups() {
  const buttons = document.querySelectorAll("[data-sidebar-toggle]");
  if (!buttons?.length) return;

  const currentPath = window.location.pathname;

  buttons.forEach((btn) => {
    const groupKey = btn.getAttribute("data-sidebar-toggle");
    if (!groupKey) return;

    const container = document.querySelector(
      `[data-sidebar-group-container="${groupKey}"]`
    );
    const icon = document.querySelector(
      `[data-sidebar-toggle-icon="${groupKey}"]`
    );
    if (!container) return;

    const isGroupActive = Array.from(
      container.querySelectorAll(".sidebar-item")
    ).some((link) => {
      const href = link.getAttribute("href") || "";
      return (
        href && (currentPath === href || currentPath.startsWith(href + "/"))
      );
    });

    if (isGroupActive) {
      container.classList.remove("hidden");
      if (icon) icon.classList.add("rotate-180");
    }

    btn.addEventListener("click", () => {
      container.classList.toggle("hidden");
      if (icon) icon.classList.toggle("rotate-180");
    });
  });
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar-item");

  const links = Array.from(sidebarLinks)
    .map((link) => ({
      link,
      href: link.getAttribute("href") || "",
    }))
    .filter((x) => x.href);

  let bestMatch = null;
  links.forEach(({ link, href }) => {
    const isMatch = currentPath === href || currentPath.startsWith(href + "/");
    if (!isMatch) return;
    if (!bestMatch || href.length > bestMatch.href.length) {
      bestMatch = { link, href };
    }
  });

  sidebarLinks.forEach((link) => {
    link.classList.remove(
      "bg-gradient-to-r",
      "from-blue-500",
      "to-purple-600",
      "text-white",
      "bg-indigo-50",
      "text-indigo-700",
      "border-l-4",
      "border-indigo-500",
      "font-semibold"
    );
    link.classList.remove("border-transparent");
    link.classList.add("text-gray-700");
  });

  if (bestMatch?.link) {
    const level = bestMatch.link.getAttribute("data-sidebar-level") || "";

    if (level === "2") {
      bestMatch.link.classList.add(
        "bg-indigo-50",
        "text-indigo-700",
        "border-l-4",
        "border-indigo-500",
        "font-semibold"
      );
      bestMatch.link.classList.remove("text-gray-700");
    } else {
      bestMatch.link.classList.add(
        "bg-gradient-to-r",
        "from-blue-500",
        "to-purple-600",
        "text-white"
      );
      bestMatch.link.classList.remove("text-gray-700");
    }
  }
}
document.addEventListener("DOMContentLoaded", initAdmin);
