(function () {
  "use strict";

  function initCarousel(section) {
    var container = section.querySelector(".reviews-carousel-swiper");
    if (!container || container.swiper) return;

    var prevButton = section.querySelector(".global-nav-button.prev, .nav-button.prev");
    var nextButton = section.querySelector(".global-nav-button.next, .nav-button.next");

    var swiperLoad =
      typeof window.swiperCheckAndLoad === "function"
        ? window.swiperCheckAndLoad()
        : Promise.resolve();

    swiperLoad.then(function () {
      if (!container || container.swiper) return;
      if (typeof window.Swiper === "undefined") return;

      container.classList.remove("reviews-carousel-swiper--pending");

      var spaceBetween = 20;
      var slidesPerViewMobile = "auto";
      var centerDesktop = section.dataset.centerCardsDesktop === 'true';
      var centerMobile = section.dataset.centerCardsMobile === 'true';
      var slideCount = container.querySelectorAll('.swiper-slide').length;
      var isMobile = window.innerWidth < 768;
      var shouldCenter = isMobile ? centerMobile : centerDesktop;
      var initialSlide = shouldCenter ? Math.floor(slideCount / 2) : 0;

      var breakpoints = {};
      breakpoints[768] = { 
        spaceBetween: spaceBetween, 
        slidesPerView: "auto",
        centeredSlides: centerDesktop,
        centeredSlidesBounds: centerDesktop,
        centerInsufficientSlides: centerDesktop
      };

      var swiperConfig = {
      slidesPerView: slidesPerViewMobile,
      spaceBetween: spaceBetween,
      loop: false,
      speed: 400,
      centeredSlides: centerMobile,
      centeredSlidesBounds: centerMobile,
      centerInsufficientSlides: centerMobile,
      initialSlide: initialSlide,
        navigation: {
          prevEl: prevButton,
          nextEl: nextButton,
          hideOnClick: false,
          disabledClass: "nav-button-disabled"
        },
        breakpoints: breakpoints,
        observer: true,
        observeParents: true
      };

      var swiper = new window.Swiper(container, swiperConfig);

      swiper.on('breakpoint', function() {
        setTimeout(function() {
          var isDesktop = window.innerWidth >= 768;
          var shouldCenter = isDesktop ? centerDesktop : centerMobile;
          var targetSlide = shouldCenter ? Math.floor(slideCount / 2) : 0;
          swiper.slideTo(targetSlide, 0, false);
        }, 50);
      });
    });
  }

  function runInit() {
    var sections = document.querySelectorAll(".reviews-transformation-section");
    sections.forEach(function (section) {
      if (section.querySelector(".reviews-carousel-swiper")) {
        initCarousel(section);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInit);
  } else {
    runInit();
  }

  document.addEventListener("shopify:section:load", function (e) {
    var section = e.target.querySelector && e.target.querySelector(".reviews-transformation-section");
    if (section) {
      initCarousel(section);
    } else if (e.target.classList && e.target.classList.contains("reviews-transformation-section")) {
      initCarousel(e.target);
    }
  });
})();