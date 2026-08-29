document.addEventListener("DOMContentLoaded", function () {
  const cartDrawer = document.querySelector("cart-drawer");
  if (cartDrawer && cartDrawer.classList.contains("customization-mode")) {
    if (typeof cartDrawer.open === "function") {
      cartDrawer.open();
    }
    if (typeof cartDrawer.close === "function") {
      const originalClose = cartDrawer.close;
      cartDrawer.close = function () {
        return !1;
      };
    }
    const overlay = cartDrawer.querySelector(".cart-drawer__overlay");
    if (overlay) {
      overlay.style.pointerEvents = "none";
    }
    const closeButtons = cartDrawer.querySelectorAll(".drawer__close");
    closeButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        alert("Cart Customization Mode is active. Disable it in Theme Settings > Cart Drawer to allow closing.");
      });
    });
    const observer = new MutationObserver(function (mutations) {
      if (cartDrawer.classList.contains("is-empty")) {
        setTimeout(() => {
          if (typeof cartDrawer.open === "function") {
            cartDrawer.open();
          }
        }, 100);
      }
    });
    observer.observe(cartDrawer, { attributes: !0, attributeFilter: ["class"] });
  }
});
