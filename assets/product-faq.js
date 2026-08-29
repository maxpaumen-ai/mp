/**
 * Product FAQ Section JavaScript
 * Handles accordion functionality and FAQ interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  const faqSections = document.querySelectorAll(".product-faq-section");

  faqSections.forEach((section) => {
    const faqItems = section.querySelectorAll(".faq-item");
    const accordionMode = section.dataset.accordionMode === "true";

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      if (!question) return;

      question.addEventListener("click", function () {
        const isActive = item.classList.contains("active");

        // If in accordion mode, close all other items
        if (accordionMode && !isActive) {
          faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
              otherItem.classList.remove("active");
            }
          });
        }

        // Toggle the current item
        item.classList.toggle("active");
      });
    });
  });

  // Initialize with first item open if specified
  faqSections.forEach((section) => {
    if (section.dataset.openFirst === "true") {
      const firstItem = section.querySelector(".faq-item");
      if (firstItem) {
        firstItem.classList.add("active");
      }
    }
  });
});

/*
 * Product FAQ Section JavaScript
 * Handles accordion functionality and FAQ interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  const faqSections = document.querySelectorAll(".product-faq-section");

  faqSections.forEach((section) => {
    const faqItems = section.querySelectorAll(".faq-item");
    const accordionMode = section.dataset.accordionMode === "true";

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      if (!question) return;

      question.addEventListener("click", function () {
        const isActive = item.classList.contains("active");

        // If in accordion mode, close all other items
        if (accordionMode && !isActive) {
          faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
              otherItem.classList.remove("active");
            }
          });
        }

        // Toggle the current item
        item.classList.toggle("active");
      });
    });
  });

  // Initialize with first item open if specified
  faqSections.forEach((section) => {
    if (section.dataset.openFirst === "true") {
      const firstItem = section.querySelector(".faq-item");
      if (firstItem) {
        firstItem.classList.add("active");
      }
    }
  });
});
