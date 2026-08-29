/**
 * Product Upsell Handlers
 * Global functions for handling product upsell add to cart and variant selection
 */

// Handle variant selection change
window.handleProductUpsellVariantChange = function (selectElement, formId, skipImage) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error("Form not found:", formId);
    return;
  }

  const productJsonEl = document.getElementById("ProductJson-" + formId);
  if (!productJsonEl) {
    console.error("Product JSON not found for form:", formId);
    return;
  }

  try {
    const product = JSON.parse(productJsonEl.textContent);
    const selects = form.querySelectorAll('select[name^="options["]');
    const selectedOptions = Array.from(selects).map((s) => s.value);

    // Find matching variant
    const variant = product.variants.find((v) => selectedOptions.every((opt, i) => v.options[i] === opt));

    if (variant) {
      const hiddenInput = form.querySelector('input[name="id"]');
      if (hiddenInput) {
        hiddenInput.value = variant.id;
      }

      // Update all price displays (button, toggle, and standalone)
      if (variant.price != null) {
        const currency = document.querySelector('meta[name="currency"]')?.content || "USD";
        const formattedPrice = formatMoney(variant.price, currency);
        const container = form.closest('[class*="upsell-product-container-"]');
        if (container) {
          container.querySelectorAll('.upsell-price, [class*="upsell-toggle-price-"], [class*="upsell-product-price-"]').forEach(function (el) {
            el.textContent = formattedPrice;
          });
        }
      }
      

      // Update product image to match selected variant
      var img = skipImage ? null : form.querySelector("img");
      if (img) {
        var imgData = variant && variant.featured_image ? variant.featured_image : null;
        if (!imgData && product.featured_image) {
          // Fallback to product featured image
          var fi = product.featured_image;
          imgData = { src: typeof fi === "string" ? fi : fi.src, alt: "" };
        }
        if (imgData && imgData.src) {
          var newSrc = imgData.src.replace(/^\/\//, "https://").split("?")[0] + "?width=150";
          if (newSrc !== img.src) {
            var preload = new Image();
            preload.onload = function () {
              img.src = newSrc;
              if (imgData.alt) img.alt = imgData.alt;
            };
            preload.src = newSrc;
          }
        }
      }
    }

    // Disable unavailable variant option combinations
    selects.forEach(function (currentSelect, idx) {
      Array.from(currentSelect.options).forEach(function (opt) {
        var test = selectedOptions.slice();
        test[idx] = opt.value;
        opt.disabled = !product.variants.some(function (v) {
          return test.every(function (val, i) {
            return v.options[i] === val;
          });
        });
      });
    });
  } catch (error) {
    console.error("Error handling variant change:", error);
  }
};

// Handle add to cart
window.handleProductUpsellAdd = async function (buttonElement, formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error("Form not found:", formId);
    return;
  }

  const variantId = form.querySelector('input[name="id"]')?.value;
  if (!variantId) {
    console.error("No variant ID found");
    return;
  }

  const cartAction = form.dataset.cartAction || "drawer";

  // Disable button and show loading state
  const originalHTML = buttonElement.innerHTML;
  buttonElement.disabled = true;
  buttonElement.classList.add("is-loading");
  buttonElement.innerHTML = '<span class="button-spinner"></span>';

  try {
    if (cartAction === "redirect") {
      const response = await fetch(window.routes.cart_add_url + ".js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
        }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.status) throw new Error(data.description || "Failed to add to cart");
      window.location = window.routes?.cart_url || "/cart";
      return;
    }

    // Drawer: same request as shop-cart-button-handler (FormData + sections) so we get section HTML and open drawer
    const formData = new FormData(form);
    formData.append("sections", "cart-drawer,cart-icon-bubble");
    formData.append("sections_url", window.location.pathname);

    const response = await fetch(window.routes.cart_add_url, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Cart add returned non-JSON (likely HTML). Response ok:", response.ok, "Status:", response.status);
      throw new Error("Unable to add to cart. Please try again.");
    }
    if (data.status) {
      console.error("Error adding to cart:", data.description);
      throw new Error(data.description || "Error adding product to cart");
    }

    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer && typeof cartDrawer.renderContents === "function") {
      cartDrawer.renderContents(data);
    }

    if (typeof upsellCarousel === "function") {
      upsellCarousel();
    }

    // Show success state
    buttonElement.classList.remove("is-loading");
    buttonElement.classList.add("upsell-add-success");
    buttonElement.innerHTML = "✓ Toegevoegd";

    // Update cart count bubble
    fetch("/cart.js")
      .then((r) => r.json())
      .then((cart) => {
        document.querySelectorAll(".cart-count-bubble, [data-cart-count]").forEach((el) => {
          el.textContent = cart.item_count;
        });
      })
      .catch(() => {});

    // Reset button after 2 seconds
    setTimeout(() => {
      buttonElement.classList.remove("upsell-add-success");
      buttonElement.innerHTML = originalHTML;
      buttonElement.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("Error adding to cart:", error);

    // Show error state
    buttonElement.classList.remove("is-loading");
    buttonElement.classList.add("upsell-add-error");
    buttonElement.innerHTML = "✗ Error";

    // Reset button after 2 seconds
    setTimeout(() => {
      buttonElement.classList.remove("upsell-add-error");
      buttonElement.innerHTML = originalHTML;
      buttonElement.disabled = false;
    }, 2000);
  }
};

// Handle toggle switch add/remove from cart
window.handleProductUpsellToggle = async function (toggleElement, formId, uniqueId) {
  // Prevent double-calling
  if (toggleElement.dataset.processing === "true") {
    return;
  }
  toggleElement.dataset.processing = "true";

  const form = document.getElementById(formId);
  if (!form) {
    console.error("Form not found:", formId);
    toggleElement.checked = !toggleElement.checked; // Revert
    toggleElement.dataset.processing = "false";
    return;
  }

  const variantId = form.querySelector('input[name="id"]')?.value;
  if (!variantId) {
    console.error("No variant ID found");
    toggleElement.checked = !toggleElement.checked; // Revert
    toggleElement.dataset.processing = "false";
    return;
  }

  // Use uniqueId to find the toggle switch more reliably
  const toggleSwitch = document.querySelector(".upsell-toggle-switch-" + uniqueId) || toggleElement.parentElement;
  const isAdding = toggleElement.checked;

  const cartAddUrl = window.routes?.cart_add_url || "/cart/add";
  const cartChangeUrl = window.routes?.cart_change_url || "/cart/change";

  // Show loading state
  if (toggleSwitch) {
    toggleSwitch.classList.add("is-loading");
  }

  try {
    if (isAdding) {
      // Add to cart
      const response = await fetch(cartAddUrl + ".js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
    } else {
      // Remove from cart - first get cart to find the line item
      const cartResponse = await fetch("/cart.js");
      const cart = await cartResponse.json();

      // Find the item in cart
      const cartItem = cart.items.find((item) => item.variant_id == variantId);

      if (cartItem) {
        // Calculate new quantity (decrease by 1)
        const newQuantity = cartItem.quantity - 1;

        // Update cart
        const response = await fetch(cartChangeUrl + ".js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: variantId.toString(),
            quantity: newQuantity,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove from cart");
        }
      }
    }

    // Success - remove loading state
    if (toggleSwitch) {
      toggleSwitch.classList.remove("is-loading");
    }
    toggleElement.dataset.processing = "false";

    // Update cart count bubble
    fetch("/cart.js")
      .then((r) => r.json())
      .then((cart) => {
        document.querySelectorAll(".cart-count-bubble, [data-cart-count]").forEach((el) => {
          el.textContent = cart.item_count;
        });
      })
      .catch(() => {});

    if (typeof window.refreshCartDrawer === "function") {
      await window.refreshCartDrawer();
    }
  } catch (error) {
    console.error("Error updating cart:", error);

    // Revert toggle state on error
    toggleElement.checked = !toggleElement.checked;
    if (toggleSwitch) {
      toggleSwitch.classList.remove("is-loading");
    }
    toggleElement.dataset.processing = "false";
  }
};

// Event delegation for toggle switches - more reliable than inline handlers
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("change", function (e) {
    if (e.target.classList.contains("upsell-toggle-input")) {
      const formId = e.target.dataset.formId;
      const uniqueId = e.target.dataset.uniqueId;
      if (formId && uniqueId) {
        handleProductUpsellToggle(e.target, formId, uniqueId);
      }
    }
  });
});
// Helper function to format money
function formatMoney(cents, currency = "USD") {
  const amount = cents / 100;

  // Try to use Shopify's money format if available
  if (typeof Shopify !== "undefined" && Shopify.formatMoney) {
    return Shopify.formatMoney(cents, Shopify.money_format || "{{amount}}");
  }

  // Fallback formatting
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}