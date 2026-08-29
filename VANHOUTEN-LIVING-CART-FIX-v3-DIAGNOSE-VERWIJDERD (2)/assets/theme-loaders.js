// Theme loaders – load jQuery and Swiper on demand (no global load).
// Must be included in <head> without defer so sections can call these before body finishes parsing.

(function () {
  "use strict";

  window.jqueryCheckAndLoad = function () {
    if (window.jqueryCustomLoad) return Promise.resolve(window.jQuery);
    if (typeof window.jQuery !== "undefined") {
      window.jqueryCustomLoad = true;
      return Promise.resolve(window.jQuery);
    }
    window.jqueryCustomLoad = true;
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "https://code.jquery.com/jquery-3.7.1.min.js";
      s.onload = function () {
        resolve(window.jQuery);
      };
      s.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(s);
    });
  };

  /**
   * Single place for dynamic pricing: apply quantity multiplication and optional subscription discount.
   * Subscription discounts are always applied per product (per unit); then result is multiplied by quantity.
   *
   * @param {object} opts
   * @param {string|number} [opts.variantId] - Variant ID (for API consistency; not used in calculation).
   * @param {number} opts.price - Base price in cents (e.g. variant.price, or per-unit when multiplyByQuantity is true).
   * @param {number} [opts.quantity=1] - Quantity (used when multiplyByQuantity is true; after subscription, total = perUnitSubscriptionPrice * quantity).
   * @param {boolean} [opts.multiplyByQuantity=true] - If true, base total = price * quantity before any subscription discount.
   * @param {boolean} [opts.applySubscriptionDiscount=true] - If true, apply discount from window.subscriptionContext when set (per product, then multiply by quantity).
   * @param {number} [opts.compareAtPrice] - Optional compare-at price in cents (multiply by quantity only; no subscription applied).
   * @returns {{ price: number, compareAtPrice: number }} Final price and compare-at in cents (use Elixir_FormatMoney for display).
   */
  window.Elixir_GetDisplayPrice = function (opts) {
    var price = Math.round(Number(opts.price) || 0);
    var quantity = Math.max(1, parseInt(opts.quantity, 10) || 1);
    var multiplyByQuantity = opts.multiplyByQuantity !== false;
    var applySubscriptionDiscount = opts.applySubscriptionDiscount !== false;
    var compareAtPrice = opts.compareAtPrice != null ? Math.round(Number(opts.compareAtPrice) || 0) : 0;

    var totalPrice = multiplyByQuantity ? price * quantity : price;
    var totalCompare = multiplyByQuantity ? compareAtPrice * quantity : compareAtPrice;

    if (applySubscriptionDiscount && window.subscriptionContext) {
      var ctx = window.subscriptionContext;
      var perUnitBase = Math.round(totalPrice / quantity);
      var discountType = ctx.discountType;
      var discountValue = parseFloat(ctx.discountValue) || 0;
      var finalPricePerUnit = ctx.finalPrice != null && ctx.finalPrice !== "" ? parseFloat(ctx.finalPrice) : null;

      var perUnitAfterDiscount;
      if (finalPricePerUnit !== null && !isNaN(finalPricePerUnit)) {
        perUnitAfterDiscount = Math.max(0, Math.round(finalPricePerUnit));
      } else if (discountType === "percentage") {
        perUnitAfterDiscount = Math.max(0, Math.round(perUnitBase * (1 - discountValue / 100)));
      } else if (discountType === "fixed_amount") {
        perUnitAfterDiscount = Math.max(0, Math.round(perUnitBase - discountValue));
      } else if (discountType === "price") {
        var perUnitCents = (finalPricePerUnit != null && !isNaN(finalPricePerUnit) ? finalPricePerUnit : discountValue);
        perUnitAfterDiscount = Math.max(0, Math.round(perUnitCents));
      } else {
        perUnitAfterDiscount = perUnitBase;
      }
      totalPrice = perUnitAfterDiscount * quantity;
    }

    return { price: totalPrice, compareAtPrice: totalCompare };
  };

  /**
   * Set or clear the global subscription context (window.subscriptionContext).
   * Use this from EVENT HANDLERS AFTER PAGE LOAD (e.g. when the user toggles Subscribe, changes plan, or changes variant).
   * Same shape: originalPrice, priceWithDiscount, discountType, discountValue, finalPrice, sellingPlanId.
   * - With (planId, variant, plan): computes context from variant price + plan.priceAdjustments[0], sets window.subscriptionContext, dispatches subscriptionContext:updated.
   * - With no arguments (or planId/variant missing): clears context and dispatches subscriptionContext:updated with detail: { subscriptionContext: null }.
   *
   * @param {string|number} [planId] - Selling plan ID.
   * @param {object} [variant] - Variant object with .price (or .currentPrice) in cents.
   * @param {object} [plan] - Plan with .priceAdjustments: [{ valueType, value }] (same shape as __subscriptionPlansData.plans[]).
   */
  window.Elixir_SetSubscriptionContext = function (planId, variant, plan) {
    if (planId == null || planId === "" || !variant) {
      if (window.subscriptionContext) {
        delete window.subscriptionContext;
      }
      document.dispatchEvent(new CustomEvent("subscriptionContext:updated", {
        detail: { subscriptionContext: null }
      }));
      return;
    }

    var originalPrice = 0;
    if (typeof variant.price === "number") {
      originalPrice = variant.price;
    } else if (typeof variant.price === "string") {
      originalPrice = parseInt(variant.price, 10) || 0;
    } else if (variant.currentPrice != null) {
      originalPrice = typeof variant.currentPrice === "number" ? variant.currentPrice : parseInt(variant.currentPrice, 10) || 0;
    }

    var finalPrice = originalPrice;
    var discountType = null;
    var discountValue = null;

    if (plan && plan.priceAdjustments && plan.priceAdjustments.length > 0) {
      var adjustment = plan.priceAdjustments[0];
      var adjustmentValue = parseFloat(adjustment.value);
      discountType = adjustment.valueType;
      discountValue = adjustmentValue;

      switch (adjustment.valueType) {
        case "percentage":
          finalPrice = originalPrice * (1 - adjustmentValue / 100);
          break;
        case "fixed_amount":
          finalPrice = originalPrice - adjustmentValue;
          break;
        case "price":
          finalPrice = adjustmentValue;
          break;
        default:
          finalPrice = originalPrice;
          break;
      }
    }

    window.subscriptionContext = {
      originalPrice: Math.round(originalPrice),
      priceWithDiscount: Math.max(0, Math.round(finalPrice)),
      discountType: discountType,
      discountValue: discountValue,
      finalPrice: Math.max(0, Math.round(finalPrice)),
      sellingPlanId: String(planId)
    };

    document.dispatchEvent(new CustomEvent("subscriptionContext:updated", {
      detail: { subscriptionContext: window.subscriptionContext }
    }));
  };

  /**
   * INITIAL PAGE LOAD ONLY: set window.subscriptionContext so Elixir_GetDisplayPrice works right away
   * (before any block like subscribe-and-save runs). Uses first plan + current variant from the form.
   * After load, plan changes are handled by Elixir_SetSubscriptionContext from subscribe-and-save.
   */
  function bootstrapSubscriptionContext() {
    var data = window.__subscriptionPlansData;
    if (!data || !data.plans || data.plans.length === 0) return;

    var activePlan = data.plans[0];
    var variants = window.__productVariants;
    if (!Array.isArray(variants) || variants.length === 0) return;

    var variantId = null;
    if (typeof window.Elixir_GetProductFormVariantId === "function") {
      variantId = window.Elixir_GetProductFormVariantId();
    }
    if (!variantId && typeof document !== "undefined") {
      var form = typeof window.Elixir_GetProductForm === "function" && window.Elixir_GetProductForm();
      if (form) {
        var idInput = form.querySelector('input[name="id"]');
        if (idInput && idInput.value) variantId = idInput.value;
      }
    }
    var variant = null;
    if (variantId != null && variantId !== "") {
      for (var j = 0; j < variants.length; j++) {
        if (String(variants[j].id) === String(variantId)) {
          variant = variants[j];
          break;
        }
      }
    }
    if (!variant) variant = variants[0];

    window.Elixir_SetSubscriptionContext(activePlan.id, variant, activePlan);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrapSubscriptionContext);
    } else {
      bootstrapSubscriptionContext();
    }
  }

  /**
   * Format price in cents to the store's money string. Use after Liquid when variant or other changes update prices in JS.
   * @param {number} cents - Price in cents (e.g. variant.price)
   * @param {string} [formatString] - Optional. Shopify format e.g. '${{amount}}'. Uses Shopify.money_format if omitted.
   * @returns {string} Formatted price string
   */
  window.Elixir_FormatMoney = function (cents, formatString) {
    var amount = Math.round(Number(cents) || 0);
    var format = formatString || (typeof Shopify !== "undefined" && (Shopify.money_format || Shopify.money_without_currency_format)) || "{{amount}}";
    if (typeof Shopify !== "undefined" && typeof Shopify.formatMoney === "function") {
      return Shopify.formatMoney(amount, format);
    }
    var normalized = (amount / 100).toFixed(2);
    if (typeof format === "string") return format.replace(/\{\{amount\}\}/g, normalized);
    return "$" + normalized;
  };

  window.swiperCheckAndLoad = function () {
    if (window.swiperCustomLoad && typeof window.Swiper !== "undefined") {
      return Promise.resolve();
    }
    if (window.swiperLoadPromise) return window.swiperLoadPromise;
    window.swiperCustomLoad = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
    document.head.appendChild(link);
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    window.swiperLoadPromise = new Promise(function (resolve) {
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        resolve();
      };
    });
    document.head.appendChild(script);
    return window.swiperLoadPromise;
  };
})();
