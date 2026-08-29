class TestimonialsCarousel {
  constructor(sectionId) {
    this.sectionId = sectionId;
    this.carousel = document.getElementById(`testimonials-${sectionId}`);
    if (!this.carousel) return;
    this.track = this.carousel.querySelector(".testimonials-track");
    this.originalCards = this.carousel.querySelectorAll(".testimonial-card");
    this.prevButton = this.carousel.querySelector(".nav-button.prev");
    this.nextButton = this.carousel.querySelector(".nav-button.next");
    this.dots = this.carousel.querySelectorAll(".dot");
    this.isMobile = window.innerWidth < 750;
    this.isAnimating = !1;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.isSwiping = !1;
    this.init();
  }
  init() {
    this.setupCards();
    this.bindEvents();
    setTimeout(() => this.updateCarousel(!1), 100);
  }
  setupCards() {
    if (this.isMobile) {
      if (this.originalCards.length > 1) {
        const lastCardClone = this.originalCards[this.originalCards.length - 1].cloneNode(!0);
        const firstCardClone = this.originalCards[0].cloneNode(!0);
        lastCardClone.classList.add("testimonial-clone", "mobile-clone-before");
        firstCardClone.classList.add("testimonial-clone", "mobile-clone-after");
        this.track.insertBefore(lastCardClone, this.track.firstChild);
        this.track.appendChild(firstCardClone);
        this.cards = this.track.querySelectorAll(".testimonial-card");
        this.currentSlide = 1;
        this.totalSlides = this.originalCards.length;
      } else {
        this.cards = this.originalCards;
        this.currentSlide = 0;
        this.totalSlides = this.originalCards.length;
      }
    } else {
      if (this.originalCards.length > 1) {
        const clonesBefore = Array.from(this.originalCards).map((card) => {
          const clone = card.cloneNode(!0);
          clone.classList.add("testimonial-clone", "clone-before");
          return clone;
        });
        const clonesAfter = Array.from(this.originalCards).map((card) => {
          const clone = card.cloneNode(!0);
          clone.classList.add("testimonial-clone", "clone-after");
          return clone;
        });
        clonesBefore.forEach((clone) => this.track.insertBefore(clone, this.track.firstChild));
        clonesAfter.forEach((clone) => this.track.appendChild(clone));
        this.cards = this.track.querySelectorAll(".testimonial-card");
        this.currentSlide = this.originalCards.length;
        this.totalSlides = this.originalCards.length;
      } else {
        this.cards = this.originalCards;
        this.currentSlide = 0;
        this.totalSlides = this.originalCards.length;
      }
    }
  }
  updateCarousel(animate = !0) {
    if (!this.cards[this.currentSlide]) return;
    if (this.isMobile) {
      const targetCard = this.cards[this.currentSlide];
      if (!targetCard) return;
      const containerRect = this.carousel.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const cardCenter = cardRect.left + cardRect.width / 2;
      const currentTransform = getComputedStyle(this.track).transform;
      let currentOffset = 0;
      if (currentTransform && currentTransform !== "none") {
        const matrix = new DOMMatrix(currentTransform);
        currentOffset = matrix.m41;
      }
      const centeringError = cardCenter - containerCenter;
      const newOffset = currentOffset - centeringError;
      if (animate) {
        this.track.style.transition = "transform 0.3s ease";
      } else {
        this.track.style.transition = "none";
      }
      this.track.style.transform = `translateX(${newOffset}px)`;
      if (this.originalCards.length > 1) {
        if (this.currentSlide === 0) {
          setTimeout(
            () => {
              this.currentSlide = this.totalSlides;
              this.updateCarousel(!1);
            },
            animate ? 300 : 0,
          );
        } else if (this.currentSlide === this.totalSlides + 1) {
          setTimeout(
            () => {
              this.currentSlide = 1;
              this.updateCarousel(!1);
            },
            animate ? 300 : 0,
          );
        }
      }
    } else {
      const cardWidth = this.cards[0].offsetWidth;
      const gap = parseInt(getComputedStyle(this.track).gap) || 0;
      const containerWidth = this.carousel.offsetWidth;
      const cardPosition = (cardWidth + gap) * this.currentSlide;
      const centerOffset = containerWidth / 2 - cardWidth / 2;
      const twoCardsOffset = (cardWidth + gap) * 2;
      const newOffset = -(cardPosition - centerOffset + twoCardsOffset);
      if (animate) {
        this.track.style.transition = "transform 0.3s ease";
      } else {
        this.track.style.transition = "none";
      }
      this.track.style.transform = `translateX(${newOffset}px)`;
      if (this.originalCards.length > 1) {
        setTimeout(
          () => {
            if (this.currentSlide < this.totalSlides) {
              this.currentSlide = this.totalSlides + this.currentSlide;
              this.updateCarousel(!1);
            } else if (this.currentSlide >= this.totalSlides * 2) {
              this.currentSlide = this.totalSlides + (this.currentSlide - this.totalSlides * 2);
              this.updateCarousel(!1);
            }
          },
          animate ? 350 : 10,
        );
      }
    }
    if (this.prevButton) this.prevButton.disabled = !1;
    if (this.nextButton) this.nextButton.disabled = !1;
    let realCardIndex;
    if (this.isMobile) {
      if (this.originalCards.length > 1) {
        realCardIndex =
          this.currentSlide === 0
            ? this.totalSlides - 1
            : this.currentSlide === this.totalSlides + 1
              ? 0
              : this.currentSlide - 1;
      } else {
        realCardIndex = this.currentSlide;
      }
    } else {
      if (this.currentSlide < this.totalSlides) {
        realCardIndex = this.currentSlide;
      } else if (this.currentSlide >= this.totalSlides * 2) {
        realCardIndex = this.currentSlide - this.totalSlides * 2;
      } else {
        realCardIndex = this.currentSlide - this.totalSlides;
      }
    }
    this.dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === realCardIndex);
    });
  }
  bindEvents() {
    if (this.prevButton) {
      this.prevButton.addEventListener("click", () => {
        if (this.isAnimating) return;
        this.isAnimating = !0;
        if (this.isMobile) {
          if (this.originalCards.length > 1) {
            this.currentSlide--;
          } else {
            this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
          }
        } else {
          this.currentSlide--;
        }
        this.updateCarousel();
        setTimeout(() => {
          this.isAnimating = !1;
        }, 350);
      });
    }
    if (this.nextButton) {
      this.nextButton.addEventListener("click", () => {
        if (this.isAnimating) return;
        this.isAnimating = !0;
        if (this.isMobile) {
          if (this.originalCards.length > 1) {
            this.currentSlide++;
          } else {
            this.currentSlide = this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
          }
        } else {
          this.currentSlide++;
        }
        this.updateCarousel();
        setTimeout(() => {
          this.isAnimating = !1;
        }, 350);
      });
    }
    this.dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        if (this.isAnimating) return;
        this.isAnimating = !0;
        if (this.isMobile) {
          if (this.originalCards.length > 1) {
            this.currentSlide = index + 1;
          } else {
            this.currentSlide = index;
          }
        } else {
          this.currentSlide = this.totalSlides + index;
        }
        this.updateCarousel();
        setTimeout(() => {
          this.isAnimating = !1;
        }, 350);
      });
    });
    this.bindTouchEvents();
    window.addEventListener("resize", () => {
      setTimeout(() => this.updateCarousel(!1), 50);
    });
  }
  bindTouchEvents() {
    const handleTouchStart = (e) => {
      if (this.isAnimating) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isSwiping = !0;
    };
    const handleTouchMove = (e) => {
      if (!this.isSwiping) return;
      this.touchEndX = e.touches[0].clientX;
      this.touchEndY = e.touches[0].clientY;
      const deltaX = this.touchEndX - this.touchStartX;
      const deltaY = this.touchEndY - this.touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        e.preventDefault();
      }
    };
    const handleTouchEnd = (e) => {
      if (!this.isSwiping || this.isAnimating) return;
      const deltaX = this.touchEndX - this.touchStartX;
      const deltaY = this.touchEndY - this.touchStartY;
      const minSwipeDistance = 50;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        this.isAnimating = !0;
        if (deltaX > 0) {
          if (this.isMobile) {
            if (this.originalCards.length > 1) {
              this.currentSlide--;
            } else {
              this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
            }
          } else {
            this.currentSlide--;
          }
        } else {
          if (this.isMobile) {
            if (this.originalCards.length > 1) {
              this.currentSlide++;
            } else {
              this.currentSlide = this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
            }
          } else {
            this.currentSlide++;
          }
        }
        this.updateCarousel(!0);
        setTimeout(() => {
          this.isAnimating = !1;
        }, 350);
      }
      this.isSwiping = !1;
    };
    this.track.addEventListener("touchstart", handleTouchStart, { passive: !1 });
    this.track.addEventListener("touchmove", handleTouchMove, { passive: !1 });
    this.track.addEventListener("touchend", handleTouchEnd, { passive: !0 });
    this.track.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }
}
const initTestimonialsCarousel = (container) => {
  if (!container || container.dataset.carouselInitialized === "true") return;
  container.dataset.carouselInitialized = "true";
  const sectionId = container.id.replace("testimonials-", "");
  new TestimonialsCarousel(sectionId);
};

const initTestimonialsCarousels = () => {
  const testimonialsContainers = document.querySelectorAll('[id^="testimonials-"]');
  testimonialsContainers.forEach((container) => {
    initTestimonialsCarousel(container);
  });
};

document.addEventListener("DOMContentLoaded", function () {
  initTestimonialsCarousels();
});

document.addEventListener("shopify:section:load", function (event) {
  const sectionId = event?.detail?.sectionId;
  if (!sectionId) return;
  const container = document.getElementById(`testimonials-${sectionId}`);
  initTestimonialsCarousel(container);
});
