(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const tickerWrappers = document.querySelectorAll(".ticker-wrapper");
    tickerWrappers.forEach((wrapper) => {
      const track = wrapper.querySelector(".ticker__track");
      const firstContent = wrapper.querySelector(".ticker__content");
      if (!track || !firstContent) return;
      const contentWidth = firstContent.offsetWidth;
      const animationId = Math.random().toString(36).substr(2, 9);
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes ticker-scroll-${animationId} {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-${contentWidth}px, 0, 0); }
        }
      `;
      document.head.appendChild(styleSheet);
      const duration = getComputedStyle(wrapper).getPropertyValue("--scroll-speed");
      track.style.animation = `ticker-scroll-${animationId} ${duration} linear infinite`;
      track.style.animationPlayState = "running";
      track.setAttribute("data-animation-id", animationId);
      track.setAttribute("data-stylesheet", styleSheet);
      wrapper.addEventListener("mouseenter", () => {
        track.style.animationPlayState = "paused";
      });
      wrapper.addEventListener("mouseleave", () => {
        track.style.animationPlayState = "running";
      });
      wrapper.addEventListener(
        "touchstart",
        () => {
          track.style.animationPlayState = "paused";
        },
        { passive: !0 },
      );
      wrapper.addEventListener(
        "touchend",
        () => {
          track.style.animationPlayState = "running";
        },
        { passive: !0 },
      );
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          track.style.animationPlayState = "paused";
        } else {
          if (!wrapper.matches(":hover")) {
            track.style.animationPlayState = "running";
          }
        }
      });
      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const newContentWidth = firstContent.offsetWidth;
          const newAnimationId = Math.random().toString(36).substr(2, 9);
          const newStyleSheet = document.createElement("style");
          newStyleSheet.textContent = `
            @keyframes ticker-scroll-${newAnimationId} {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-${newContentWidth}px, 0, 0); }
            }
          `;
          document.head.appendChild(newStyleSheet);
          const newDuration = getComputedStyle(wrapper).getPropertyValue("--scroll-speed");
          track.style.animation = `ticker-scroll-${newAnimationId} ${newDuration} linear infinite`;
          track.style.animationPlayState = wrapper.matches(":hover") ? "paused" : "running";
          const oldStyleSheet = track.getAttribute("data-stylesheet");
          if (oldStyleSheet && oldStyleSheet.parentNode) {
            oldStyleSheet.parentNode.removeChild(oldStyleSheet);
          }
          track.setAttribute("data-animation-id", newAnimationId);
          track.setAttribute("data-stylesheet", newStyleSheet);
        }, 250);
      });
    });
  });
})();
