class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("keyup", (evt) => {
      if (evt.code === "Escape") {
        this.close(true);
      }
    });

    // VHL V1.8: event delegation blijft intact wanneer Shopify de inhoud
    // van #CartDrawer opnieuw rendert. Hierdoor hoeft de overlaylistener
    // na verwijderen/aantal wijzigen niet opnieuw gebonden te worden.
    this.addEventListener("click", (event) => {
      if (event.target && event.target.id === "CartDrawer-Overlay") {
        this.close(true);
      }
    });

    this.setHeaderCartIconAccessibility();
    this.bindCartDrawerTriggers();
    this.bindUpsellButton();
    this.bindDiscountCode();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    if (!cartLink) return;

    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      console.log("[VHL CART DEBUG] #cart-icon-bubble clicked");
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  /**
   * Desktop + mobiel header cart-icoon (sections/header.liquid,
   * [data-cart-drawer-trigger]). Eén gedelegeerde document-level
   * click-handler i.p.v. losse listeners per element, zodat beide
   * triggers (die bewust geen gedeelde id hebben) dezelfde, al
   * bestaande drawer-instance openen. Blijft normale /cart-navigatie
   * toestaan (via de bestaande href) als deze cart-drawer instance
   * niet (meer) in de DOM aanwezig is.
   */
  bindCartDrawerTriggers() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-cart-drawer-trigger]");
      if (!trigger) return;

      console.log("[VHL CART DEBUG] header data-cart-drawer-trigger clicked", {
        connected: this.isConnected,
      });

      // Alleen preventDefault + open() als deze cart-drawer instance
      // daadwerkelijk (nog) in de DOM zit. Zo niet: gewone link-navigatie
      // naar routes.cart_url blijft intact als fallback.
      if (!this.isConnected) return;

      event.preventDefault();
      this.open(trigger);
    });
  }

  bindUpsellButton() {
    this.addEventListener("click", (event) => {
      const upsellButton = event.target.closest(".upsell-add-button");
      if (upsellButton) {
        event.preventDefault();

        const form = upsellButton.closest(".upsell-form");
        const variantId = form.querySelector('input[name="id"]').value;

        this.addItemToCart(variantId);
      }
    });
  }

  bindDiscountCode() {
    this.addEventListener("submit", async (event) => {
      const form = event.target.closest(".cart-discount-code-form");
      if (!form) return;

      event.preventDefault();

      const input = form.querySelector(".cart-discount-code-input");
      const button = form.querySelector(".cart-discount-code-button");
      const message = form.querySelector(".cart-discount-code-message");
      const code = input?.value?.trim();

      const showMessage = (text, type = "") => {
        if (!message) return;
        message.textContent = text;
        message.className = `cart-discount-code-message ${type}`.trim();
      };

      if (!code) {
        showMessage("Vul eerst een kortingscode in.", "error");
        return;
      }

      if (button) {
        button.disabled = true;
        button.classList.add("loading");
      }
      showMessage("");

      try {
        // Gebruik Shopify's eigen discount-endpoint. De cookie/session die
        // Shopify hier zet is dezelfde die bij checkout wordt gebruikt.
        await fetch(`/discount/${encodeURIComponent(code)}?redirect=/cart`, {
          method: "GET",
          credentials: "same-origin",
          redirect: "follow",
        });

        // Haal daarna de actuele drawer-section opnieuw op. De bestaande
        // cart-drawer instance blijft bestaan; alleen de binnenste markup
        // wordt via de gedeelde updateCartDrawer helper vernieuwd.
        const response = await fetch(`${window.Shopify?.routes?.root || "/"}cart?section_id=cart-drawer`, {
          credentials: "same-origin",
        });
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newDrawer = doc.querySelector("#CartDrawer");
        const currentDrawer = this.querySelector("#CartDrawer");

        if (newDrawer && currentDrawer && typeof updateCartDrawer === "function") {
          updateCartDrawer(currentDrawer, newDrawer, false);
        }

        requestAnimationFrame(() => this.open());
        showMessage("Kortingscode verwerkt. De definitieve korting zie je zodra de voorwaarden van de code zijn gehaald.", "success");
      } catch (error) {
        console.error("Kortingscode kon niet worden toegepast:", error);
        showMessage("Kortingscode kon niet worden toegepast. Controleer de code en probeer opnieuw.", "error");
      } finally {
        if (button) {
          button.disabled = false;
          button.classList.remove("loading");
        }
      }
    });
  }

  async addItemToCart(variantId) {
    const sections = this.getSectionsToRender().map((section) => section.id);

    const body = JSON.stringify({
      id: variantId,
      quantity: 1,
      sections: sections,
      sections_url: window.location.pathname,
    });

    try {
      const response = await fetch(`${routes.cart_add_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: `application/json`,
        },
        body,
      });

      if (response.status === 422) {
        const errorData = await response.json();
        // Handle error (e.g., show a notification)
        console.error("Error adding item to cart:", errorData.description);
        return;
      }

      const parsedState = await response.json();
      this.renderContents(parsedState);
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  }

  /**
   * Refresh cart drawer after AJAX cart operations
   * Can be called directly or will be triggered by 'cart:ajax-update' event
   * @param {Object} sectionsData - Optional sections data from cart response
   */
  async refreshCartDrawer(sectionsData = null) {
    if (sectionsData && sectionsData.sections) {
      const dataToRender = {
        ...sectionsData,
        id: sectionsData.id || this.productId || null,
        item_count: sectionsData.item_count || 0
      };
      this.renderContents(dataToRender);
      return;
    }

    try {
      const sections = this.getSectionsToRender().map((section) => section.id);
      const url = `${window.location.pathname}?sections=${sections.join(',')}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return;
      }

      const parsedState = await response.json();
      
      // Wrap return in sections object for renderContents
      let sectionsData = null;
      if (parsedState.sections) {
        sectionsData = parsedState.sections;
      } else {
        sectionsData = {};
        const sectionIds = this.getSectionsToRender().map((section) => section.id);
        sectionIds.forEach((sectionId) => {
          if (parsedState[sectionId]) {
            sectionsData[sectionId] = parsedState[sectionId];
          }
        });
      }

      if (!sectionsData || Object.keys(sectionsData).length === 0) {
        console.error("No sections found in response:", parsedState);
        return;
      }

      const dataToRender = {
        sections: sectionsData,
        id: parsedState.id || this.productId || null,
        item_count: parsedState.item_count || 0
      };
      
      this.renderContents(dataToRender);
    } catch (error) {
      console.error("Error refreshing cart drawer:", error);
    }
  }

  startCountdownTimer() {
    const timerElement = document.getElementById("cart-countdown-timer");
    if (!timerElement) return;

    // Reset timer to 10 minutes
    let minutes = 10;
    let seconds = 0;

    // Clear any existing timer
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Update the timer display
    const updateTimer = () => {
      timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Initial display
    updateTimer();

    // Start the countdown
    this.countdownInterval = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(this.countdownInterval);
          return;
        }
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }

      updateTimer();
    }, 1000);
  }

  open(triggeredBy) {
    if (typeof vhlCartDebugSnapshot === "function") {
      vhlCartDebugSnapshot("CartDrawer.open() called", {
        triggeredByTag: triggeredBy ? triggeredBy.tagName : null,
        triggeredById: triggeredBy ? triggeredBy.id : null,
      });
    } else {
      console.log("[VHL CART DEBUG] CartDrawer.open() called");
    }
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role")) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add("animate", "active");
      this.setAttribute("open", "");
      if (typeof vhlCartDebugSnapshot === "function") {
        vhlCartDebugSnapshot("CartDrawer.open():afterClassApplied");
      }
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("is-empty")
          ? this.querySelector(".drawer__inner-empty")
          : document.getElementById("CartDrawer");
        const focusElement = this.querySelector(".drawer__inner") || this.querySelector(".drawer__close");
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true },
    );

    document.body.classList.add("overflow-hidden");

    // Check if jQuery and slick are loaded before initializing
    if (typeof $ !== "undefined" && typeof $.fn.slick !== "undefined") {
      const $slider = $(".gbfrequently-bought-with-main-whole-slider");
      if ($slider.length > 0) {
        $slider.slick({
          infinite: true,
          autoplaySpeed: 1000,
          autoplay: false,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true,
        });
        $slider.css("opacity", "1");
      }
    }

    // Start the countdown timer when drawer opens
    this.startCountdownTimer();

    this.dispatchEvent(new CustomEvent("cart-drawer:open", {
      bubbles: true,
      detail: { triggeredBy }
    }));
  }

  close(explicit = false) {
    if (typeof vhlCartDebugSnapshot === "function") {
      vhlCartDebugSnapshot("CartDrawer.close() called", { explicit });
    } else {
      console.log("[VHL CART DEBUG] CartDrawer.close() called", { explicit });
    }

    // Check if cart customization mode is active
    const cartCustomizationMode = document.querySelector("cart-drawer").classList.contains("customization-mode");
    if (cartCustomizationMode) {
      alert("Cart Customization Mode is active. Disable it in Theme Settings > Cart Drawer to allow closing.");
      return;
    }

    this.classList.remove("active");
    this.removeAttribute("open");
    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");

    // Clear the countdown timer when drawer closes
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (typeof vhlCartDebugSnapshot === "function") {
      vhlCartDebugSnapshot("CartDrawer.close():afterClassRemoved");
    }
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute("aria-expanded", !event.currentTarget.closest("details").hasAttribute("open"));
    });

    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector(".drawer__inner").classList.contains("is-empty") &&
      this.querySelector(".drawer__inner").classList.remove("is-empty");
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      if (section.id == "cart-drawer" || section.selector == "#CartDrawer") {
        const newCartDrawer = this.getSectionDOM(parsedState.sections[section.id], section.selector);
        updateCartDrawer(sectionElement, newCartDrawer);
      } else {
        if (section.id === "cart-icon-bubble") {
          const iconType = sectionElement.getAttribute("data-cart-icon-type");
          sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          if (iconType) {
            sectionElement.setAttribute("data-cart-icon-type", iconType);
          }
          const iconWrapper = sectionElement.querySelector(".svg-wrapper");
          if (iconWrapper && iconType) {
            const bagIcon = iconWrapper.querySelector(".cart-icon-bag");
            const cartIcon = iconWrapper.querySelector(".cart-icon-cart");
            const cartIconEmpty = iconWrapper.querySelector(".cart-icon-cart-empty");
            
            if (iconType === "bag") {
              if (bagIcon) bagIcon.style.display = "flex";
            } 
            else {
              const cartEmpty = parsedState.item_count === 0;
              if (cartEmpty && cartIconEmpty) {
                cartIconEmpty.style.display = "flex";
              } else if (cartIcon) {
                cartIcon.style.display = "flex";
              }
            }
          }
        } else {
          sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        }
      }
    });

    setTimeout(() => {
      this.dispatchEvent(new CustomEvent("cart-drawer:render", {
        bubbles: true,
        detail: { parsedState }
      }));
      
      this.open();
    });

    // Check if jQuery and slick are loaded before initializing
    if (typeof $ !== "undefined" && typeof $.fn.slick !== "undefined") {
      const $slider = $(".gbfrequently-bought-with-main-whole-slider");
      if ($slider.length > 0) {
        $slider.slick({
          infinite: true,
          autoplaySpeed: 1000,
          autoplay: false,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true,
        });
        $slider.css("opacity", "1");
      }
    }
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    setTimeout(function () {
      // Check if jQuery and slick are loaded before initializing
      if (typeof $ !== "undefined" && typeof $.fn.slick !== "undefined") {
        var $slider = $(".gbfrequently-bought-with-main-whole-slider");
        if ($slider.length > 0 && !$slider.hasClass("slick-initialized")) {
          $slider.slick({
            infinite: true,
            autoplaySpeed: 1000,
            autoplay: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            dots: true,
            // adaptiveHeight: true
            //prevArrow: $('.our-customer-slider-prev'),
            //nextArrow: $('.our-customer-slider-next'),
          });
          $slider.css("opacity", "1");
        }
      }
    }, 500);

    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
      },
    ];
  }

  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-drawer", CartDrawer);

function setupAjaxCartHandler() {
  const cartDrawer = document.querySelector("cart-drawer");
  if (!cartDrawer) return;

  document.addEventListener("cart:ajax-update", async function (event) {
    const sectionsData = event.detail?.sectionsData || null;
    await cartDrawer.refreshCartDrawer(sectionsData);
  });

  window.refreshCartDrawer = async function (sectionsData = null) {
    const drawer = document.querySelector("cart-drawer");
    if (drawer) {
      await drawer.refreshCartDrawer(sectionsData);
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", setupAjaxCartHandler);
} else {
  setupAjaxCartHandler();
}

// Wait for CartItems to be defined before extending it
if (typeof CartItems !== "undefined") {
  // CartItems is already loaded
  defineCartDrawerItems();
} else {
  // Wait for cart.js to load and define CartItems
  const checkCartItems = setInterval(() => {
    if (typeof CartItems !== "undefined") {
      clearInterval(checkCartItems);
      defineCartDrawerItems();
    }
  }, 50);
}

function defineCartDrawerItems() {
  if (customElements.get("cart-drawer-items")) {
    return; // Already defined
  }

  class CartDrawerItems extends CartItems {
    getSectionsToRender() {
      setTimeout(function () {
        // Check if jQuery and slick are loaded before initializing
        if (typeof $ !== "undefined" && typeof $.fn.slick !== "undefined") {
          const $slider = $(".gbfrequently-bought-with-main-whole-slider");
          if ($slider.length > 0) {
            $slider.slick({
              infinite: true,
              autoplaySpeed: 1000,
              autoplay: false,
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: false,
              dots: true,
            });
            $slider.css("opacity", "1");
          }
        }
      }, 500);

      return [
        {
          id: "CartDrawer",
          section: "cart-drawer",
          selector: ".drawer__inner",
        },
        {
          id: "cart-icon-bubble",
          section: "cart-icon-bubble",
          selector: ".shopify-section",
        },
      ];
    }
  }

  customElements.define("cart-drawer-items", CartDrawerItems);
}
