/*
 * Component: Benefits Carousel
 * Description: Horizontal scrolling carousel with CSS-based animation
 * Note: Animation is handled by CSS keyframes generated in the Liquid template
 */

class BenefitsCarousel {
  constructor(element) {
    this.container = element;
    this.sectionId = element.dataset.sectionId;

    this.init();
  }

  init() {
    this.checkReducedMotion();
  }

  checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Animation will be disabled via CSS @media query
      console.log("Carousel: Reduced motion detected, animation disabled");
    }
  }
}

// Auto-initialize components
document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll('[data-component="helps-with-carousel"]');

  containers.forEach((container) => {
    if (!container.dataset.initialized) {
      new BenefitsCarousel(container);
      container.dataset.initialized = "true";
    }
  });
});

// Re-initialize on Shopify section load (theme editor)
document.addEventListener("shopify:section:load", function (event) {
  const container = event.target.querySelector('[data-component="helps-with-carousel"]');
  if (container && !container.dataset.initialized) {
    new BenefitsCarousel(container);
    container.dataset.initialized = "true";
  }
});
