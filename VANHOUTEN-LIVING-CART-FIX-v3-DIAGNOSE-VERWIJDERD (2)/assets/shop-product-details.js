document.addEventListener("DOMContentLoaded", function () {
  const productForms = document.querySelectorAll('form[data-type="add-to-cart-form"]');
  productForms.forEach((form) => {
    const formId = form.id;
    const quantityInputs = document.querySelectorAll(
      `input[name="quantity"][form="${formId}"], .modern-quantity-selector .quantity-input[form="${formId}"]`,
    );
    if (quantityInputs.length === 0) return;
    form.addEventListener("submit", function (e) {
      const activeQuantityInput = quantityInputs[0];
      const quantity = parseInt(activeQuantityInput.value) || 1;
      form.querySelectorAll('input[type="hidden"][name="quantity"]').forEach((input) => {
        input.remove();
      });
      const qtyInput = document.createElement("input");
      qtyInput.type = "hidden";
      qtyInput.name = "quantity";
      qtyInput.value = quantity;
      form.appendChild(qtyInput);
    });
  });

  function handleResponsiveProductTitles() {
    const productTitles = document.querySelectorAll(".shop-product-title[data-font-size][data-mobile-font-size]");

    function adjustAllTitles() {
      const isMobile = window.innerWidth <= 767;
      productTitles.forEach((title) => {
        const size = isMobile ? title.getAttribute("data-mobile-font-size") : title.getAttribute("data-font-size");
        title.style.setProperty("font-size", `${size}px`, "important");
      });
    }

    // Un seul listener pour tous les titres
    adjustAllTitles();

    if (!window.titleResizeHandlerAdded) {
      window.addEventListener("resize", adjustAllTitles);
      window.titleResizeHandlerAdded = true;
    }
  }
  handleResponsiveProductTitles();
  function initFaqAccordions() {
    const faqContainers = document.querySelectorAll(".product-faq");
    faqContainers.forEach((faqContainer) => {
      const faqId = faqContainer.id;
      if (!faqId) return;
      const faqItems = faqContainer.querySelectorAll(".faq-item");
      const innerFaqContainer = faqContainer.querySelector(".faq-container");
      const isAccordion = innerFaqContainer && innerFaqContainer.getAttribute("data-accordion") === "true";
      faqItems.forEach((item) => {
        const question = item.querySelector(".faq-question");
        if (!question) return;
        if (!question.hasAttribute("data-click-listener-added")) {
          question.setAttribute("data-click-listener-added", "true");
          question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            if (isAccordion && !isActive) {
              faqItems.forEach((otherItem) => {
                otherItem.classList.remove("active");
              });
            }
            item.classList.toggle("active");
          });
        }
      });
    });
  }
  initFaqAccordions();
  const readMoreLinks = document.querySelectorAll(".shop-read-more");
  const readLessLinks = document.querySelectorAll(".shop-read-less");
  readMoreLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const parent = this.closest(".shop-product-description");
      parent.querySelector(".shop-truncated-description").style.display = "none";
      parent.querySelector(".shop-full-description").style.display = "block";
    });
  });
  readLessLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const parent = this.closest(".shop-product-description");
      parent.querySelector(".shop-truncated-description").style.display = "block";
      parent.querySelector(".shop-full-description").style.display = "none";
    });
  });
});
