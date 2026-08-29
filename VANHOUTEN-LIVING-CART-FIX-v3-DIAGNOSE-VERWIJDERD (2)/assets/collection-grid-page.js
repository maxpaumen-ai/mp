/*
 * Component: Collection Grid Page
 * Description: Advanced product grid with filtering, search, and sorting functionality
 */

// Global collection products data (previously inline script)
var collectionProducts = {
  all: [],
};

class CollectionGridPage {
  constructor(element) {
    this.element = element;
    this.sectionId = element.dataset.sectionId;

    // Cache DOM elements
    this.productCards = element.querySelectorAll(".product-card");
    this.collectionLinks = element.querySelectorAll(".collection-filter-link");
    this.sortSelect = element.querySelector(".sort-by-dropdown select");
    this.searchInput = element.querySelector(".product-search-input");
    this.searchClear = element.querySelector(".search-clear");
    this.sidebar = element.querySelector(".sidebar-filters");

    // Search state
    this.searchTimeout = null;

    // Store current active collection for re-filtering after DOM changes
    this.currentCollection = null;

    this.init();
  }

  /**
   * Refresh the product cards cache
   * Call this if products are dynamically added/removed or DOM changes
   */
  refreshProductCards() {
    this.productCards = this.element.querySelectorAll(".product-card");
  }

  /**
   * Parse the URL pathname to extract collection handle
   * Supports both /collections/:handle and /collection/:handle routes
   * @returns {string|null} Collection handle or null if not on a collection page
   */
  getCollectionFromURL() {
    const pathname = window.location.pathname;
    // Match /collections/:handle or /collection/:handle (case insensitive)
    const match = pathname.match(/\/collections?\/([^\/\?]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Get filter parameters from URL
   * @returns {Object} Object with filter groups and their values
   */
  getFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const filters = {};

    // Parse each query parameter as a potential filter group
    params.forEach((value, key) => {
      // Split comma-separated values into array
      filters[key] = value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    });

    return filters;
  }

  /**
   * Update URL with current filter state
   * @param {Object} filters - Object with filter groups and their values
   */
  updateURLWithFilters(filters) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();

    // Add each filter group to URL params
    Object.entries(filters).forEach(([group, values]) => {
      if (values && values.length > 0) {
        // Join multiple values with comma
        params.set(group, values.join(","));
      }
    });

    // Update URL without reloading the page
    const newUrl = params.toString() ? `${url.pathname}?${params.toString()}` : url.pathname;

    window.history.pushState({}, "", newUrl);
  }

  /**
   * Restore filter state from URL parameters
   */
  restoreFiltersFromURL() {
    if (!this.sidebar) return;

    const urlFilters = this.getFiltersFromURL();
    const inputs = this.sidebar.querySelectorAll(".sf-input");

    // Clear all checkboxes first
    inputs.forEach((input) => (input.checked = false));

    // Check boxes that match URL filters
    Object.entries(urlFilters).forEach(([group, values]) => {
      values.forEach((value) => {
        const input = Array.from(inputs).find(
          (inp) => inp.dataset.filterGroup === group && inp.value.toLowerCase() === value.toLowerCase(),
        );
        if (input) {
          input.checked = true;
        }
      });
    });
  }

  init() {
    this.initImageSliders();
    this.initColorSwatches();

    // Initialize collection filters with a slight delay to ensure DOM is ready
    // This is especially important for dynamically loaded content
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.refreshProductCards();
        this.initCollectionFilters();
      });
    } else {
      // DOM is already ready, but wait a tick to ensure all products are rendered
      setTimeout(() => {
        this.refreshProductCards();
        this.initCollectionFilters();
      }, 0);
    }

    this.initSorting();
    this.initSearch();
    this.initSidebarFilters();
    this.initFullCardClickable();
    this.initPopStateHandler();
  }

  /**
   * Handle browser back/forward button navigation
   * Restores filter state from URL when user navigates
   */
  initPopStateHandler() {
    window.addEventListener("popstate", () => {
      // Restore filters from URL when back/forward button is pressed
      this.restoreFiltersFromURL();

      // Re-apply filters without updating URL (we're already at the URL)
      if (this.sidebar) {
        const inputs = this.sidebar.querySelectorAll(".sf-input");
        const groups = {};
        inputs.forEach((input) => {
          if (input.checked) {
            (groups[input.dataset.filterGroup] ||= []).push(input.value);
          }
        });

        this.refreshProductCards();
        const hasFilters = Object.values(groups).some((arr) => arr && arr.length);

        this.productCards.forEach((card) => {
          const matchesSidebarFilters = !hasFilters || this.matchesFiltersHelper(card, groups);

          let matchesCollection = true;
          if (this.currentCollection) {
            const cardCollections = (card.getAttribute("data-collection") || "").toLowerCase();
            const collectionsArray = cardCollections.split(" ").filter((c) => c.length > 0);
            matchesCollection = collectionsArray.includes(this.currentCollection.toLowerCase());
          }

          card.style.display = matchesSidebarFilters && matchesCollection ? "" : "none";
        });
      }
    });
  }

  /**
   * Helper method to check if a card matches filters (for use in popstate handler)
   */
  matchesFiltersHelper(card, groups) {
    const vendor = this.normalize(card.dataset.vendor);
    const tags = (card.dataset.tags || "").toLowerCase();
    const title = this.normalize(card.dataset.title);
    const type = this.normalize(card.dataset.type);
    const cardCollections = card.getAttribute("data-collection") || "";

    for (const [group, values] of Object.entries(groups)) {
      if (!values.length) continue;
      const any = values.some((v) => {
        const val = v.toLowerCase();

        if (group === "collection") {
          if (val === "all") {
            return true;
          } else {
            const collections = cardCollections.split(" ").filter((c) => c.length > 0);
            return collections.includes(val);
          }
        } else if (group === "size") {
          return title.includes(val) || tags.includes(val);
        } else if (group === "color") {
          return title.includes(val) || tags.includes(val);
        } else if (group === "material") {
          return title.includes(val) || tags.includes(val) || type.includes(val);
        } else if (group === "style") {
          return title.includes(val) || tags.includes(val) || type.includes(val);
        } else {
          return vendor.includes(val) || tags.includes(val) || title.includes(val) || type.includes(val);
        }
      });
      if (!any) return false;
    }
    return true;
  }

  initImageSliders() {
    const sliders = this.element.querySelectorAll(".product-slider");

    sliders.forEach((slider) => {
      const wrapper = slider.querySelector(".product-slider-wrapper");
      const slides = slider.querySelectorAll(".product-slide");
      const card = slider.closest(".product-card");
      const dots = card.querySelectorAll(".dot");

      if (slides.length <= 1) return;

      let currentSlide = 0;
      const slideCount = slides.length;

      this.updateDots(dots, currentSlide);

      // Touch swipe functionality
      let touchStartX = 0;
      let touchEndX = 0;

      slider.addEventListener(
        "touchstart",
        (e) => {
          touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true },
      );

      slider.addEventListener(
        "touchend",
        (e) => {
          touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe(touchStartX, touchEndX, currentSlide, slideCount, wrapper, dots, (newSlide) => {
            currentSlide = newSlide;
          });
        },
        { passive: true },
      );

      // Mouse drag functionality
      this.initMouseDrag(slider, wrapper, dots, currentSlide, slideCount, (newSlide) => {
        currentSlide = newSlide;
      });

      // Connect dots to slides
      if (dots && dots.length) {
        dots.forEach((dot, i) => {
          dot.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentSlide = i;
            this.updateSlider(wrapper, currentSlide);
            this.updateDots(dots, currentSlide);
          });
        });
      }
    });
  }

  initMouseDrag(slider, wrapper, dots, currentSlide, slideCount, setCurrentSlide) {
    let isDragging = false;
    let startPosX = 0;

    slider.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      startPosX = e.clientX;
      slider.style.cursor = "grabbing";
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const moveX = e.clientX - startPosX;
      const slideWidth = slider.offsetWidth;

      if (Math.abs(moveX) < slideWidth * 0.5) {
        wrapper.style.transform = `translateX(${-currentSlide * 100 + (moveX / slideWidth) * 100}%)`;
      }
    });

    const handleMouseUp = (e) => {
      if (!isDragging) return;

      isDragging = false;
      slider.style.cursor = "grab";

      const moveX = e.clientX - startPosX;
      const threshold = slider.offsetWidth * 0.2;

      if (moveX < -threshold) {
        currentSlide = Math.min(currentSlide + 1, slideCount - 1);
      } else if (moveX > threshold) {
        currentSlide = Math.max(currentSlide - 1, 0);
      }

      setCurrentSlide(currentSlide);
      this.updateSlider(wrapper, currentSlide);
      this.updateDots(dots, currentSlide);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", () => {
      if (isDragging) {
        isDragging = false;
        slider.style.cursor = "grab";
        this.updateSlider(wrapper, currentSlide);
      }
    });
  }

  handleSwipe(startX, endX, currentSlide, slideCount, wrapper, dots, setCurrentSlide) {
    const threshold = 50;

    if (startX - endX > threshold) {
      currentSlide = Math.min(currentSlide + 1, slideCount - 1);
      setCurrentSlide(currentSlide);
      this.updateSlider(wrapper, currentSlide);
      this.updateDots(dots, currentSlide);
    } else if (endX - startX > threshold) {
      currentSlide = Math.max(currentSlide - 1, 0);
      setCurrentSlide(currentSlide);
      this.updateSlider(wrapper, currentSlide);
      this.updateDots(dots, currentSlide);
    }
  }

  updateSlider(wrapper, currentSlide) {
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  updateDots(dots, currentSlide) {
    if (dots && dots.length) {
      dots.forEach((dot, i) => {
        if (i === currentSlide) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    }
  }

  initColorSwatches() {
    const swatches = this.element.querySelectorAll(".color-swatch");

    swatches.forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productCard = swatch.closest(".product-card");
        const variantImage = swatch.getAttribute("data-variant-image");
        const cardSwatches = productCard.querySelectorAll(".color-swatch");

        // Remove active class from all swatches in this product
        cardSwatches.forEach((s) => s.classList.remove("active"));

        // Add active class to clicked swatch
        swatch.classList.add("active");

        // Change product image if variant has an image
        if (variantImage && variantImage !== "") {
          const productImages = productCard.querySelectorAll(".product-image");
          if (productImages.length > 0) {
            productImages[0].src = variantImage;
          }
        }
      });
    });
  }

  initCollectionFilters() {
    // Refresh product cards cache to ensure we have all current products
    this.refreshProductCards();

    // Priority order for collection detection:
    // 1. URL pathname parsing (JavaScript)
    // 2. Liquid-provided data attribute
    // 3. Already active link in DOM
    // 4. Default to showing all products

    const urlCollection = this.getCollectionFromURL();
    const liquidCollection = this.element.dataset.urlCollection || null;
    let activeLink = this.element.querySelector(".collection-filter-link.active");

    // Determine the target collection handle
    let targetCollection = null;

    if (urlCollection) {
      // URL takes priority - find matching filter link and activate it
      targetCollection = urlCollection;
    } else if (liquidCollection) {
      // Liquid-detected collection as fallback
      targetCollection = liquidCollection;
    } else if (activeLink) {
      // Use existing active link
      targetCollection = activeLink.getAttribute("data-collection");
    }

    // If we have a target collection from URL/Liquid, find and activate the matching link
    if (targetCollection && targetCollection !== "all") {
      // Find the matching filter link
      const matchingLink = Array.from(this.collectionLinks).find((link) => {
        const linkCollection = link.getAttribute("data-collection");
        return linkCollection && linkCollection.toLowerCase() === targetCollection.toLowerCase();
      });

      if (matchingLink) {
        // Remove active from all links and activate the matching one
        this.collectionLinks.forEach((l) => l.classList.remove("active"));
        matchingLink.classList.add("active");
        activeLink = matchingLink;
      }
    }

    // Store the current collection for re-filtering after DOM changes
    let finalCollection = null;

    // Apply initial filtering based on active collection
    if (activeLink) {
      const activeCollection = activeLink.getAttribute("data-collection");
      finalCollection = activeCollection;

      if (activeCollection === "all") {
        // Show all products when "Shop All" is active
        this.currentCollection = null;
        this.productCards.forEach((card) => {
          card.style.display = "";
        });
      } else {
        // Filter products by specific collection
        this.currentCollection = activeCollection;
        this.filterProductsByCollection(activeCollection);
      }
    } else if (targetCollection && targetCollection !== "all") {
      // No matching link found, but we have a URL collection - filter directly
      this.currentCollection = targetCollection;
      this.filterProductsByCollection(targetCollection);
    } else {
      // No active link and no URL collection, show all products
      this.currentCollection = null;
      this.productCards.forEach((card) => {
        card.style.display = "";
      });
    }

    // Set up click handlers for collection filter links
    this.collectionLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        // Remove active class from all links
        this.collectionLinks.forEach((l) => l.classList.remove("active"));

        // Add active class to clicked link
        link.classList.add("active");

        const collectionHandle = link.getAttribute("data-collection");
        this.currentCollection = collectionHandle === "all" ? null : collectionHandle;

        // Refresh product cards before filtering
        this.refreshProductCards();

        // Show/hide product cards based on collection
        if (collectionHandle === "all") {
          this.productCards.forEach((card) => {
            card.style.display = "";
          });
        } else {
          this.filterProductsByCollection(collectionHandle);
        }

        // Clear search when switching collections
        if (this.searchInput && this.searchInput.value.trim() !== "") {
          this.searchInput.value = "";
          if (this.searchClear) this.searchClear.style.display = "none";
          this.element.classList.remove("searching");
        }
      });
    });
  }

  /**
   * Filter products by collection handle
   * @param {string} collectionHandle - The collection handle to filter by
   */
  filterProductsByCollection(collectionHandle) {
    // Refresh product cards cache to ensure we have all current products
    this.refreshProductCards();

    if (!collectionHandle || collectionHandle === "all") {
      // Show all products
      this.productCards.forEach((card) => {
        card.style.display = "";
      });
      return;
    }

    const handle = collectionHandle.toLowerCase();
    this.productCards.forEach((card) => {
      const cardCollections = (card.getAttribute("data-collection") || "").toLowerCase();
      // Check if the card belongs to this collection
      const collectionsArray = cardCollections.split(" ").filter((c) => c.length > 0);
      const shouldShow = collectionsArray.includes(handle);

      card.style.display = shouldShow ? "" : "none";
    });
  }

  initSorting() {
    if (!this.sortSelect) return;

    this.sortSelect.addEventListener("change", () => {
      // Refresh product cards cache before sorting
      this.refreshProductCards();

      const selectedSort = this.sortSelect.value;
      const productGrid = this.element.querySelector(".product-grid");

      // Get only the visible products (respecting current filter)
      const visibleProducts = Array.from(this.productCards).filter((card) => card.style.display !== "none");

      // Sort products based on selection
      visibleProducts.sort((a, b) => {
        switch (selectedSort) {
          case "price-ascending":
            return parseFloat(a.getAttribute("data-price")) - parseFloat(b.getAttribute("data-price"));
          case "price-descending":
            return parseFloat(b.getAttribute("data-price")) - parseFloat(a.getAttribute("data-price"));
          case "title-ascending":
            return a.getAttribute("data-title").localeCompare(b.getAttribute("data-title"));
          case "title-descending":
            return b.getAttribute("data-title").localeCompare(a.getAttribute("data-title"));
          case "created-ascending":
            return new Date(a.getAttribute("data-created")) - new Date(b.getAttribute("data-created"));
          case "created-descending":
            return new Date(b.getAttribute("data-created")) - new Date(a.getAttribute("data-created"));
          default: // best-selling or default
            return parseInt(a.getAttribute("data-index")) - parseInt(b.getAttribute("data-index"));
        }
      });

      // Re-append sorted products to the grid
      visibleProducts.forEach((product) => {
        productGrid.appendChild(product);
      });

      // Re-apply current collection filter after sorting to ensure display states are preserved
      if (this.currentCollection) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          this.refreshProductCards();
          this.filterProductsByCollection(this.currentCollection);
        }, 0);
      }
    });
  }

  initSearch() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      // Show/hide clear button
      if (searchTerm.length > 0) {
        if (this.searchClear) this.searchClear.style.display = "flex";
        this.element.classList.add("searching");
      } else {
        if (this.searchClear) this.searchClear.style.display = "none";
        this.element.classList.remove("searching");
      }

      // Debounce search for better performance
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(searchTerm);
      }, 300);
    });

    // Clear search handler
    if (this.searchClear) {
      this.searchClear.addEventListener("click", () => {
        this.searchInput.value = "";
        this.searchClear.style.display = "none";
        this.element.classList.remove("searching");
        this.showAllProducts();
      });
    }
  }

  performSearch(searchTerm) {
    // Refresh product cards cache
    this.refreshProductCards();

    if (searchTerm === "") {
      // Re-apply collection filter if one is active
      if (this.currentCollection) {
        this.filterProductsByCollection(this.currentCollection);
      } else {
        this.showAllProducts();
      }
      return;
    }

    this.productCards.forEach((card) => {
      const title = card.getAttribute("data-title")?.toLowerCase() || "";
      const vendor = card.getAttribute("data-vendor")?.toLowerCase() || "";
      const tags = card.getAttribute("data-tags")?.toLowerCase() || "";
      const type = card.getAttribute("data-type")?.toLowerCase() || "";

      // Search in title, vendor, tags, and type
      const isMatch =
        title.includes(searchTerm) ||
        vendor.includes(searchTerm) ||
        tags.includes(searchTerm) ||
        type.includes(searchTerm);

      // Also check if card matches current collection filter
      let matchesCollection = true;
      if (this.currentCollection) {
        const cardCollections = (card.getAttribute("data-collection") || "").toLowerCase();
        const collectionsArray = cardCollections.split(" ").filter((c) => c.length > 0);
        matchesCollection = collectionsArray.includes(this.currentCollection.toLowerCase());
      }

      if (isMatch && matchesCollection) {
        card.classList.remove("hidden");
        card.style.display = "";
      } else {
        card.classList.add("hidden");
        setTimeout(() => {
          if (card.classList.contains("hidden")) {
            card.style.display = "none";
          }
        }, 300);
      }
    });
  }

  showAllProducts() {
    // Refresh product cards cache
    this.refreshProductCards();

    // If there's a current collection filter, re-apply it instead of showing all
    if (this.currentCollection) {
      this.filterProductsByCollection(this.currentCollection);
    } else {
      this.productCards.forEach((card) => {
        card.classList.remove("hidden");
        card.style.display = "";
      });
    }
  }

  initSidebarFilters() {
    if (!this.sidebar) return;

    const clearBtn = this.sidebar.querySelector("[data-clear-filters]");
    const inputs = this.sidebar.querySelectorAll(".sf-input");
    const header = this.sidebar.querySelector(".sidebar-filters__header");
    const content = this.sidebar.querySelector(".sidebar-filters__content");

    // Restore filters from URL on page load
    this.restoreFiltersFromURL();

    // Mobile/tablet dropdown functionality (matches CSS breakpoint at 990px)
    const initMobileDropdown = () => {
      if (window.innerWidth <= 990) {
        this.sidebar.classList.add("collapsed");
      } else {
        this.sidebar.classList.remove("collapsed");
      }
    };

    // Toggle dropdown on header click (mobile/tablet only)
    if (header) {
      header.addEventListener("click", (e) => {
        if (window.innerWidth <= 990) {
          if (!e.target.matches(".sidebar-filters__clear") && !e.target.closest(".sidebar-filters__clear")) {
            e.preventDefault();
            this.sidebar.classList.toggle("collapsed");
          }
        }
      });
    }

    // Initialize and handle resize
    initMobileDropdown();
    window.addEventListener("resize", initMobileDropdown);

    // Filter functionality
    const getActiveFilters = () => {
      const groups = {};
      inputs.forEach((input) => {
        if (input.checked) {
          (groups[input.dataset.filterGroup] ||= []).push(input.value);
        }
      });
      return groups;
    };

    const matchesFilters = (card, groups) => {
      const vendor = this.normalize(card.dataset.vendor);
      const tags = (card.dataset.tags || "").toLowerCase();
      const title = this.normalize(card.dataset.title);
      const type = this.normalize(card.dataset.type);
      const cardCollections = card.getAttribute("data-collection") || "";

      for (const [group, values] of Object.entries(groups)) {
        if (!values.length) continue;
        const any = values.some((v) => {
          const val = v.toLowerCase();

          if (group === "collection") {
            if (val === "all") {
              return true;
            } else {
              const collections = cardCollections.split(" ").filter((c) => c.length > 0);
              return collections.includes(val);
            }
          } else if (group === "size") {
            return title.includes(val) || tags.includes(val);
          } else if (group === "color") {
            return title.includes(val) || tags.includes(val);
          } else if (group === "material") {
            return title.includes(val) || tags.includes(val) || type.includes(val);
          } else if (group === "style") {
            return title.includes(val) || tags.includes(val) || type.includes(val);
          } else {
            return vendor.includes(val) || tags.includes(val) || title.includes(val) || type.includes(val);
          }
        });
        if (!any) return false;
      }
      return true;
    };

    const applyFilters = (updateURL = false) => {
      // Refresh product cards cache
      this.refreshProductCards();

      const groups = getActiveFilters();
      const hasFilters = Object.values(groups).some((arr) => arr && arr.length);

      // Update URL if requested (e.g., when user clicks Apply Filters button)
      if (updateURL) {
        this.updateURLWithFilters(groups);
      }

      this.productCards.forEach((card) => {
        // Check if card matches sidebar filters
        const matchesSidebarFilters = !hasFilters || matchesFilters(card, groups);

        // Check if card matches current collection filter
        let matchesCollection = true;
        if (this.currentCollection) {
          const cardCollections = (card.getAttribute("data-collection") || "").toLowerCase();
          const collectionsArray = cardCollections.split(" ").filter((c) => c.length > 0);
          matchesCollection = collectionsArray.includes(this.currentCollection.toLowerCase());
        }

        // Card must match both sidebar filters AND collection filter
        if (matchesSidebarFilters && matchesCollection) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    };

    // Apply filters on button click
    const applyBtn = this.element.querySelector("[data-apply-filters]");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        // Update URL when user clicks Apply Filters
        applyFilters(true);
      });
    }

    // Clear filters
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        inputs.forEach((input) => (input.checked = false));
        // Clear URL parameters when clearing filters
        this.updateURLWithFilters({});
        applyFilters(false);
      });
    }

    // Initial filter application (don't update URL, just apply filters from URL)
    setTimeout(() => applyFilters(false), 40);
  }

  initFullCardClickable() {
    const clickableCards = this.element.querySelectorAll(".product-card.full-card-clickable");

    clickableCards.forEach((card) => {
      const productUrl = card.getAttribute("data-product-url");
      if (!productUrl) return;

      let isSliding = false;
      let startX = 0;
      let startY = 0;
      const slideThreshold = 10;

      const handleStart = (e) => {
        isSliding = false;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
      };

      const handleMove = (e) => {
        if (!startX || !startY) return;

        const touch = e.touches ? e.touches[0] : e;
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);

        if (deltaX > slideThreshold || deltaY > slideThreshold) {
          isSliding = true;
        }
      };

      const handleCardClick = (e) => {
        if (isSliding) return;

        const clickedElement = e.target;
        if (clickedElement.closest("a, button, input, select, textarea")) {
          return;
        }

        if (clickedElement.closest(".product-dots, .dot")) {
          return;
        }

        window.location.href = productUrl;
      };

      // Add event listeners
      card.addEventListener("mousedown", handleStart);
      card.addEventListener("mousemove", handleMove);
      card.addEventListener("click", handleCardClick);

      card.addEventListener("touchstart", handleStart, { passive: true });
      card.addEventListener("touchmove", handleMove, { passive: true });

      card.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            isSliding = false;
          }, 100);
        },
        { passive: true },
      );

      card.addEventListener("mouseup", () => {
        setTimeout(() => {
          isSliding = false;
        }, 100);
      });
    });
  }

  normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  }

  destroy() {
    // Clean up event listeners if needed
    clearTimeout(this.searchTimeout);
  }
}

// Auto-initialize components
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-component="collection-grid-page"]').forEach((element) => {
    new CollectionGridPage(element);
  });
});

// Handle section reloads in theme editor
document.addEventListener("shopify:section:load", (event) => {
  const components = event.target.querySelectorAll('[data-component="collection-grid-page"]');
  components.forEach((element) => {
    new CollectionGridPage(element);
  });
});
