export function initAdmin() {
  highlightCurrentPage();
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar-item");

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");

    link.classList.remove(
      "bg-gradient-to-r",
      "from-blue-500",
      "to-purple-600",
      "text-white"
    );
    link.classList.add("text-gray-700");

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
}
document.addEventListener("DOMContentLoaded", initAdmin);
