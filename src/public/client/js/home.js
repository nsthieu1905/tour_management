// Global variables
let selectedTours = [];
let isVoiceSearchActive = false;

// AI Search functionality
document.getElementById("aiSearch").addEventListener("input", function (e) {
  const query = e.target.value;
  if (query.length > 2) {
    showAISuggestions();
  } else {
    hideAISuggestions();
  }
});

function showAISuggestions() {
  document.getElementById("aiSuggestions").classList.remove("hidden");
}

function hideAISuggestions() {
  document.getElementById("aiSuggestions").classList.add("hidden");
}

// Voice Search
document.getElementById("voiceSearch").addEventListener("click", function () {
  if (!isVoiceSearchActive) {
    startVoiceSearch();
  } else {
    stopVoiceSearch();
  }
});

function startVoiceSearch() {
  isVoiceSearchActive = true;
  document.getElementById("voiceSearch").innerHTML =
    '<i class="fas fa-stop text-xl"></i>';
  document.getElementById("aiSearch").placeholder = "Đang nghe...";

  // Simulate voice recognition
  setTimeout(() => {
    document.getElementById("aiSearch").value = "Tôi muốn đi biển miền Nam";
    stopVoiceSearch();
    showAISuggestions();
  }, 3000);
}

function stopVoiceSearch() {
  isVoiceSearchActive = false;
  document.getElementById("voiceSearch").innerHTML =
    '<i class="fas fa-microphone text-xl"></i>';
  document.getElementById("aiSearch").placeholder = "Tôi muốn đi du lịch...";
}

// Tour comparison functionality
function toggleCompare(button, tourId) {
  const checkbox = button.parentElement.querySelector(".compare-checkbox");
  const isSelected = checkbox.checked;

  if (!isSelected && selectedTours.length >= 3) {
    alert("Chỉ có thể so sánh tối đa 3 tours");
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

function updateCompareButton() {
  const compareBtn = document.getElementById("compareBtn");
  compareBtn.innerHTML = `<i class="fas fa-balance-scale mr-2"></i>So sánh (${selectedTours.length})`;

  if (selectedTours.length > 0) {
    compareBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    compareBtn.classList.add("bg-green-600", "hover:bg-green-700");
  } else {
    compareBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
    compareBtn.classList.remove("bg-green-600", "hover:bg-green-700");
  }
}

document.getElementById("compareBtn").addEventListener("click", function () {
  if (selectedTours.length < 2) {
    alert("Vui lòng chọn ít nhất 2 tours để so sánh");
    return;
  }
  showComparison();
});

function showComparison() {
  const modal = document.getElementById("comparisonModal");
  const content = document.getElementById("comparisonContent");

  // Sample comparison data
  const tourData = {
    sapa: {
      name: "Tour Sapa 3N2Đ",
      price: "2.890.000đ",
      rating: "4.8",
      carbon: "2.1 tấn",
    },
    phuquoc: {
      name: "Phú Quốc 4N3Đ",
      price: "4.590.000đ",
      rating: "4.9",
      carbon: "3.5 tấn",
    },
    japan: {
      name: "Nhật Bản 6N5Đ",
      price: "28.900.000đ",
      rating: "4.7",
      carbon: "8.2 tấn",
    },
  };

  content.innerHTML = "";

  selectedTours.forEach((tourId) => {
    const tour = tourData[tourId];
    if (tour) {
      content.innerHTML += `
                        <div class="border rounded-lg p-4">
                            <h3 class="font-bold text-lg mb-2">${tour.name}</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span>Giá:</span>
                                    <span class="font-semibold text-indigo-600">${tour.price}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Đánh giá:</span>
                                    <span class="font-semibold">${tour.rating}/5</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Carbon:</span>
                                    <span class="font-semibold">${tour.carbon}</span>
                                </div>
                            </div>
                            <button class="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                Chọn tour này
                            </button>
                        </div>
                    `;
    }
  });

  modal.classList.add("active");
}

function closeComparison() {
  document.getElementById("comparisonModal").classList.remove("active");
}

// Tour detail functionality
function showTourDetail(tourId) {
  const modal = document.getElementById("tourDetailModal");
  const timeline = document.getElementById("tourTimeline");

  // Sample tour data
  const tourData = {
    sapa: {
      title: "Tour Sapa 3N2Đ",
      price: "2.890.000đ",
      carbon: "2.1 tấn",
      timeline: [
        {
          day: "Ngày 1",
          title: "Hà Nội - Sapa",
          desc: "Khởi hành từ Hà Nội, di chuyển bằng xe giường nằm",
        },
        {
          day: "Ngày 2",
          title: "Thăm bản Cát Cát",
          desc: "Khám phá văn hóa dân tộc H'Mông",
        },
        {
          day: "Ngày 3",
          title: "Fansipan - Về Hà Nội",
          desc: "Chinh phục đỉnh Fansipan và trở về",
        },
      ],
    },
    phuquoc: {
      title: "Phú Quốc 4N3Đ",
      price: "4.590.000đ",
      carbon: "3.5 tấn",
      timeline: [
        {
          day: "Ngày 1",
          title: "TP.HCM - Phú Quốc",
          desc: "Bay từ TP.HCM, nhận phòng resort",
        },
        {
          day: "Ngày 2",
          title: "Tour 4 đảo",
          desc: "Khám phá các đảo xung quanh Phú Quốc",
        },
        {
          day: "Ngày 3",
          title: "Cáp treo Hòn Thơm",
          desc: "Trải nghiệm cáp treo dài nhất thế giới",
        },
        {
          day: "Ngày 4",
          title: "Tự do - Về TP.HCM",
          desc: "Thời gian tự do và bay về",
        },
      ],
    },
    japan: {
      title: "Nhật Bản 6N5Đ",
      price: "28.900.000đ",
      carbon: "8.2 tấn",
      timeline: [
        {
          day: "Ngày 1",
          title: "Hà Nội - Tokyo",
          desc: "Bay từ Hà Nội đến Tokyo Narita",
        },
        {
          day: "Ngày 2",
          title: "Tokyo City Tour",
          desc: "Thăm Sensoji, Shibuya, Tokyo Skytree",
        },
        {
          day: "Ngày 3",
          title: "Tokyo - Osaka",
          desc: "Di chuyển bằng tàu Shinkansen",
        },
        {
          day: "Ngày 4",
          title: "Osaka - Kyoto",
          desc: "Thăm lâu đài Osaka, đền Kiyomizu",
        },
        {
          day: "Ngày 5",
          title: "Kyoto - Tokyo",
          desc: "Thăm rừng tre Arashiyama",
        },
        { day: "Ngày 6", title: "Tokyo - Hà Nội", desc: "Mua sắm và bay về" },
      ],
    },
  };

  const tour = tourData[tourId];
  if (tour) {
    document.getElementById("tourTitle").textContent = tour.title;
    document.getElementById("tourPrice").textContent = tour.price;
    document.getElementById("carbonFootprint").textContent = tour.carbon;

    timeline.innerHTML = "";
    tour.timeline.forEach((item) => {
      timeline.innerHTML += `
                        <div class="timeline-item">
                            <div class="font-semibold text-indigo-600">${item.day}</div>
                            <div class="font-medium text-gray-900 mt-1">${item.title}</div>
                            <div class="text-gray-600 text-sm mt-1">${item.desc}</div>
                        </div>
                    `;
    });
  }

  modal.classList.add("active");
}

function closeTourDetail() {
  document.getElementById("tourDetailModal").classList.remove("active");
}

// AR Preview functionality
function showARPreview(destination) {
  document.getElementById("arDestination").textContent = destination;
  document.getElementById("arModal").classList.add("active");
}

function closeARPreview() {
  document.getElementById("arModal").classList.remove("active");
}

// Close modals when clicking outside
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});

// Budget slider functionality
document.getElementById("budgetSlider").addEventListener("input", function (e) {
  const value = parseInt(e.target.value);
  const formatted = new Intl.NumberFormat("vi-VN").format(value) + "đ";
  document.getElementById("budgetValue").textContent = formatted;
});

// Preference tags selection
document.querySelectorAll(".preference-tag").forEach((tag) => {
  tag.addEventListener("click", function () {
    this.classList.toggle("bg-white");
    this.classList.toggle("bg-opacity-20");
    this.classList.toggle("bg-opacity-40");
    this.classList.toggle("text-white");
    this.classList.toggle("text-purple-600");
  });
});

// AI Travel Planner
document.getElementById("generatePlan").addEventListener("click", function () {
  const button = this;
  const resultDiv = document.getElementById("aiPlanResult");

  // Show loading
  button.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo lịch trình...';
  button.disabled = true;

  resultDiv.innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p class="text-white opacity-70">AI đang phân tích sở thích của bạn...</p>
                </div>
            `;

  // Simulate AI processing
  setTimeout(() => {
    const budget = document.getElementById("budgetSlider").value;
    const selectedPrefs = Array.from(
      document.querySelectorAll(".preference-tag.bg-white")
    ).map((tag) => tag.dataset.pref);

    resultDiv.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-white bg-opacity-20 rounded-lg p-4">
                            <h4 class="font-semibold mb-2">🎯 Lịch trình được đề xuất</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Điểm đến:</span>
                                    <span class="font-medium">Đà Nẵng - Hội An</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Thời gian:</span>
                                    <span class="font-medium">4 ngày 3 đêm</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Phù hợp:</span>
                                    <span class="font-medium">95%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 rounded-lg p-4">
                            <h4 class="font-semibold mb-2">📅 Lịch trình chi tiết</h4>
                            <div class="space-y-2 text-sm">
                                <div>• Ngày 1: Bay đến Đà Nẵng, check-in resort</div>
                                <div>• Ngày 2: Bà Nà Hills, cầu Vàng</div>
                                <div>• Ngày 3: Phố cổ Hội An, đèn lồng</div>
                                <div>• Ngày 4: Mỹ Khê beach, bay về</div>
                            </div>
                        </div>
                        
                        <button class="w-full bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Đặt lịch trình này
                        </button>
                    </div>
                `;

    button.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo lịch trình mới';
    button.disabled = false;

    showNotification("Lịch trình AI đã được tạo thành công!", "success");
  }, 3000);
});

// Chat functionality
document.getElementById("sendChat").addEventListener("click", sendMessage);
document.getElementById("chatInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById("chatMessages");

  // Add user message
  chatMessages.innerHTML += `
                <div class="flex items-start space-x-2 justify-end">
                    <div class="bg-white bg-opacity-30 rounded-lg p-3 max-w-xs">
                        <p class="text-sm">${message}</p>
                    </div>
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-white text-sm"></i>
                    </div>
                </div>
            `;

  input.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Simulate bot response
  setTimeout(() => {
    const responses = [
      "Tôi hiểu bạn quan tâm đến điều này. Để tư vấn tốt nhất, bạn có thể cho tôi biết thêm về ngân sách và thời gian dự kiến không?",
      "Đây là một lựa chọn tuyệt vời! Tôi có thể giúp bạn tìm những tour phù hợp với yêu cầu này.",
      "Dựa trên thông tin bạn cung cấp, tôi khuyên bạn nên xem xét các tour trong khoảng thời gian này.",
      "Tôi sẽ tìm kiếm những ưu đãi tốt nhất cho bạn. Vui lòng chờ một chút...",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    chatMessages.innerHTML += `
                    <div class="flex items-start space-x-2">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-robot text-white text-sm"></i>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-lg p-3 max-w-xs">
                            <p class="text-sm">${randomResponse}</p>
                        </div>
                    </div>
                `;

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1000);
}

// Notification system
function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer");
  const notification = document.createElement("div");

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  notification.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
  notification.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

  container.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// Floating action buttons
document.getElementById("aiAssistant").addEventListener("click", function () {
  // Scroll to chat section
  document
    .querySelector("#chatMessages")
    .scrollIntoView({ behavior: "smooth" });
  showNotification("Chào mừng đến với AI Assistant!", "info");
});

document.getElementById("quickBooking").addEventListener("click", function () {
  showNotification("Tính năng đặt nhanh sẽ sớm ra mắt!", "info");
});

document.getElementById("emergencyHelp").addEventListener("click", function () {
  showNotification("Hotline khẩn cấp: 1900-1234", "warning");
});

// Real-time updates simulation
function simulateRealTimeUpdates() {
  const updates = [
    "Giá tour Sapa giảm 15% trong 2 giờ tới!",
    "Còn 3 chỗ cuối cho tour Phú Quốc khởi hành ngày mai",
    "Thời tiết Đà Nẵng thuận lợi cho du lịch tuần này",
    "Ưu đãi đặc biệt: Mua 2 tour tặng 1 voucher spa",
  ];

  setInterval(() => {
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    showNotification(randomUpdate, "info");
  }, 30000); // Show notification every 30 seconds
}

// Price tracking and alerts
function trackPriceChanges() {
  // Simulate price changes
  const tourCards = document.querySelectorAll(".card-hover");

  setInterval(() => {
    const randomCard = tourCards[Math.floor(Math.random() * tourCards.length)];
    const priceElement = randomCard.querySelector(
      ".text-2xl.font-bold.text-indigo-600"
    );

    if (priceElement && Math.random() > 0.7) {
      const originalPrice = priceElement.textContent;
      priceElement.style.animation = "pulse 1s ease-in-out 3 alternate";

      setTimeout(() => {
        priceElement.style.animation = "";
        showNotification(`Giá tour vừa được cập nhật!`, "success");
      }, 3000);
    }
  }, 45000);
}

// Advanced search with filters
function initAdvancedSearch() {
  const searchInput = document.getElementById("aiSearch");
  let searchTimeout;

  searchInput.addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    const query = e.target.value;

    if (query.length > 2) {
      searchTimeout = setTimeout(() => {
        performAdvancedSearch(query);
      }, 500);
    }
  });
}

function performAdvancedSearch(query) {
  const suggestions = document.getElementById("aiSuggestions");

  // Simulate AI-powered search suggestions
  const mockSuggestions = [
    `🏖️ Tour biển ${query} - Từ 2.5 triệu`,
    `🏔️ Tour núi ${query} - Từ 1.8 triệu`,
    `🏛️ Tour văn hóa ${query} - Từ 3.2 triệu`,
    `🍜 Tour ẩm thực ${query} - Từ 1.5 triệu`,
  ];

  suggestions.innerHTML = `
                <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-robot mr-2 text-indigo-600"></i>
                        <span class="font-medium">AI gợi ý cho "${query}":</span>
                    </div>
                    <div class="space-y-1">
                        ${mockSuggestions
                          .map(
                            (suggestion) =>
                              `<div class="cursor-pointer hover:bg-gray-100 p-2 rounded">${suggestion}</div>`
                          )
                          .join("")}
                    </div>
                </div>
            `;

  suggestions.classList.remove("hidden");
}

// Dynamic pricing based on demand
function initDynamicPricing() {
  const priceElements = document.querySelectorAll(
    ".text-2xl.font-bold.text-indigo-600"
  );

  // priceElements.forEach((element) => {
  //   element.addEventListener("mouseenter", function () {
  //     const tooltip = document.createElement("div");
  //     tooltip.className =
  //       "absolute bg-black text-white text-xs rounded py-1 px-2 z-10 -top-8 left-0";
  //     tooltip.textContent = "Giá có thể thay đổi theo thời gian thực";

  //     this.style.position = "relative";
  //     this.appendChild(tooltip);
  //   });

  //   element.addEventListener("mouseleave", function () {
  //     const tooltip = this.querySelector(".absolute");
  //     if (tooltip) tooltip.remove();
  //   });
  // });
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Add some interactive animations
  const cards = document.querySelectorAll(".card-hover");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Initialize advanced features
  initAdvancedSearch();
  initDynamicPricing();
  // simulateRealTimeUpdates();
  trackPriceChanges();

  // Show welcome notification
  // setTimeout(() => {
  //   showNotification("Chào mừng đến với TravelSmart! 🎉", "success");
  // }, 1000);
});

// (function () {
//   function c() {
//     var b = a.contentDocument || a.contentWindow.document;
//     if (b) {
//       var d = b.createElement("script");
//       d.innerHTML =
//         "window.__CF$cv$params={r:'9647dad6f6513424',t:'MTc1MzQwNjYzNi4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
//       b.getElementsByTagName("head")[0].appendChild(d);
//     }
//   }
//   if (document.body) {
//     var a = document.createElement("iframe");
//     a.height = 1;
//     a.width = 1;
//     a.style.position = "absolute";
//     a.style.top = 0;
//     a.style.left = 0;
//     a.style.border = "none";
//     a.style.visibility = "hidden";
//     document.body.appendChild(a);
//     if ("loading" !== document.readyState) c();
//     else if (window.addEventListener) document.addEventListener("DOMContentLoaded", c);
//     else {
//       var e = document.onreadystatechange || function () {};
//       document.onreadystatechange = function (b) {
//         e(b);
//         "loading" !== document.readyState && ((document.onreadystatechange = e), c());
//       };
//     }
//   }
// })();
