class ScrollingFeaturesBar {
  constructor(options = {}) {
    this.options = options;
    this.init();
  }
  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
    window.addEventListener("resize", () => this.adjustFeaturesTrack());
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.setup();
      });
    }
  }
  setup() {
    const allSections = document.querySelectorAll('[class*="section-"]');
    allSections.forEach((section) => {
      if (section.querySelector(".features-track")) {
        this.initSection(section);
      }
    });
  }
  initSection(section) {
    const trackContainer = section.querySelector(".features-track-container");
    const track = section.querySelector(".features-track");
    const featureItems = track.querySelector(".feature-items");
    if (!trackContainer || !track || !featureItems) return;
    this.configureScrollingAnimation(section, track, featureItems);
    this.adjustFeaturesTrack(section, trackContainer, track, featureItems);
  }
  configureScrollingAnimation(section, track, featureItems) {
    const sectionIdMatch = section.className.match(/section-([a-z0-9-]+)/i);
    if (!sectionIdMatch) return;
    const sectionId = sectionIdMatch[1];
    const contentWidth = featureItems.scrollWidth;
    const viewportWidth = window.innerWidth;
    const pauseOnHover = section.classList.contains("pause-on-hover");
    if (pauseOnHover) {
      track.addEventListener("mouseenter", () => {
        track.style.animationPlayState = "paused";
      });
      track.addEventListener("mouseleave", () => {
        track.style.animationPlayState = "running";
      });
    }
  }
  adjustFeaturesTrack(section, trackContainer, track, featureItems) {
    if (!section) {
      const allSections = document.querySelectorAll('[class*="section-"]');
      allSections.forEach((section) => {
        if (section.querySelector(".features-track")) {
          const trackContainer = section.querySelector(".features-track-container");
          const track = section.querySelector(".features-track");
          const featureItems = track.querySelector(".feature-items");
          if (trackContainer && track && featureItems) {
            this.adjustFeaturesTrack(section, trackContainer, track, featureItems);
          }
        }
      });
      return;
    }
    if (!trackContainer || !track || !featureItems) return;
    const featureItemsWidth = featureItems.offsetWidth;
    const totalWidth = featureItemsWidth * 6;
    if (totalWidth > 0) {
      track.style.width = `${totalWidth}px`;
    }
    trackContainer.style.height = `${featureItems.offsetHeight}px`;
  }
}
document.addEventListener("DOMContentLoaded", function () {
  new ScrollingFeaturesBar();
});
