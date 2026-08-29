class SatisfactionGuarantee {
  constructor() {
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.attachEventListeners());
    } else {
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    // Only attach to buttons that specifically have the scroll data attribute
    const scrollButtons = document.querySelectorAll(".guarantee-section__cta[data-scroll-to-first-section='true']");

    scrollButtons.forEach((button) => {
      button.addEventListener("click", (event) => this.handleScrollClick(event, button));
    });
  }

  handleScrollClick(event, button) {
    // Only prevent default for scroll buttons
    event.preventDefault();
    this.scrollToProduct();
    return false;
  }

  scrollToProduct() {
    const productSection = document.querySelector(
      ".shopify-section .product, " +
        '.shopify-section [data-section-type="product"], ' +
        "main#MainContent .product-template, " +
        "main#MainContent .product, " +
        "#ProductSection, " +
        "#shopify-section-product-template, " +
        ".product-section",
    );

    if (productSection) {
      productSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  new SatisfactionGuarantee();
});
