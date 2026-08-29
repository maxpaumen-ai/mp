/**
 * Product Benefits Video Optimization
 * Handles lazy loading, performance optimization, and error handling for benefit videos
 */

class ProductBenefitsVideoManager {
  constructor() {
    this.videos = [];
    this.observer = null;
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.findVideos();
    this.optimizePerformance();
  }

  setupIntersectionObserver() {
    // Only load videos when they're about to be visible
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadVideo(entry.target);
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before the video becomes visible
      },
    );
  }

  findVideos() {
    const videoContainers = document.querySelectorAll(".custom-benefit-video-container");

    videoContainers.forEach((container) => {
      const video = container.querySelector("video");
      if (video) {
        this.videos.push({ container, video });

        // Set initial loading state
        container.setAttribute("data-loading", "true");

        // Observe for intersection
        this.observer.observe(container);

        // Add error handling
        this.setupErrorHandling(container, video);
      }
    });
  }

  loadVideo(container) {
    const video = container.querySelector("video");
    if (!video) return;

    // Remove loading state
    container.removeAttribute("data-loading");
    container.classList.add("loaded");

    // Handle Shopify-hosted HTML5 video
    this.loadShopifyVideo(video, container);

    // Stop observing this video
    this.observer.unobserve(container);
  }

  loadShopifyVideo(video, container) {
    // Optimize for Shopify-hosted videos
    video.preload = "metadata";

    // Handle load events
    video.addEventListener("loadeddata", () => {
      container.removeAttribute("data-loading");
    });

    video.addEventListener("canplaythrough", () => {
      container.classList.add("loaded");
      // For autoplay videos, ensure they start playing when ready
      if (video.hasAttribute("autoplay") && video.muted) {
        video.play().catch(() => {
          // Autoplay failed, that's okay
        });
      }
    });

    // Handle video quality optimization for Shopify CDN
    if (video.querySelector("source")) {
      const sources = video.querySelectorAll("source");
      // Shopify automatically provides multiple quality sources
      // We can trust Shopify's adaptive streaming
      sources.forEach((source) => {
        source.addEventListener("error", () => {
          console.warn("Video source failed to load:", source.src);
        });
      });
    }

    // Force load if src is already set
    if (video.src || video.querySelector("source")) {
      video.load();
    }
  }

  setupErrorHandling(container, video) {
    const handleError = () => {
      container.setAttribute("data-error", "true");
      container.removeAttribute("data-loading");
      console.warn("Video failed to load:", video.src || video.getAttribute("src"));
    };

    if (video.tagName === "VIDEO") {
      video.addEventListener("error", handleError);
    } else if (video.tagName === "IFRAME") {
      // For iframes, we'll use a timeout as fallback
      setTimeout(() => {
        if (container.getAttribute("data-loading") === "true") {
          handleError();
        }
      }, 10000); // 10 second timeout
    }
  }

  optimizePerformance() {
    // Reduce video quality on slower connections
    if (navigator.connection && navigator.connection.effectiveType) {
      const connectionType = navigator.connection.effectiveType;

      if (connectionType === "slow-2g" || connectionType === "2g") {
        this.videos.forEach(({ video, container }) => {
          if (video.tagName === "VIDEO") {
            // Disable autoplay on slow connections
            video.removeAttribute("autoplay");
            video.preload = "none";
            container.setAttribute("data-priority", "low");
          }
        });
      }
    }

    // Pause videos when not visible to save bandwidth
    const pauseObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target.querySelector("video");
          if (video && video.autoplay) {
            if (entry.isIntersecting) {
              video.play().catch(() => {
                // Autoplay failed, that's okay
              });
            } else {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.5, // Video must be 50% visible to play
      },
    );

    this.videos.forEach(({ container }) => {
      pauseObserver.observe(container);
    });
  }

  // Public method to reload failed videos
  retryFailedVideos() {
    const failedContainers = document.querySelectorAll('[data-error="true"]');
    failedContainers.forEach((container) => {
      container.removeAttribute("data-error");
      container.setAttribute("data-loading", "true");
      this.loadVideo(container);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if there are benefit video containers
  if (document.querySelector(".custom-benefit-video-container")) {
    window.productBenefitsVideoManager = new ProductBenefitsVideoManager();
  }
});

// Global retry function for failed videos
window.retryBenefitVideos = () => {
  if (window.productBenefitsVideoManager) {
    window.productBenefitsVideoManager.retryFailedVideos();
  }
};
