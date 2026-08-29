class TestimonialCarousel {
  constructor(sectionId) {
    this.section = document.getElementById(`video-testimonials-${sectionId}`);
    if (!this.section) return;
    this.container = this.section.querySelector(".carousel-container");
    this.grid = this.section.querySelector(".videos-grid");
    this.navPrev = this.section.querySelector(".nav-button.prev");
    this.navNext = this.section.querySelector(".nav-button.next");
    this.cards = Array.from(this.grid.children);
    if (this.cards.length <= 1) {
      if (this.navPrev) this.navPrev.style.display = "none";
      if (this.navNext) this.navNext.style.display = "none";
      return;
    }
    this.isDesktop = window.innerWidth >= 768;
    this.cloneCount = this.isDesktop ? 4 : 2;
    this.realSlidesCount = this.cards.length;
    this.currentIndex = this.cloneCount;
    this.isTransitioning = !1;
    this.hasDragged = !1;
    this.init();
  }
  init() {
    this.isDesktop = window.innerWidth >= 768;
    if (this.isDesktop) {
      this.cloneCount = 4;
      this.currentIndex = this.cloneCount;
      this.cloneSlides();
      this.updateCardStyles();
      this.setInitialPosition();
      this.updateDesktopCenterClass();
    } else {
      this.cloneSlides();
      this.updateCardStyles();
      this.setInitialPosition();
    }
    this.addEventListeners();
    let lightResizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(lightResizeTimeout);
      lightResizeTimeout = setTimeout(() => {
        this.isDesktop = window.innerWidth >= 768;
        this.updateMobileCenterClass();
        this.updateDesktopCenterClass();
      }, 50);
    });
  }
  cloneSlides() {
    this.grid.innerHTML = "";
    this.cards.forEach((card) => this.grid.appendChild(card));
    for (let i = this.cloneCount - 1; i >= 0; i--) {
      const index = (this.realSlidesCount - this.cloneCount + i) % this.realSlidesCount;
      const clone = this.cards[index].cloneNode(!0);
      this.grid.insertBefore(clone, this.grid.firstChild);
    }
    for (let i = 0; i < this.cloneCount; i++) {
      const clone = this.cards[i].cloneNode(!0);
      this.grid.appendChild(clone);
    }
    this.allCards = Array.from(this.grid.children);
    this.allCards.forEach((card) => this.setupCardEvents(card));
  }
  setupCardEvents(card) {
    const video = card.querySelector(".testimonial-video");
    const wrapper = card.querySelector(".video-wrapper");
    const playOverlay = card.querySelector(".video-play-overlay");
    if (!wrapper) return;
    if (video) {
      video.controls = false;
      video.playsInline = true;
      video.muted = true;
      video.preload = "metadata";
      // Enhanced mobile video loading
      video.addEventListener("loadstart", () => {
        console.log("Video loading started");
      });
      video.addEventListener("loadedmetadata", () => {
        console.log("Video metadata loaded");
        if (video.duration && video.duration > 0) {
          video.currentTime = 0.1;
        }
      });
      video.addEventListener("canplay", () => {
        console.log("Video can start playing");
      });
      video.addEventListener("error", (e) => {
        console.error("Video loading error:", e);
      });
      // Force load video if not already loading
      if (video.readyState < 1) {
        video.load();
      }
      // Enhanced play/pause handling for mobile
      video.addEventListener("play", () => {
        wrapper.classList.add("is-playing"); // Force controls to be shown
        video.controls = true;
        video.setAttribute("controls", "controls");
        if (playOverlay) playOverlay.style.display = "none"; // Force controls to stay visible
        setTimeout(() => {
          video.controls = true;
          video.setAttribute("controls", "controls");
        }, 100);
      });
      video.addEventListener("pause", () => {
        wrapper.classList.remove("is-playing");
        video.controls = false;
        video.removeAttribute("controls");
        if (playOverlay) playOverlay.style.display = "flex";
      });
      video.addEventListener("ended", () => {
        wrapper.classList.remove("is-playing");
        video.controls = false;
        video.removeAttribute("controls");
        if (playOverlay) playOverlay.style.display = "flex";
        video.currentTime = 0;
      });
    }
    if (playOverlay) {
      const playButton = playOverlay.querySelector(".video-testimonial-play-btn");
      if (playButton && video) {
        playButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Toggle play/pause functionality
          if (video.paused || video.ended) {
            // Show controls immediately when play is clicked
            video.controls = true;
            video.setAttribute("controls", "controls");
            // Unmute the video when play button is clicked
            video.muted = false;
            wrapper.classList.add("is-playing");
            if (playOverlay) playOverlay.style.display = "none";
            // Play video
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video started playing successfully"); // Force controls again after play starts
                  video.controls = true;
                  video.setAttribute("controls", "controls"); // Double check controls are visible
                  setTimeout(() => {
                    video.controls = true;
                    video.setAttribute("controls", "controls");
                  }, 50);
                })
                .catch((error) => {
                  console.warn("Autoplay was prevented, but manual play should work:", error); // If play fails, revert the UI changes
                  video.controls = false;
                  video.removeAttribute("controls");
                  wrapper.classList.remove("is-playing");
                  if (playOverlay) playOverlay.style.display = "flex";
                });
            }
          } else {
            // Pause video
            video.pause();
            console.log("Video paused");
          }
        });
      }
    }
  }
  updateCardStyles() {
    if (!this.isDesktop) {
      this.allCards.forEach((card) => (card.style.width = "220px"));
    } else {
      this.allCards.forEach((card) => (card.style.width = ""));
    }
  }
  setInitialPosition() {
    this.isDesktop = window.innerWidth >= 768;
    const offset = this.calculateOffset();
    this.grid.style.transition = "none";
    this.grid.style.transform = `translateX(${offset}px)`;
    this.updateMobileCenterClass();
    this.updateDesktopCenterClass();
  }
  calculateOffset() {
    this.isDesktop = window.innerWidth >= 768;
    const cardElement = this.grid.querySelector(".video-card");
    if (!cardElement) return 0;
    const cardWidth = cardElement.offsetWidth;
    const containerWidth = this.container.offsetWidth;
    let offset;
    if (this.isDesktop) {
      const gap = 30;
      const visibleCards = 4;
      const totalVisibleWidth = cardWidth * visibleCards + gap * (visibleCards - 1);
      const leftoverSpace = containerWidth - totalVisibleWidth;
      const centeringOffset = leftoverSpace / 2;
      offset = centeringOffset - this.currentIndex * (cardWidth + gap);
    } else {
      const gap = 20;
      const containerCenter = containerWidth / 2;
      const cardCenter = cardWidth / 2;
      const cardPosition = this.currentIndex * (cardWidth + gap) + cardCenter;
      offset = containerCenter - cardPosition + 15;
    }
    return offset;
  }
  moveTo(index, withTransition = !0) {
    if (this.isTransitioning) return;
    this.isTransitioning = !0;
    this.currentIndex = index;
    const offset = this.calculateOffset();
    this.grid.style.transition = withTransition ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)" : "none";
    this.grid.style.transform = `translateX(${offset}px)`;
    this.updateMobileCenterClass();
    this.updateDesktopCenterClass();
  }
  updateMobileCenterClass() {
    if (window.innerWidth <= 767) {
      this.allCards.forEach((card, cardIndex) => {
        const realIndex = (cardIndex - this.cloneCount + this.realSlidesCount) % this.realSlidesCount;
        const currentRealIndex = (this.currentIndex - this.cloneCount + this.realSlidesCount) % this.realSlidesCount;
        if (realIndex === currentRealIndex) {
          card.classList.add("mobile-center");
        } else {
          card.classList.remove("mobile-center");
        }
      });
    } else {
      this.allCards.forEach((card) => {
        card.classList.remove("mobile-center");
      });
    }
  }
  updateDesktopCenterClass() {
    if (window.innerWidth >= 768) {
      this.allCards.forEach((card, cardIndex) => {
        const realIndex = (cardIndex - this.cloneCount + this.realSlidesCount) % this.realSlidesCount;
        const currentRealIndex = (this.currentIndex - this.cloneCount + this.realSlidesCount) % this.realSlidesCount;
        if (realIndex === currentRealIndex) {
          card.classList.add("desktop-center");
        } else {
          card.classList.remove("desktop-center");
        }
      });
    } else {
      this.allCards.forEach((card) => {
        card.classList.remove("desktop-center");
      });
    }
  }
  handleTransitionEnd() {
    this.isTransitioning = !1;
    if (this.currentIndex < this.cloneCount) {
      this.currentIndex += this.realSlidesCount;
      this.setInitialPosition();
    } else if (this.currentIndex >= this.realSlidesCount + this.cloneCount) {
      this.currentIndex -= this.realSlidesCount;
      this.setInitialPosition();
    }
  }
  navigateDesktop(direction) {
    if (!this.isDesktop) return;
    if (direction === "next") {
      this.currentIndex++;
    } else {
      this.currentIndex--;
    }
    this.moveTo(this.currentIndex, !0);
  }
  addEventListeners() {
    if (this.navPrev) {
      this.navPrev.addEventListener("click", () => {
        if (this.isDesktop) {
          this.navigateDesktop("prev");
        } else {
          this.moveTo(this.currentIndex - 1);
        }
      });
    }
    if (this.navNext) {
      this.navNext.addEventListener("click", () => {
        if (this.isDesktop) {
          this.navigateDesktop("next");
        } else {
          this.moveTo(this.currentIndex + 1);
        }
      });
    }
    this.grid.addEventListener("transitionend", () => this.handleTransitionEnd());
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoveX = 0;
    let touchMoveY = 0;
    let startOffset = 0;
    let isScrolling = null;
    const resetTouchVariables = () => {
      touchStartX = 0;
      touchStartY = 0;
      touchMoveX = 0;
      touchMoveY = 0;
      startOffset = 0;
      isScrolling = null;
      this.hasDragged = !1;
    };
    this.container.addEventListener(
      "touchstart",
      (e) => {
        if (this.isTransitioning) return;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        startOffset = this.calculateOffset();
        this.grid.style.transition = "none";
        this.hasDragged = !1;
        isScrolling = null;
      },
      { passive: !0 },
    );
    this.container.addEventListener(
      "touchmove",
      (e) => {
        if (!touchStartX || this.isTransitioning) return;
        const touch = e.touches[0];
        touchMoveX = touch.clientX;
        touchMoveY = touch.clientY;
        const diffX = touchMoveX - touchStartX;
        const diffY = touchMoveY - touchStartY;
        if (isScrolling === null) {
          isScrolling = Math.abs(diffY) > Math.abs(diffX);
        }
        if (isScrolling) return;
        e.preventDefault();
        if (Math.abs(diffX) > 5) {
          this.hasDragged = !0;
        }
        this.grid.style.transform = `translateX(${startOffset + diffX}px)`;
      },
      { passive: !1 },
    );
    this.container.addEventListener("touchend", (e) => {
      if (!touchStartX || this.isTransitioning) return;
      if (isScrolling) {
        resetTouchVariables();
        return;
      }
      if (!this.hasDragged) {
        this.grid.style.transition = "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        this.grid.style.transform = `translateX(${startOffset}px)`;
        resetTouchVariables();
        return;
      }
      const diffX = touchMoveX - touchStartX;
      const absDiffX = Math.abs(diffX);
      if (absDiffX > 30 || (absDiffX > 15 && this.hasDragged)) {
        if (this.isDesktop) {
          const direction = diffX > 0 ? "prev" : "next";
          this.navigateDesktop(direction);
        } else {
          this.moveTo(this.currentIndex - Math.sign(diffX));
        }
      } else {
        if (this.isDesktop) {
          this.updateDesktopView();
        } else {
          this.moveTo(this.currentIndex);
        }
      }
      resetTouchVariables();
    });
    this.container.addEventListener("touchcancel", () => {
      if (touchStartX && !this.isTransitioning) {
        this.grid.style.transition = "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        this.grid.style.transform = `translateX(${startOffset}px)`;
      }
      resetTouchVariables();
    });
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseMoveX = 0;
    let isMouseDragging = !1;
    let mouseIsScrolling = null;
    this.container.addEventListener("mousedown", (e) => {
      if (this.isTransitioning) return;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      startOffset = this.calculateOffset();
      this.grid.style.transition = "none";
      isMouseDragging = !1;
      mouseIsScrolling = null;
      e.preventDefault();
    });
    this.container.addEventListener("mousemove", (e) => {
      if (!mouseStartX || this.isTransitioning) return;
      mouseMoveX = e.clientX;
      const diffX = mouseMoveX - mouseStartX;
      const diffY = e.clientY - mouseStartY;
      if (mouseIsScrolling === null) {
        mouseIsScrolling = Math.abs(diffY) > Math.abs(diffX);
      }
      if (mouseIsScrolling) return;
      if (Math.abs(diffX) > 5) {
        isMouseDragging = !0;
        this.container.style.cursor = "grabbing";
      }
      this.grid.style.transform = `translateX(${startOffset + diffX}px)`;
    });
    this.container.addEventListener("mouseup", (e) => {
      if (!mouseStartX || this.isTransitioning) return;
      this.container.style.cursor = "";
      if (mouseIsScrolling) {
        mouseStartX = 0;
        return;
      }
      if (!isMouseDragging) {
        mouseStartX = 0;
        return;
      }
      const diffX = mouseMoveX - mouseStartX;
      const absDiffX = Math.abs(diffX);
      if (absDiffX > 30 || (absDiffX > 15 && isMouseDragging)) {
        if (this.isDesktop) {
          const direction = diffX > 0 ? "prev" : "next";
          this.navigateDesktop(direction);
        } else {
          this.moveTo(this.currentIndex - Math.sign(diffX));
        }
      } else {
        if (this.isDesktop) {
          this.updateDesktopView();
        } else {
          this.moveTo(this.currentIndex);
        }
      }
      mouseStartX = 0;
    });
    this.container.addEventListener("mouseleave", () => {
      if (mouseStartX) {
        this.container.style.cursor = "";
        this.grid.style.transition = "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        this.grid.style.transform = `translateX(${startOffset}px)`;
        mouseStartX = 0;
      }
    });
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const wasDesktop = this.isDesktop;
        this.isDesktop = window.innerWidth >= 768;
        if (wasDesktop !== this.isDesktop) {
          if (this.isDesktop) {
            this.cloneCount = 4;
            this.currentIndex = this.cloneCount;
            this.cloneSlides();
            this.updateCardStyles();
            this.setInitialPosition();
            this.updateDesktopCenterClass();
          } else {
            this.cloneCount = 2;
            this.cloneSlides();
            this.updateCardStyles();
            this.setInitialPosition();
          }
        }
      }, 150);
    });
  }
}
function initVideoTestimonials(sectionId) {
  new TestimonialCarousel(sectionId);
}
window.initVideoTestimonials = initVideoTestimonials;
