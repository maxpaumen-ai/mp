// Global flag to prevent multiple executions
if (!window.__premiumKitScriptLoaded) {
  window.__premiumKitScriptLoaded = true;

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (typeof Elixir_ProductFormExists !== "function" || !Elixir_ProductFormExists()) return;
      // Find all premium-attachment-kit instances on the page
      const kitWrappers = document.querySelectorAll(".premium-attachment-kit");

      if (!kitWrappers.length) {
        console.log("No premium-attachment-kit found, exiting");
        return;
      }

      // Process each kit wrapper independently
      kitWrappers.forEach((kitWrapper, wrapperIndex) => {
        // Check if this wrapper was already processed
        if (kitWrapper.hasAttribute("data-kit-processed")) {
          console.log("Wrapper already processed, skipping");
          return;
        }

        // Mark wrapper as processed immediately
        kitWrapper.setAttribute("data-kit-processed", "true");

        const productForm = typeof Elixir_GetProductForm === "function" ? Elixir_GetProductForm() : null;

        if (!productForm) {
          console.log("No product form found for this kit, skipping");
          return;
        }

        // Get kit items ONLY from this specific wrapper (not all kit items on the page)
        const kitItems = kitWrapper.querySelectorAll(".kit-item");

        if (!kitItems.length) {
          console.log("No kit items in this wrapper, skipping");
          return;
        }

        // Get the main product ID from the controller; skip if unavailable
        if (typeof Elixir_GetProductFormVariantId !== 'function') return;
        const mainProductId = Elixir_GetProductFormVariantId();
        if (!mainProductId) return;
        const relyOnProductId = kitWrapper.getAttribute("data-rely-on-product-id") || mainProductId;

        const container = document.createElement("div");
        container.classList.add("premium-kit--products");
        container.classList.add("premium-kit--products-" + wrapperIndex);
        let hasContent = false;

        // Start index after existing items to avoid conflicts with quantity breaks
        const existingItems = productForm.querySelectorAll('input[name*="items["][name*="][id]"]');
        let index = existingItems.length + 1;

        // Track unique product IDs to prevent duplicates
        const addedProductIds = new Set();

        kitItems.forEach((_item, itemIndex) => {
          const id = _item.getAttribute("data-product-id");
          const available = _item.getAttribute("data-available") !== "false";

          if (id && available && !addedProductIds.has(id)) {
            addedProductIds.add(id);

            // Variant ID
            const inputId = document.createElement("input");
            inputId.type = "hidden";
            inputId.name = `items[${index}][id]`;
            inputId.value = id;
            inputId.classList.add("product-variant-id");
            inputId.classList.add("premium-kit-free-gift-id");

            // Quantity
            const inputQuantity = document.createElement("input");
            inputQuantity.type = "hidden";
            inputQuantity.name = `items[${index}][quantity]`;
            inputQuantity.value = 1;
            inputQuantity.classList.add("product-variant-id");

            // Line item property: Mark as free gift
            const inputIsFreeGift = document.createElement("input");
            inputIsFreeGift.type = "hidden";
            inputIsFreeGift.name = `items[${index}][properties][_is_free_gift]`;
            inputIsFreeGift.value = "true";

            // Line item property: Link to main product
            const inputLinkedTo = document.createElement("input");
            inputLinkedTo.type = "hidden";
            inputLinkedTo.name = `items[${index}][properties][_linked_to_product]`;
            inputLinkedTo.value = relyOnProductId;

            container.appendChild(inputId);
            container.appendChild(inputQuantity);
            container.appendChild(inputIsFreeGift);
            container.appendChild(inputLinkedTo);

            hasContent = true;
            index++;
          }
        });

        if (hasContent) {
          productForm.appendChild(container);
        }
      });
    } catch (_err) {
      console.log("Error on premium kit script", _err);
    }
  });
}
