document.addEventListener("DOMContentLoaded", function () {
  const carouselSections = document.querySelectorAll(".collection-grid-carousel, .collection-grid-scrollable");

  carouselSections.forEach((section) => {
    const container = section.querySelector(".product-carousel, .product-grid");

    // Find navigation buttons inside this section
    const prevButton = section.querySelector(".reviews-navigation-container .nav-button.prev");
    const nextButton = section.querySelector(".reviews-navigation-container .nav-button.next");

    function updateProductAlignment() {
      if (!container) return;

      const productCards = container.querySelectorAll(".product-card");
      if (productCards.length === 0) {
        container.style.justifyContent = "center";
        return;
      }

      let totalWidth = 0;
      const gapStyle = window.getComputedStyle(container).getPropertyValue("gap");
      const gap = parseFloat(gapStyle) || 20;

      productCards.forEach((card, index) => {
        totalWidth += card.offsetWidth;
        if (index < productCards.length - 1) {
          totalWidth += gap;
        }
      });

      const containerWidth = container.clientWidth;
      if (totalWidth < containerWidth - 1) {
        container.style.justifyContent = "center";
      } else {
        container.style.justifyContent = "flex-start";
      }
    }

    function getScrollAmount() {
      if (!container) return 360;

      const productCards = container.querySelectorAll(".product-card");
      if (productCards.length === 0) return 360;

      const firstCard = productCards[0];
      const cardWidth = firstCard.offsetWidth;
      const gapStyle = window.getComputedStyle(container).getPropertyValue("gap");
      const gap = parseFloat(gapStyle) || 20;

      return cardWidth + gap;
    }

    function getCurrentCardIndex() {
      if (!container) return 0;

      const productCards = container.querySelectorAll(".product-card");
      if (productCards.length === 0) return 0;

      const containerLeft = container.scrollLeft;
      const containerCenter = containerLeft + container.clientWidth / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      productCards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(containerCenter - cardCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    }

    function scrollToCard(cardIndex) {
      if (!container) return;

      const productCards = container.querySelectorAll(".product-card");
      if (cardIndex < 0 || cardIndex >= productCards.length) return;

      const targetCard = productCards[cardIndex];
      const cardCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
      const containerCenter = container.clientWidth / 2;
      const scrollPosition = cardCenter - containerCenter;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScrollLeft));

      container.scrollTo({
        left: finalScrollPosition,
        behavior: "smooth",
      });
    }

    function getVisibleCardsCount() {
      if (!container) return 6;

      const containerWidth = container.clientWidth;
      const productCards = container.querySelectorAll(".product-card");
      if (productCards.length === 0) return 6;

      const cardWidth = productCards[0].offsetWidth;
      const gapStyle = window.getComputedStyle(container).getPropertyValue("gap");
      const gap = parseFloat(gapStyle) || 20;

      return Math.floor(containerWidth / (cardWidth + gap));
    }

    function scrollByVisibleCards(direction) {
      if (!container) {
        return;
      }

      // Check if pagination is enabled
      const carouselPages = container.querySelectorAll(".carousel-page");
      if (carouselPages.length > 0) {
        // Handle page-based navigation
        const currentPage =
          container.querySelector(".carousel-page.active") || container.querySelector('.carousel-page[style*="flex"]');
        if (!currentPage) {
          return;
        }

        const currentPageNum = parseInt(currentPage.getAttribute("data-page")) || 1;
        const totalPages = carouselPages.length;

        let targetPageNum;
        if (direction === "next") {
          targetPageNum = currentPageNum < totalPages ? currentPageNum + 1 : 1; // Loop back to first page
        } else {
          targetPageNum = currentPageNum > 1 ? currentPageNum - 1 : totalPages; // Loop to last page
        }

        // Hide current page
        carouselPages.forEach((page) => {
          page.classList.remove("active");
          page.style.display = "none";
        });

        // Show target page
        const targetPage = container.querySelector(`.carousel-page[data-page="${targetPageNum}"]`);
        if (targetPage) {
          targetPage.classList.add("active");
          targetPage.style.display = "flex";
        }

        return;
      }

      // Original scrolling logic for non-paginated carousels
      const productCards = container.querySelectorAll(".product-card");
      if (productCards.length === 0) return;

      const visibleCards = getVisibleCardsCount();
      const currentIndex = getCurrentCardIndex();

      let targetIndex;
      if (direction === "next") {
        targetIndex = Math.min(currentIndex + visibleCards, productCards.length - 1);
      } else {
        targetIndex = Math.max(currentIndex - visibleCards, 0);
      }

      scrollToCard(targetIndex);
    }

    function setupNavigation() {
      if (!container || !prevButton || !nextButton) {
        return;
      }

      prevButton.addEventListener("click", function (e) {
        e.preventDefault();
        scrollByVisibleCards("prev");
      });

      nextButton.addEventListener("click", function (e) {
        e.preventDefault();
        scrollByVisibleCards("next");
      });
    }

    // Initialize
    updateProductAlignment();

    // Handle window resize
    window.addEventListener("resize", updateProductAlignment);

    // Wait for images to load before final alignment
    const images = container ? container.querySelectorAll(".product-card img") : [];
    const imageLoadPromises = [];

    images.forEach((img) => {
      if (!img.complete) {
        imageLoadPromises.push(
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          }),
        );
      }
    });

    if (imageLoadPromises.length > 0) {
      Promise.all(imageLoadPromises).then(() => {
        updateProductAlignment();
      });
    } else {
      updateProductAlignment();
    }

    // Setup navigation
    setupNavigation();
  });
});
