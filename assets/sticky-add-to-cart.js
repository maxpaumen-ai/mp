document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    initStickyAddToCart();
  }, 500);
  function initStickyAddToCart() {
    const stickyElement = document.getElementById("stickyAddToCart");
    if (!stickyElement) {
      console.warn("Sticky Add to Cart: Element not found");
      return;
    }
    const triggerBehavior = stickyElement.dataset.triggerBehavior || 'atc_button';
    const scrollPercentageTrigger = parseFloat(stickyElement.dataset.scrollPercentage || 25);
    const addToCartSelectors = [
      '.shop-add-to-cart-button',
      'button.shop-add-to-cart-button',
      '.shop-add-to-cart-wrapper button[name="add"]',
      '.product-form button[name="add"]:not([id*="shipping_protection"])',
      'button[name="add"]:not([id*="shipping_protection"]):not(.gb-product-shipping-protection-product-tirgger)',
      "button.add-to-cart:not([id*='shipping_protection'])",
      "button.add-to-cart-button:not([id*='shipping_protection'])",
      "button.product-form__cart-submit:not([id*='shipping_protection'])",
      "button.product-form__submit:not([id*='shipping_protection']):not(.gb-product-shipping-protection-product-tirgger)",
      'form[action*="/cart/add"] button[type="submit"]:not([id*="shipping_protection"])',
      ".ProductForm__AddToCart",
    ];
    let addToCartButton = null;
    for (const selector of addToCartSelectors) {
      const button = document.querySelector(selector);
      // Skip shipping protection buttons
      if (button && !button.id.includes('shipping_protection') && !button.classList.contains('gb-product-shipping-protection-product-tirgger')) {
        addToCartButton = button;
        break;
      }
    }
    setupScrollHandler();

    if (!addToCartButton) {
      const observer = new MutationObserver(function (mutations) {
        for (const selector of addToCartSelectors) {
          const button = document.querySelector(selector);
          if (button && !button.id.includes('shipping_protection') && !button.classList.contains('gb-product-shipping-protection-product-tirgger')) {
            addToCartButton = button;
            observer.disconnect();
            break;
          }
        }
      });
      observer.observe(document.body, { childList: !0, subtree: !0 });
      setTimeout(function () {
        observer.disconnect();
      }, 10000);
    }
    function setupScrollHandler() {
      const scrollThreshold = -100;
      let isVisible = !1;
      let debounceTimer = null;
      console.log("Sticky Add to Cart: Scroll handler initialized", { addToCartButton });
      function handleScroll() {
        if (!addToCartButton) {
          if (triggerBehavior === 'always_except_atc') {
            showStickyButton();
            return;
          }
          if (triggerBehavior === 'atc_button') {
            console.warn("Sticky Add to Cart: Add to cart button not found");
            return;
          }
        }
        const desktopShipping = document.querySelector(".sticky-add-to-cart__shipping");
        const mobileShipping = document.querySelector(".mobile-shipping-info");
        if (desktopShipping && window.stickySettings) {
          if (window.stickySettings.showDesktopShipping === !1 || window.stickySettings.showDeliveryDate === !1) {
            desktopShipping.style.display = "none";
            desktopShipping.setAttribute("aria-hidden", "true");
          }
        }
        if (mobileShipping && window.stickySettings) {
          if (window.stickySettings.showMobileShipping === !1 || window.stickySettings.showDeliveryDate === !1) {
            mobileShipping.style.display = "none";
            mobileShipping.setAttribute("aria-hidden", "true");
          }
        }
        const cartDrawerWrapper = document.querySelector("cart-drawer.drawer, .drawer.cart-drawer, .cart-drawer");
        const cartSidebar = document.querySelector("#sidebar-cart, #CartDrawer, .cart-sidebar");
        const isCartOpen =
          (cartDrawerWrapper &&
            (cartDrawerWrapper.classList.contains("active") ||
              cartDrawerWrapper.classList.contains("is-open") ||
              cartDrawerWrapper.classList.contains("drawer--is-open") ||
              cartDrawerWrapper.hasAttribute("open") ||
              cartDrawerWrapper.getAttribute("aria-hidden") === "false")) ||
          (cartSidebar &&
            (cartSidebar.classList.contains("is-open") ||
              cartSidebar.classList.contains("drawer--is-open") ||
              cartSidebar.getAttribute("aria-hidden") === "false"));
        if (isCartOpen) {
          hideStickyButton();
          return;
        }

        let shouldBeVisible = false;

        if (triggerBehavior === 'scroll_percentage') {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;
          shouldBeVisible = scrollPercent >= scrollPercentageTrigger;
        } else if (triggerBehavior === 'always_except_atc') {
          if (!addToCartButton) {
            shouldBeVisible = true;
          } else {
            const addToCartRect = addToCartButton.getBoundingClientRect();
            const isButtonInView = addToCartRect.bottom > 0 && addToCartRect.top < window.innerHeight;
            shouldBeVisible = !isButtonInView;
          }
        } else {
          if (!addToCartButton) return;
          const addToCartRect = addToCartButton.getBoundingClientRect();
          const buttonBottom = addToCartRect.bottom;
          shouldBeVisible = buttonBottom < scrollThreshold;
        }
        if (shouldBeVisible !== isVisible) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (shouldBeVisible) {
              showStickyButton();
            } else {
              hideStickyButton();
            }
          }, 50);
        }
      }
      function showStickyButton() {
        if (isVisible) return;
        stickyElement.style.display = "block";
        void stickyElement.offsetWidth;
        stickyElement.classList.add("show");
        isVisible = !0;
      }
      function hideStickyButton() {
        if (!isVisible) return;
        stickyElement.classList.remove("show");
        setTimeout(() => {
          if (!stickyElement.classList.contains("show")) {
            stickyElement.style.display = "none";
          }
          isVisible = !1;
        }, 400);
      }
      window.addEventListener("scroll", handleScroll, { passive: !0 });
      window.addEventListener("resize", handleScroll, { passive: !0 });
      // Initial check on load
      handleScroll();
      document.addEventListener("click", function (e) {
        if (e.target.closest('[data-action="open-drawer"], [data-open-cart], .js-drawer-open-cart, .cart-link')) {
          setTimeout(handleScroll, 100);
        }
      });
      document.addEventListener("cart:open", handleScroll);
      document.addEventListener("cart-drawer:open", handleScroll);
      document.addEventListener("cart.requestStarted", handleScroll);
      document.addEventListener("cartDrawerOpened", handleScroll);
      const drawerObserver = new MutationObserver(function (mutations) {
        for (let mutation of mutations) {
          if (
            mutation.type === "attributes" &&
            (mutation.attributeName === "aria-hidden" ||
              mutation.attributeName === "class" ||
              mutation.attributeName === "open")
          ) {
            handleScroll();
          }
        }
      });
      const cartDrawers = document.querySelectorAll("cart-drawer, #sidebar-cart, #CartDrawer, .cart-drawer");
      cartDrawers.forEach((drawer) => {
        drawerObserver.observe(drawer, { attributes: !0 });
      });
      setTimeout(handleScroll, 300);
    }
  }
});
function scrollToSection(btn, event) {
  event.preventDefault();
  var behavior = btn.getAttribute('data-button-behavior');
  
  if (behavior === 'scroll_to_percentage') {
    var percentage = parseInt(btn.getAttribute('data-scroll-to-percentage')) || 50;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollPosition = (percentage / 100) * docHeight;
    window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    return;
  }
  
  var index = parseInt(btn.getAttribute('data-scroll-to-section')) - 1;
  var sections = document.querySelectorAll('.shopify-section');
  if (sections[index]) {
    var offsetAttr = btn.getAttribute('data-scroll-offset');
    var baseOffset = (offsetAttr !== null && offsetAttr !== '') ? parseInt(offsetAttr) : 0;
    
    var sectionHeader = document.querySelector('.section-header');
    var headerWrapper = document.querySelector('.header-wrapper');
    var headerOffset = 0;
    var elementPosition = sections[index].getBoundingClientRect().top;
    var targetPosition = elementPosition + window.pageYOffset - baseOffset;

    if (sectionHeader) {
      var stickyHeaderEl = document.querySelector('sticky-header');
      var stickyType = stickyHeaderEl ? stickyHeaderEl.getAttribute('data-sticky-type') : null;
      var headerHeight = headerWrapper ? headerWrapper.offsetHeight : sectionHeader.offsetHeight;

      if (stickyType === 'always' || stickyType === 'reduce-logo-size') {
        headerOffset = headerHeight;
      } else if (stickyType === 'on-scroll-up') {
        var currentScroll = window.pageYOffset;
        if (targetPosition < currentScroll) {
          headerOffset = headerHeight;
        }
      }
    }

    var offsetPosition = targetPosition - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  }
}
window.scrollToSection = scrollToSection;