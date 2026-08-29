(function () {
  const enableAutoplay = typeof window.enableAutoplay !== "undefined" ? window.enableAutoplay : !1;
  class ProductGallery {
    constructor(container) {
      this.container = container;
      this.mainImages = Array.from(container.querySelectorAll(".shop-main-image"));
      this.zoomWrappers = Array.from(container.querySelectorAll(".shop-image-zoom-wrapper"));
      this.thumbnails = Array.from(container.querySelectorAll(".shop-thumbnail"));
      this.dots = Array.from(container.querySelectorAll(".shop-dot"));
      this.desktopPrevArrow = container.querySelector(".shop-desktop-prev-arrow");
      this.desktopNextArrow = container.querySelector(".shop-desktop-next-arrow");
      this.mobilePrevArrows = Array.from(container.querySelectorAll(".shop-mobile-prev-arrow"));
      this.mobileNextArrows = Array.from(container.querySelectorAll(".shop-mobile-next-arrow"));
      this.indicatorsContainer = container.querySelector(".shop-indicators, #thumbnail-indicators");
      this.currentIndex = 0;
      this.maxIndex = this.mainImages.length - 1;
      this.init();
    }
    init() {
      this.mainImages.forEach((img, i) => {
        img.classList.toggle("active", i === 0);
      });
      this.zoomWrappers.forEach((wrapper, i) => {
        wrapper.classList.toggle("active", i === 0);
      });
      this.thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle("active", i === 0);
      });
      this.dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === 0);
      });
      this.createIndicators();
      this.attachEvents();
      this.setupThumbnailStripDrag();
      this.syncThumbColumnHeight();
      this.handleVideoAutoplay(0);
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.isSwiping = !1;
      this.isPinching = !1;
      this.swipeDetectionTimer = null;
      this.swipeThreshold = 30;
      this.swipeDetectionDelay = 50; // 50ms delay to detect if second finger arrives
      const imageContainer = this.container.querySelector(".shop-main-image-wrapper");
      if (imageContainer) {
        imageContainer.addEventListener(
          "touchstart",
          (e) => {
            // Clear any pending swipe detection
            if (this.swipeDetectionTimer) {
              clearTimeout(this.swipeDetectionTimer);
              this.swipeDetectionTimer = null;
            }

            // Immediate pinch detection (2+ fingers)
            if (e.touches.length >= 2) {
              this.isPinching = !0;
              this.isSwiping = !1;
              return;
            }

            // Single finger - wait a bit to see if second finger arrives
            this.touchStartX = e.changedTouches[0].screenX;
            this.isPinching = !1;

            // Delay swipe activation to detect potential pinch
            this.swipeDetectionTimer = setTimeout(() => {
              // If timer wasn't cancelled, it's a single-finger swipe
              this.isSwiping = !0;
              this.swipeDetectionTimer = null;
            }, this.swipeDetectionDelay);
          },
          { passive: !0 },
        );
        imageContainer.addEventListener(
          "touchmove",
          (e) => {
            // Ignore swipe if user is pinching
            if (this.isPinching || !this.isSwiping) return;
            const currentX = e.changedTouches[0].screenX;
            const deltaX = currentX - this.touchStartX;
            if (Math.abs(deltaX) > this.swipeThreshold / 2) {
              e.preventDefault();
            }
          },
          { passive: !1 },
        );
        imageContainer.addEventListener(
          "touchend",
          (e) => {
            // Clear any pending swipe detection timer
            if (this.swipeDetectionTimer) {
              clearTimeout(this.swipeDetectionTimer);
              this.swipeDetectionTimer = null;
            }

            // Don't trigger swipe if it was a pinch gesture
            if (!this.isPinching && this.isSwiping) {
              this.touchEndX = e.changedTouches[0].screenX;
              this.handleSwipeGesture();
            }
            this.isSwiping = !1;
            this.isPinching = !1;
          },
          { passive: !0 },
        );
      }
    }
    attachEvents() {
      this.thumbnails.forEach((thumb, i) => {
        thumb.addEventListener("click", (e) => {
          if (this._thumbStripDragEnded) {
            this._thumbStripDragEnded = false;
            e.preventDefault();
            return;
          }
          this.changeImage(i);
        });
      });
      this.dots.forEach((dot, i) => {
        dot.addEventListener("click", () => this.changeImage(i));
        dot.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.changeImage(i);
          }
        });
      });
      if (this.desktopPrevArrow) {
        this.desktopPrevArrow.addEventListener("click", () => {
          const newIndex = this.currentIndex === 0 ? this.maxIndex : this.currentIndex - 1;
          this.changeImage(newIndex);
        });
        this.desktopPrevArrow.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const newIndex = this.currentIndex === 0 ? this.maxIndex : this.currentIndex - 1;
            this.changeImage(newIndex);
          }
        });
      }
      if (this.desktopNextArrow) {
        this.desktopNextArrow.addEventListener("click", () => {
          const newIndex = this.currentIndex === this.maxIndex ? 0 : this.currentIndex + 1;
          this.changeImage(newIndex);
        });
        this.desktopNextArrow.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const newIndex = this.currentIndex === this.maxIndex ? 0 : this.currentIndex + 1;
            this.changeImage(newIndex);
          }
        });
      }
      this.mobilePrevArrows.forEach((arrow) => {
        if (arrow) {
          arrow.addEventListener("click", () => {
            const newIndex = this.currentIndex === 0 ? this.maxIndex : this.currentIndex - 1;
            this.changeImage(newIndex);
          });
          arrow.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const newIndex = this.currentIndex === 0 ? this.maxIndex : this.currentIndex - 1;
              this.changeImage(newIndex);
            }
          });
        }
      });
      this.mobileNextArrows.forEach((arrow) => {
        if (arrow) {
          arrow.addEventListener("click", () => {
            const newIndex = this.currentIndex === this.maxIndex ? 0 : this.currentIndex + 1;
            this.changeImage(newIndex);
          });
          arrow.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const newIndex = this.currentIndex === this.maxIndex ? 0 : this.currentIndex + 1;
              this.changeImage(newIndex);
            }
          });
        }
      });
      if (this.indicatorsContainer) {
        this.indicatorsContainer.addEventListener("click", (e) => {
          if (e.target.classList.contains("shop-indicator-dot")) {
            const idx = parseInt(e.target.getAttribute("data-index"));
            if (!isNaN(idx)) this.changeImage(idx);
          }
        });
      }
    }
    setupThumbnailStripDrag() {
      if (!window.matchMedia("(min-width: 800px)").matches) return;
      const self = this;
      self._activeThumbDrag = null;

      const duringDrag = (e) => {
        const a = self._activeThumbDrag;
        if (!a || a.pointerId !== e.pointerId) return;
        e.preventDefault();
        if (a.isVertical) {
          const dy = a.startY - e.clientY;
          if (!a.dragStarted && Math.abs(dy) > 5) {
            a.dragStarted = true;
          }
          if (a.dragStarted) {
            a.scrollEl.setAttribute("data-dragging", "1");
            const maxScroll = a.scrollEl.scrollHeight - a.scrollEl.clientHeight;
            const newTop = Math.max(0, Math.min(maxScroll, a.startScroll + dy));
            a.scrollEl.scrollTop = newTop;
            if (!a._loggedScroll) {
              a._loggedScroll = true;
            }
          }
        } else {
          const dx = a.startX - e.clientX;
          if (!a.dragStarted && Math.abs(dx) > 5) {
            a.dragStarted = true;
          }
          if (a.dragStarted) {
            a.scrollEl.setAttribute("data-dragging", "1");
            a.scrollEl.scrollLeft = a.startScroll + dx;
          }
        }
      };

      const stopDragging = (e) => {
        const a = self._activeThumbDrag;
        if (!a || (e && a.pointerId !== e.pointerId)) return;
        if (a.dragStarted) {
          self._thumbStripDragEnded = true;
        } else if (a.downTarget) {
          const i = self.thumbnails.indexOf(a.downTarget);
          if (i >= 0) self.changeImage(i);
        }
        a.scrollEl.removeAttribute("data-dragging");
        self._activeThumbDrag = null;
      };

      document.addEventListener("pointermove", duringDrag, { passive: false });
      document.addEventListener("pointerup", stopDragging, { passive: true });
      document.addEventListener("pointercancel", stopDragging, { passive: true });

      const strips = Array.from(this.container.querySelectorAll(".shop-thumbnails"));
      strips.forEach((thumbStrip) => {
        const wrapper = thumbStrip.closest(".shop-thumbnails-wrapper");
        const isVertical = wrapper && wrapper.classList.contains("left-column-layout");
        const scrollEl = thumbStrip;

        const startDragging = (e) => {
          if (e.button !== 0 && e.type === "mousedown") return;
          const startScroll = isVertical ? scrollEl.scrollTop : scrollEl.scrollLeft;
          self._activeThumbDrag = {
            scrollEl,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startScroll,
            isVertical,
            downTarget: e.target.closest(".shop-thumbnail"),
            dragStarted: false
          };
          scrollEl.setAttribute("data-dragging", "0");
          e.preventDefault();
        };

        if (!scrollEl) return;
        const preventNativeDrag = (e) => e.preventDefault();
        scrollEl.addEventListener("dragstart", preventNativeDrag, { capture: true });
        scrollEl.addEventListener("pointerdown", startDragging, { passive: false });
      });
    }
    syncThumbColumnHeight() {
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      const imageContainer = this.container.querySelector(".shop-image-container");
      const root = this.container.closest(".shop-carousel-container") || this.container;
      if (!imageContainer || !root) return;
      const setHeight = () => {
        const cw = imageContainer.offsetWidth;
        const ch = imageContainer.offsetHeight;
        const activeImg = imageContainer.querySelector(".shop-image-zoom-wrapper.active .shop-main-image, .shop-main-image.active");
        const img = activeImg && activeImg.tagName === "IMG" ? activeImg : imageContainer.querySelector("img.shop-main-image.active");
        let h = ch;
        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
          h = Math.round(img.naturalHeight * scale);
        }
        if (h > 0) root.style.setProperty("--thumb-column-height", h + "px");
      };
      setHeight();
      this._setThumbColumnHeight = setHeight;
      const ro = new ResizeObserver(() => setHeight());
      ro.observe(imageContainer);
      imageContainer.querySelectorAll("img.shop-main-image").forEach((img) => {
        if (img.complete) setHeight();
        else img.addEventListener("load", setHeight);
      });
    }
    createIndicators() {
      if (!this.indicatorsContainer) return;
      this.indicatorsContainer.innerHTML = "";
      this.mainImages.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "shop-indicator-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("data-index", i);
        this.indicatorsContainer.appendChild(dot);
      });
    }
    changeImage(index) {
      if (index < 0 || index > this.maxIndex) return;
      this.mainImages.forEach((img, i) => {
        img.classList.toggle("active", i === index);
      });
      this.zoomWrappers.forEach((wrapper, i) => {
        wrapper.classList.toggle("active", i === index);
      });
      this.thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle("active", i === index);
      });
      this.dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      if (this.indicatorsContainer) {
        Array.from(this.indicatorsContainer.children).forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
        });
      }
      this.currentIndex = index;
      this.scrollToThumbnail(index);
      this.handleVideoAutoplay(index);
      if (this._setThumbColumnHeight) requestAnimationFrame(() => this._setThumbColumnHeight());
    }
    scrollToThumbnail(index) {
      if (!this.thumbnails[index]) return;
      const thumbnail = this.thumbnails[index];
      const container = thumbnail.parentElement;
      if (!container) return;
      const containerWidth = container.offsetWidth;
      const thumbnailWidth = thumbnail.offsetWidth;
      const thumbnailLeft = thumbnail.offsetLeft;
      const scrollPosition = thumbnailLeft - containerWidth / 2 + thumbnailWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
    handleSwipeGesture() {
      const deltaX = this.touchEndX - this.touchStartX;
      if (Math.abs(deltaX) > this.swipeThreshold) {
        const numImages = this.mainImages.length;
        const currentImageIndex = this.currentIndex;
        const nextIndex = (currentImageIndex + 1) % numImages;
        const prevIndex = (currentImageIndex - 1 + numImages) % numImages;
        if (deltaX < 0) {
          this.changeImage(nextIndex);
        } else {
          this.changeImage(prevIndex);
        }
      }
      this.touchStartX = 0;
      this.touchEndX = 0;
    }
    handleVideoAutoplay(index) {
      // Pause all videos first
      this.mainImages.forEach((img, i) => {
        const video = img.querySelector("video");
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
        // Pause external videos (YouTube/Vimeo)
        const iframe = img.querySelector("iframe");
        if (iframe) {
          const src = iframe.src;
          if (src.includes("youtube.com")) {
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
          } else if (src.includes("vimeo.com")) {
            iframe.contentWindow.postMessage('{"method":"pause"}', "*");
          }
        }
      });
      
      // Play the active video if autoplay is enabled
      const activeMedia = this.mainImages[index];
      if (!activeMedia) return;
      
      if (enableAutoplay) {
        // Handle local videos
        const videoToPlay = activeMedia.querySelector("video");
        if (videoToPlay) {
          videoToPlay.play().catch(() => {});
        }
        
        // Handle external videos (YouTube/Vimeo)
        const iframeToPlay = activeMedia.querySelector("iframe");
        if (iframeToPlay) {
          const src = iframeToPlay.src;
          if (src.includes("youtube.com")) {
            iframeToPlay.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
          } else if (src.includes("vimeo.com")) {
            iframeToPlay.contentWindow.postMessage('{"method":"play"}', "*");
          }
        }
      }
    }
    updateWithVariant(variant) {
      let matchIndex = -1;
      if (variant && (variant.mediaId || variant.variantId || variant.imageUrl)) {
        this.mainImages.forEach((img, i) => {
          if (
            (variant.mediaId && img.dataset.mediaId == variant.mediaId) ||
            (variant.variantId && img.dataset.variantId == variant.variantId) ||
            (variant.imageUrl &&
              (img.src.includes(variant.imageUrl) || (img.dataset.src && img.dataset.src.includes(variant.imageUrl))))
          ) {
            matchIndex = i;
          }
        });
      }
      if (matchIndex >= 0) {
        this.changeImage(matchIndex);
      } else {
        this.changeImage(0);
      }
    }
  }
  const galleryRegistry = [];
  function initAll() {
    document.querySelectorAll(".product-gallery").forEach((container) => {
      if (!container.__galleryInstance) {
        const gallery = new ProductGallery(container);
        container.__galleryInstance = gallery;
        galleryRegistry.push(gallery);
      }
    });
  }
  document.addEventListener("variantImageSelected", function (e) {
    if (e.detail && (e.detail.variantId || e.detail.mediaId || e.detail.imageUrl)) {
      galleryRegistry.forEach((gallery) => gallery.updateWithVariant(e.detail));
    }
  });
  document.addEventListener("variant:imageChanged", function (e) {
    if (e.detail && (e.detail.variantId || e.detail.mediaId || e.detail.imageUrl)) {
      galleryRegistry.forEach((gallery) => gallery.updateWithVariant(e.detail));
    }
  });
  window.ProductGallery = { initAll, getAll: () => galleryRegistry };
  document.addEventListener("DOMContentLoaded", initAll);
})();
