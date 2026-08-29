/**
 * Alternating Features Component
 * Handles component behavior, theming, and interactions
 */

class AlternatingFeatures {
  constructor(element) {
    this.element = element;
    this.sectionId = element.dataset.sectionId;
    this.useThemeColors = element.dataset.useThemeColors === 'true';
    this.useGradient = element.dataset.useGradient === 'true';
    this.iconBackground = element.dataset.iconBackground === 'true';
    
    // Cache settings from data attributes
    this.settings = {
      paddingTop: element.dataset.paddingTop,
      paddingBottom: element.dataset.paddingBottom,
      iconSize: element.dataset.iconSize,
      featureSpacing: element.dataset.featureSpacing
    };
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.applySectionSettings();
    this.setupIntersectionObserver();
    this.bindEvents();
    this.handleResponsiveImages();
    
    // Emit initialized event
    this.emit('alternating-features:initialized', {
      sectionId: this.sectionId,
      settings: this.settings
    });
  }

  cacheElements() {
    this.container = this.element.querySelector('.alternating-features__container');
    this.title = this.element.querySelector('.alternating-features__title');
    this.accent = this.element.querySelector('.alternating-features__accent');
    this.image = this.element.querySelector('.alternating-features__image');
    this.featureItems = this.element.querySelectorAll('.alternating-features__item');
    this.benefitItems = this.element.querySelectorAll('.benefit-item');
  }

  applySectionSettings() {
    // Apply dynamic settings via CSS custom properties
    const cssVariables = this.buildCSSVariables();
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(`--${property}`, value);
    });
  }

  buildCSSVariables() {
    const variables = {};
    
    // Apply settings from data attributes
    if (this.settings.paddingTop) {
      variables['section-padding-top'] = `${this.settings.paddingTop}px`;
    }
    if (this.settings.paddingBottom) {
      variables['section-padding-bottom'] = `${this.settings.paddingBottom}px`;
    }
    if (this.settings.iconSize) {
      variables['icon-size'] = `${this.settings.iconSize}px`;
    }
    if (this.settings.featureSpacing) {
      variables['feature-spacing'] = `${this.settings.featureSpacing}px`;
    }
    
    return variables;
  }

  setupIntersectionObserver() {
    // Setup intersection observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleInView(entry.target);
        }
      });
    }, observerOptions);

    // Observe main element and feature items
    this.intersectionObserver.observe(this.element);
    
    this.featureItems.forEach((item, index) => {
      // Add staggered animation delay
      item.style.setProperty('--animation-delay', `${index * 0.1}s`);
      this.intersectionObserver.observe(item);
    });
  }

  handleInView(element) {
    // Add visible class for animations
    element.classList.add('is-visible');
    
    // Emit visibility event
    this.emit('alternating-features:in-view', {
      element: element,
      sectionId: this.sectionId
    });
  }

  bindEvents() {
    // Listen for theme changes
    document.addEventListener('theme:changed', this.handleThemeChange.bind(this));
    
    // Listen for window resize for responsive adjustments
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    
    // Shopify theme editor events
    if (this.isShopifyEditor()) {
      this.bindEditorEvents();
    }
    
    // Feature item interactions
    this.bindFeatureItemEvents();
  }

  bindEditorEvents() {
    // Handle section reloads in Shopify theme editor
    document.addEventListener(`shopify:section:${this.sectionId}:load`, this.handleSectionLoad.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:unload`, this.handleSectionUnload.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:select`, this.handleSectionSelect.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:deselect`, this.handleSectionDeselect.bind(this));
  }

  bindFeatureItemEvents() {
    // Add hover effects and interactions to feature items
    this.featureItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        this.handleFeatureItemHover(item, index);
      });
      
      item.addEventListener('mouseleave', () => {
        this.handleFeatureItemLeave(item, index);
      });
    });
  }

  handleFeatureItemHover(item, index) {
    item.classList.add('is-hovered');
    
    // Emit hover event
    this.emit('alternating-features:item-hover', {
      item: item,
      index: index,
      sectionId: this.sectionId
    });
  }

  handleFeatureItemLeave(item, index) {
    item.classList.remove('is-hovered');
    
    // Emit leave event
    this.emit('alternating-features:item-leave', {
      item: item,
      index: index,
      sectionId: this.sectionId
    });
  }

  handleResponsiveImages() {
    if (this.image) {
      // Setup responsive image handling
      this.image.addEventListener('load', () => {
        this.image.classList.add('is-loaded');
      });
      
      // Handle image error
      this.image.addEventListener('error', () => {
        this.image.classList.add('has-error');
        console.warn(`Failed to load image in alternating-features section: ${this.sectionId}`);
      });
    }
  }

  handleThemeChange(event) {
    // Reapply settings when theme changes
    this.applySectionSettings();
    
    // Emit theme change event
    this.emit('alternating-features:theme-changed', {
      sectionId: this.sectionId,
      themeData: event.detail
    });
  }

  handleResize() {
    // Handle responsive adjustments
    this.updateResponsiveClasses();
    
    // Emit resize event
    this.emit('alternating-features:resize', {
      sectionId: this.sectionId,
      width: window.innerWidth
    });
  }

  updateResponsiveClasses() {
    const width = window.innerWidth;
    
    // Remove existing responsive classes
    this.element.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
    
    // Add appropriate responsive class
    if (width < 768) {
      this.element.classList.add('is-mobile');
    } else if (width < 1024) {
      this.element.classList.add('is-tablet');
    } else {
      this.element.classList.add('is-desktop');
    }
  }

  handleSectionLoad(event) {
    // Reinitialize when section is reloaded in editor
    this.init();
    console.log(`Alternating Features section reloaded: ${this.sectionId}`);
  }

  handleSectionUnload(event) {
    // Cleanup when section is unloaded
    this.destroy();
    console.log(`Alternating Features section unloaded: ${this.sectionId}`);
  }

  handleSectionSelect(event) {
    // Add selected state for editor
    this.element.classList.add('is-selected');
  }

  handleSectionDeselect(event) {
    // Remove selected state
    this.element.classList.remove('is-selected');
  }

  // Utility methods
  isShopifyEditor() {
    return window.Shopify && window.Shopify.designMode;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  emit(eventName, data) {
    // Emit custom events for component communication
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    
    this.element.dispatchEvent(event);
  }

  destroy() {
    // Cleanup method
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Emit destroyed event
    this.emit('alternating-features:destroyed', {
      sectionId: this.sectionId
    });
  }

  // Public API methods
  refresh() {
    // Public method to refresh the component
    this.applySectionSettings();
    this.updateResponsiveClasses();
  }

  updateSetting(property, value) {
    // Public method to update a setting
    this.settings[property] = value;
    this.element.dataset[this.camelCase(property)] = value;
    this.applySectionSettings();
  }

  getSetting(property) {
    // Public method to get a setting
    return this.settings[property];
  }

  camelCase(str) {
    // Convert kebab-case to camelCase
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }
}

// Auto-initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all alternating-features components
  const components = document.querySelectorAll('[data-component="alternating-features"]');
  const instances = [];
  
  components.forEach(element => {
    const instance = new AlternatingFeatures(element);
    instances.push(instance);
    
    // Store instance reference on element for external access
    element._alternatingFeaturesInstance = instance;
  });
  
  // Store all instances globally for debugging
  if (window.Shopify && window.Shopify.designMode) {
    window._alternatingFeaturesInstances = instances;
  }
});

// Shopify theme editor support
if (window.Shopify && window.Shopify.designMode) {
  // Handle section loads in theme editor
  document.addEventListener('shopify:section:load', (event) => {
    const newElement = event.target.querySelector('[data-component="alternating-features"]');
    if (newElement && !newElement._alternatingFeaturesInstance) {
      const instance = new AlternatingFeatures(newElement);
      newElement._alternatingFeaturesInstance = instance;
    }
  });
  
  // Handle section unloads
  document.addEventListener('shopify:section:unload', (event) => {
    const element = event.target.querySelector('[data-component="alternating-features"]');
    if (element && element._alternatingFeaturesInstance) {
      element._alternatingFeaturesInstance.destroy();
      element._alternatingFeaturesInstance = null;
    }
  });
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlternatingFeatures;
} else if (typeof window !== 'undefined') {
  window.AlternatingFeatures = AlternatingFeatures;
}