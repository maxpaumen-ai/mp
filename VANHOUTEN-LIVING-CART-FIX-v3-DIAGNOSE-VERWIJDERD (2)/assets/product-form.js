customElements.get("product-form") ||
  customElements.define(
    "product-form",
    class extends HTMLElement {
      constructor() {
        (super(), (this.originalButtonText = ""), (this.persistentTextActive = !1));
      }
      isSoldOut() {
        return this.submitButton && this.submitButton.classList.contains("sold-out");
      }
      connectedCallback() {
        setTimeout(() => {
          if (((this.form = this.querySelector("form")), !this.form)) return;
          const t = this.variantIdInput;
          if (
            (t && (t.disabled = !1),
            this.form.addEventListener("submit", this.onSubmitHandler.bind(this)),
            (this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer")),
            (this.submitButton = this.querySelector('[type="submit"]')),
            this.submitButton)
          ) {
            if (
              ((this.submitButtonText = this.submitButton.querySelector(".button-text")),
              this.submitButtonText &&
                ((this.originalButtonText = this.submitButtonText.textContent),
                (this.submitButton.dataset.originalText = this.originalButtonText)),
              "true" === this.submitButton.dataset.textOverride && this.submitButtonText)
            ) {
              // Use persistent text when text override is active (never overwrite "Sold Out")
              this.persistentTextActive = !0;
              if (!this.isSoldOut()) {
                const showPrice = "true" === this.submitButton.dataset.showPrice;
                const t = this.submitButton.dataset.persistentText;
                if (t) {
                  if (!showPrice || !this.submitButtonText.textContent.trim().startsWith(t.trim())) {
                    this.submitButtonText.textContent = t;
                  }
                  localStorage.setItem("addToCartButtonText", t);
                } else {
                  const t = localStorage.getItem("addToCartButtonText");
                  if (t) {
                    if (!showPrice || !this.submitButtonText.textContent.trim().startsWith(t.trim())) {
                      this.submitButtonText.textContent = t;
                    }
                    this.submitButton.dataset.persistentText = t;
                  }
                }
              }
            }
            else if (this.submitButton.classList.contains("has-persistent-text") && this.submitButtonText) {
              this.persistentTextActive = !0;
              if (!this.isSoldOut()) {
                const showPrice = "true" === this.submitButton.dataset.showPrice;
                const t = this.submitButton.dataset.persistentText;
                if (t) {
                  if (!showPrice || !this.submitButtonText.textContent.trim().startsWith(t.trim())) {
                    this.submitButtonText.textContent = t;
                  }
                  localStorage.setItem("addToCartButtonText", t);
                } else {
                  const t = localStorage.getItem("addToCartButtonText");
                  if (t) {
                    if (!showPrice || !this.submitButtonText.textContent.trim().startsWith(t.trim())) {
                      this.submitButtonText.textContent = t;
                    }
                    this.submitButton.dataset.persistentText = t;
                  }
                }
              }
            }
            ((this.persistentTextActive || "true" === this.submitButton.dataset.textOverride) &&
              this.submitButtonText &&
              this.setupButtonTextObserver(),
              document.querySelector("cart-drawer") && this.submitButton.setAttribute("aria-haspopup", "dialog"),
              (this.hideErrors = "true" === this.dataset.hideErrors),
              document.addEventListener("variant:change", this.handleVariantChange.bind(this)));
          }
        }, 100);
      }
      setupButtonTextObserver() {
        if (!this.submitButtonText) return;
        const t = { characterData: !0, childList: !0, subtree: !0 };
        if (this.persistentTextActive) {
          const e = this.submitButton.dataset.persistentText || localStorage.getItem("addToCartButtonText");
          if (!e) return;
          const showPrice = "true" === this.submitButton.dataset.showPrice;
          ((this.buttonTextObserver = new MutationObserver((t) => {
            if (this.isSoldOut()) return;
            const currentText = this.submitButtonText.textContent.trim();
            const persistentText = e.trim();
            if (showPrice) {
              if (!currentText.startsWith(persistentText)) {
                this.submitButtonText.textContent = e;
              }
            } else {
              if (currentText !== persistentText) {
                this.submitButtonText.textContent = e;
              }
            }
          })),
            this.buttonTextObserver.observe(this.submitButtonText, t));
        }
      }
      handleVariantChange(t) {
        this.submitButtonText &&
          setTimeout(() => {
            if (this.isSoldOut()) return;
            if (this.persistentTextActive) {
              const showPrice = "true" === this.submitButton.dataset.showPrice;
              if (!showPrice) {
                const t = this.submitButton.dataset.persistentText || localStorage.getItem("addToCartButtonText");
                t && (this.submitButtonText.textContent = t);
              }
            }
          }, 50);
      }
      ensureSellingPlanValue() {
        let planIdToUse = null;
        try {
          const sellingPlanInput = this.form.querySelector('input[name="selling_plan"]');
          if (sellingPlanInput) {
            if (sellingPlanInput.value) {
              planIdToUse = sellingPlanInput.value;
            } else {
              const subscribeToggle = document.querySelector('.subscribe-save-wrapper input[type="checkbox"]:checked, .subscribe-save-wrapper-dynamic input[type="checkbox"]:checked');
              if (subscribeToggle) {
                const wrapper = subscribeToggle.closest('.subscribe-save-wrapper, .subscribe-save-wrapper-dynamic');
                if (wrapper) {
                  planIdToUse = wrapper.dataset.sellingPlanId || subscribeToggle.dataset.planId;
                }
                
                if (planIdToUse) {
                  sellingPlanInput.value = planIdToUse;
                  sellingPlanInput.setAttribute('value', planIdToUse);
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ product-form.js: Error setting selling_plan:', error);
        }
        return planIdToUse;
      }
      onSubmitHandler(t) {
        if ((t.preventDefault(), "true" === this.submitButton.getAttribute("aria-disabled"))) return;
        (this.handleErrorMessage(),
          this.submitButton.setAttribute("aria-disabled", !0),
          this.submitButton.classList.add("loading"),
          this.querySelector(".loading__spinner").classList.remove("hidden"));

        const e = fetchConfig("javascript");
        ((e.headers["X-Requested-With"] = "XMLHttpRequest"), delete e.headers["Content-Type"]);
      
        const planIdToUse = this.ensureSellingPlanValue();
        
        const s = new FormData(this.form);
        

        // Check if premium-attachment-kit has already added items[] inputs to the form
        const hasItemsInputs = this.form.querySelector('input[name^="items["]') !== null;

        if (hasItemsInputs) {
          // Premium-attachment-kit has added items[] inputs - use FormData directly

          (this.cart &&
            (s.append(
              "sections",
              this.cart.getSectionsToRender().map((t) => t.id),
            ),
            s.append("sections_url", window.location.pathname),
            this.cart.setActiveElement(document.activeElement)),
            (e.body = s),
            fetch(`${routes.cart_add_url}`, e)
              .then((t) => t.json())
              .then(this.handleCartResponse.bind(this, s, t))
              .catch((t) => {
                console.error(t);
              })
              .finally(this.handleSubmitFinally.bind(this, t)));
        } else {
          // Original behavior: single product with FormData
          (this.cart &&
            (s.append(
              "sections",
              this.cart.getSectionsToRender().map((t) => t.id),
            ),
            s.append("sections_url", window.location.pathname),
            this.cart.setActiveElement(document.activeElement)),
            (e.body = s),
            fetch(`${routes.cart_add_url}`, e)
              .then((t) => t.json())
              .then(this.handleCartResponse.bind(this, s, t))
              .catch((t) => {
                console.error(t);
              })
              .finally(this.handleSubmitFinally.bind(this, t)));
        }
      }
      handleCartResponse(formData, event, responseData) {
        if (responseData.status) {
          (publish(PUB_SUB_EVENTS.cartError, {
            source: "product-form",
            productVariantId: formData.get("id"),
            errors: responseData.errors || responseData.description,
            message: responseData.message,
          }),
            this.handleErrorMessage(responseData.description));
          const e = this.submitButton.querySelector(".sold-out-message");
          if (!e) return;
          return (
            this.submitButton.setAttribute("aria-disabled", !0),
            this.submitButtonText.classList.add("hidden"),
            e.classList.remove("hidden"),
            void (this.error = !0)
          );
        }
        if (!this.cart) return void (window.location = window.routes.cart_url);
        const e = CartPerformance.createStartingMarker("add:wait-for-subscribers");
        (this.error ||
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: "product-form",
            productVariantId: formData.get("id"),
            cartData: responseData,
          }).then(() => {
            CartPerformance.measureFromMarker("add:wait-for-subscribers", e);
          }),
          (this.error = !1));
        const i = this.closest("quick-add-modal");
        i
          ? (document.body.addEventListener(
              "modalClosed",
              () => {
                setTimeout(() => {
                  CartPerformance.measure("add:paint-updated-sections", () => {
                    this.cart.renderContents(responseData);
                  });
                });
              },
              { once: !0 },
            ),
            i.hide(!0))
          : CartPerformance.measure("add:paint-updated-sections", () => {
              this.cart.renderContents(responseData);
            });
      }
      handleSubmitFinally(event) {
        if (
          (this.submitButton.classList.remove("loading"),
          this.cart && this.cart.classList.contains("is-empty") && this.cart.classList.remove("is-empty"),
          this.error || this.submitButton.removeAttribute("aria-disabled"),
          this.querySelector(".loading__spinner").classList.add("hidden"),
          this.error || "true" !== this.submitButton.dataset.textOverride)
        ) {
          if (!this.error && this.persistentTextActive && !this.isSoldOut()) {
            const showPrice = "true" === this.submitButton.dataset.showPrice;
            const t = this.submitButton.dataset.persistentText || localStorage.getItem("addToCartButtonText");
            if (t && this.submitButtonText) {
              if (!showPrice || !this.submitButtonText.textContent.trim().startsWith(t.trim())) {
                this.submitButtonText.textContent = t;
              }
            }
          }
        } else;
        CartPerformance.measureFromEvent("add:user-action", event);
      }
      handleErrorMessage(t = !1) {
        this.hideErrors ||
          ((this.errorMessageWrapper =
            this.errorMessageWrapper || this.querySelector(".product-form__error-message-wrapper")),
          this.errorMessageWrapper &&
            ((this.errorMessage =
              this.errorMessage || this.errorMessageWrapper.querySelector(".product-form__error-message")),
            this.errorMessageWrapper.toggleAttribute("hidden", !t),
            t && (this.errorMessage.textContent = t)));
      }
      toggleSubmitButton(t = !0, e) {
        if (t) (this.submitButton.setAttribute("disabled", "disabled"), e && (this.submitButtonText.textContent = e));
        else {
          if ((this.submitButton.removeAttribute("disabled"), "true" === this.submitButton.dataset.textOverride));
          else if (this.persistentTextActive) {
            const t = this.submitButton.dataset.persistentText || localStorage.getItem("addToCartButtonText");
            if (t) return void (this.submitButtonText.textContent = t);
          }
          this.originalButtonText
            ? (this.submitButtonText.textContent = this.originalButtonText)
            : this.submitButton.dataset.originalText
              ? (this.submitButtonText.textContent = this.submitButton.dataset.originalText)
              : (this.submitButtonText.textContent = window.variantStrings.addToCart);
        }
      }
      disconnectedCallback() {
        (this.buttonTextObserver && this.buttonTextObserver.disconnect(),
          document.removeEventListener("variant:change", this.handleVariantChange));
      }
      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }
    },
  );
