/**
 * Floating Buttons Handler - Contact Modal
 */

document.addEventListener("DOMContentLoaded", () => {
  const contactModal = document.getElementById("contactModal");
  const contactBtn = document.getElementById("contact");
  const closeContactBtn = document.getElementById("closeContactBtn");
  const closeContactBtnBottom = document.getElementById(
    "closeContactBtnBottom"
  );

  function openContactModal() {
    if (!contactModal) return;
    contactModal.classList.add("active");
    contactModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove("active");
    contactModal.style.display = "none";
    document.body.style.overflow = "";
  }

  if (contactBtn) {
    contactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openContactModal();
    });
  }

  if (closeContactBtn) {
    closeContactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeContactModal();
    });
  }

  if (closeContactBtnBottom) {
    closeContactBtnBottom.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeContactModal();
    });
  }

  if (contactModal) {
    contactModal.addEventListener("click", (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  const chatWindow = document.getElementById("chatWindow");
  const openMessageBtn = document.getElementById("open-mesage");

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (contactModal?.classList.contains("active")) {
        closeContactModal();
      }
      if (chatWindow?.classList.contains("active")) {
        chatWindow.classList.remove("active");
      }
    }
  });

  window.openContactModal = openContactModal;
  window.closeContactModal = closeContactModal;
});
