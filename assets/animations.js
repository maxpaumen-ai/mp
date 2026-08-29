const SCROLL_ANIMATION_TRIGGER_CLASSNAME = "scroll-trigger";
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = "scroll-trigger--offscreen";
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = "animate--zoom-in";
const SCROLL_ANIMATION_CANCEL_CLASSNAME = "scroll-trigger--cancel";

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute("data-cascade"))
          elementTarget.setAttribute("style", `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const animationTriggerElements = Array.from(rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME));
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add("scroll-trigger--design-mode");
    });
    return;
  }

  animationTriggerElements.forEach((element) => {
    // If element is taller than 50% of the viewport, use a tiny threshold
    // Otherwise, keep the original 0.4 threshold.
    const elementHeight = element.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight;
    const threshold = elementHeight > viewportHeight * 0.5 ? 0.01 : 0.4;

    const observer = new IntersectionObserver(onIntersection, {
      rootMargin: "0px 0px -100px 0px",
      threshold: threshold
    });
    
    observer.observe(element);
  });
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const animationTriggerElements = Array.from(document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME));

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    const observer = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
      });
    });
    observer.observe(element);

    element.style.setProperty("--zoom-in-ratio", 1 + scaleAmount * percentageSeen(element));

    window.addEventListener(
      "scroll",
      throttle(() => {
        if (!elementIsVisible) return;

        element.style.setProperty("--zoom-in-ratio", 1 + scaleAmount * percentageSeen(element));
      }),
      { passive: true },
    );
  });
}

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const elementPositionY = element.getBoundingClientRect().top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    return 100;
  }

  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

function initializeFadeUpSections() {
  const body = document.body;
  const revealOnScroll = body.getAttribute("data-animations-reveal-on-scroll");
  
  if (revealOnScroll !== "true") return;

  const allSections = document.querySelectorAll("section.section");
  const sectionsToAnimate = [];
  
  allSections.forEach((section) => {
    if (section.classList.contains("scroll-trigger")) {
      return;
    }
    
    if (
      section.closest(".shopify-section-group-header-group") ||
      section.closest(".shopify-section-group-footer-group")
    ) {
      return;
    }
    
    sectionsToAnimate.push(section);
  });

  function isAboveFold(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  sectionsToAnimate.forEach((section, index) => {
    section.classList.add("scroll-trigger", "animate--fade-in"); //hardcoded effect, can be changed here. Referenced in the base.css file
    section.setAttribute("data-cascade", "");
    section.style.setProperty("--animation-order", index);
    
    const rect = section.getBoundingClientRect();
    if (rect.top < 100) {
        section.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        return;
    }

    if (!isAboveFold(section)) {
      section.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
    }
  });

  if (sectionsToAnimate.length > 0) {
    initializeScrollAnimationTrigger();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
  initializeFadeUpSections();
});

if (Shopify.designMode) {
  document.addEventListener("shopify:section:load", (event) => {
    initializeScrollAnimationTrigger(event.target, true);
    initializeFadeUpSections();
  });
  document.addEventListener("shopify:section:reorder", () => {
    initializeScrollAnimationTrigger(document, true);
    initializeFadeUpSections();
  });
}
