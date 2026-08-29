class VariantSelector {
  constructor(container) {
    this.container = container;
    this.productCards = container.querySelectorAll(".variant-product-card");
    this.selectedVariant = null;
    this.callbacks = { onVariantSelect: [] };
    this.init();
  }
  init() {
    this.productCards.forEach((card, index) => {
      card.addEventListener("click", () => {
        this.selectVariant(index);
      });
    });
    const selectedCard = this.container.querySelector(".variant-product-card.selected");
    if (!selectedCard && this.productCards.length > 0) {
      this.selectVariant(0);
    } else if (selectedCard) {
      const selectedIndex = Array.from(this.productCards).indexOf(selectedCard);
      this.selectedVariant = selectedIndex;
    }
  }
  selectVariant(index) {
    this.productCards.forEach((card) => {
      card.classList.remove("selected");
    });
    if (this.productCards[index]) {
      this.productCards[index].classList.add("selected");
      this.selectedVariant = index;
      const variantData = this.getVariantData(index);
      this.callbacks.onVariantSelect.forEach((callback) => {
        callback(variantData, index);
      });
      const event = new CustomEvent("variantSelected", {
        detail: { variant: variantData, index: index, element: this.productCards[index] },
      });
      this.container.dispatchEvent(event);
    }
  }
  getVariantData(index) {
    const card = this.productCards[index];
    if (!card) return null;
    return {
      title: card.querySelector(".variant-product-title")?.textContent?.trim() || "",
      description: card.querySelector(".variant-product-description")?.textContent?.trim() || "",
      originalPrice: card.querySelector(".variant-original-price")?.textContent?.trim() || "",
      currentPrice: card.querySelector(".variant-current-price")?.textContent?.trim() || "",
      hasBadge: !!card.querySelector(".variant-best-value-badge"),
      badgeText: card.querySelector(".variant-best-value-badge")?.textContent?.trim() || "",
      variantId: card.dataset.variantId || null,
      productId: card.dataset.productId || null,
      variantPrice: card.dataset.variantPrice || null,
      variantComparePrice: card.dataset.variantComparePrice || null,
      variantAvailable: card.dataset.variantAvailable === "true",
    };
  }
  getSelectedVariant() {
    if (this.selectedVariant !== null) {
      return this.getVariantData(this.selectedVariant);
    }
    return null;
  }
  onVariantSelect(callback) {
    this.callbacks.onVariantSelect.push(callback);
  }
  updateVariantColors(colors) {
    if (!colors) return;
    const root = this.container;
    Object.entries(colors).forEach(([property, value]) => {
      if (value) {
        root.style.setProperty(`--variant-${property.replace(/_/g, "-")}`, value);
      }
    });
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const variantContainers = document.querySelectorAll(".variant-selector-container");
  variantContainers.forEach((container) => {
    if (container.variantSelector) return;
    const variantSelector = new VariantSelector(container);
    container.variantSelector = variantSelector;
    variantSelector.onVariantSelect((variantData, index) => {
      console.log("Variant selected:", variantData);
      if (variantData.variantId) {
        const productForm = typeof Elixir_GetProductForm === 'function' ? Elixir_GetProductForm() : document.querySelector('form[action*="/cart/add"]');
        if (productForm) {
          const variantInput = productForm.querySelector('input[name="id"], select[name="id"]');
          if (variantInput) {
            if (variantInput.tagName === "SELECT") {
              variantInput.value = variantData.variantId;
            } else {
              variantInput.value = variantData.variantId;
            }
            variantInput.dispatchEvent(new Event("change", { bubbles: !0 }));
          }
        }
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location);
          url.searchParams.set("variant", variantData.variantId);
          window.history.replaceState({}, "", url);
        }
        const priceElements = document.querySelectorAll(".price, .product-price, [data-price]");
        priceElements.forEach((el) => {
          if (variantData.currentPrice) {
            el.textContent = variantData.currentPrice;
          }
        });
        window.dispatchEvent(new CustomEvent("variantChanged", { detail: variantData }));
      }
    });
  });
});
window.createVariantSelector = function (container, options = {}) {
  const variantSelector = new VariantSelector(container);
  if (options.colors) {
    variantSelector.updateVariantColors(options.colors);
  }
  if (options.onSelect) {
    variantSelector.onVariantSelect(options.onSelect);
  }
  return variantSelector;
};
