document.addEventListener("DOMContentLoaded", function () {
  initReviewsSlider();
  setupClaimButton();
});

function initReviewsSlider() {
  var swiperLoad =
    typeof window.swiperCheckAndLoad === "function"
      ? window.swiperCheckAndLoad()
      : Promise.resolve();

  swiperLoad.then(function () {
    if (typeof window.Swiper === "undefined") return;
    var containers = document.querySelectorAll(".reviewSwiper");
    containers.forEach(function (el) {
      if (el.swiper) return;
      el.classList.remove("reviewSwiper--pending");
      var speed = parseInt(el.dataset.speed || "5000", 10);
      new window.Swiper(el, {
        slidesPerView: "auto",
        spaceBetween: 15,
        centeredSlides: false,
        loop: true,
        speed: speed,
        autoplay: { delay: 1, disableOnInteraction: false },
        allowTouchMove: true,
        grabCursor: true,
        freeMode: { enabled: false },
      });
    });
  });
}

document.addEventListener("shopify:section:load", function (e) {
  var container = e.target.querySelector && e.target.querySelector(".reviewSwiper");
  if (container && !container.swiper && typeof window.Swiper !== "undefined") {
    container.classList.remove("reviewSwiper--pending");
    var speed = parseInt(container.dataset.speed || "5000", 10);
    new window.Swiper(container, {
      slidesPerView: "auto",
      spaceBetween: 15,
      centeredSlides: false,
      loop: true,
      speed: speed,
      autoplay: { delay: 1, disableOnInteraction: false },
      allowTouchMove: true,
      grabCursor: true,
      freeMode: { enabled: false },
    });
  }
});

function setupClaimButton() {
  var claimButton = document.querySelector(".claim-button");
  if (claimButton) {
  }
}

function scrollToTop(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
