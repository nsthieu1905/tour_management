// Chat functionality
const chatWindow = document.getElementById("chatWindow");
const openChatBtn = document.getElementById("open-mesage");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");
const typingIndicator = document.getElementById("typingIndicator");

// Contact modal functionality
const contactModal = document.getElementById("contactModal");
const contactBtn = document.getElementById("contact");
const closeContactBtn = document.getElementById("closeContactBtn");
const closeContactBtnBottom = document.getElementById("closeContactBtnBottom");

// Open/Close Chat
openChatBtn.addEventListener("click", () => {
  chatWindow.classList.toggle("active");
  if (chatWindow.classList.contains("active")) {
    chatInput.focus();
  }
});

closeChatBtn.addEventListener("click", () => {
  chatWindow.classList.remove("active");
});

// Send Message
function sendMessage() {
  const message = chatInput.value.trim();
  if (message === "") return;

  // Add user message
  const userMessage = document.createElement("div");
  userMessage.className = "message user";
  userMessage.textContent = message;
  chatMessages.appendChild(userMessage);

  // Clear input
  chatInput.value = "";

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Show typing indicator
  typingIndicator.classList.add("active");

  // Simulate bot response
  setTimeout(() => {
    typingIndicator.classList.remove("active");

    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    botMessage.textContent =
      "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể. 😊";
    chatMessages.appendChild(botMessage);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1500);
}

sendChatBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Open/Close Contact Modal
contactBtn.addEventListener("click", () => {
  contactModal.classList.add("active");
});

closeContactBtn.addEventListener("click", () => {
  contactModal.classList.remove("active");
});

closeContactBtnBottom.addEventListener("click", () => {
  contactModal.classList.remove("active");
});

// Close modal when clicking outside
contactModal.addEventListener("click", (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove("active");
  }
});

// Close chat when clicking outside
document.addEventListener("click", (e) => {
  if (!chatWindow.contains(e.target) && !openChatBtn.contains(e.target)) {
    // chatWindow.classList.remove('active');
  }
});
