/**
 * Announcement Bar Component
 * Handles countdown timer functionality and component behavior
 */

class AnnouncementBar {
  constructor(element) {
    this.element = element;
    this.sectionId = element.dataset.sectionId;
    this.useThemeColors = element.dataset.useThemeColors === 'true';
    this.isSticky = element.dataset.sticky === 'true';
    this.showDays = element.dataset.showDays === 'true';
    this.useCustomDate = element.dataset.customDate === 'true';
    this.endDate = element.dataset.endDate;
    this.timezone = element.dataset.timezone || 'America/New_York';
    
    this.timer = null;
    this.isVisible = true;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupStickyBehavior();
    this.startCountdown();
    this.bindEvents();
    
    // Emit initialized event
    this.emit('announcement-bar:initialized', {
      sectionId: this.sectionId
    });
  }

  cacheElements() {
    this.daysElement = this.element.querySelector('.countdown-days');
    this.hoursElement = this.element.querySelector('.countdown-hours');
    this.minutesElement = this.element.querySelector('.countdown-minutes');
    this.secondsElement = this.element.querySelector('.countdown-seconds');
    
    // Check for required elements
    if (!this.hoursElement || !this.minutesElement || !this.secondsElement) {
      console.error('AnnouncementBar: Required countdown elements not found');
      return;
    }
  }

  setupStickyBehavior() {
    if (this.isSticky) {
      this.element.classList.add('is-sticky');
      
      // Add sticky behavior with header if needed
      const header = document.querySelector('.site-header');
      if (header) {
        header.style.top = `${this.element.offsetHeight}px`;
      }
    }
  }

  startCountdown() {
    // Mark as loading
    this.element.classList.add('is-loading');
    
    // Update immediately
    this.updateDisplay();
    
    // Start timer
    this.timer = setInterval(() => {
      this.updateDisplay();
    }, 1000);
    
    // Remove loading state after first update
    setTimeout(() => {
      this.element.classList.remove('is-loading');
    }, 100);
  }

  calculateTimeLeft() {
    const now = new Date();
    let targetDate;

    if (this.useCustomDate && this.endDate) {
      targetDate = new Date(this.endDate);
    } else {
      // Calculate next midnight in specified timezone
      targetDate = this.getNextMidnight();
    }

    const diff = targetDate - now;
    
    if (diff < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }

  getNextMidnight() {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: this.timezone }));
    
    const midnight = new Date(localTime);
    midnight.setHours(24, 0, 0, 0);
    
    // If we're past midnight, get next midnight
    if (midnight <= localTime) {
      midnight.setDate(midnight.getDate() + 1);
    }
    
    return midnight;
  }

  updateDisplay() {
    const timeLeft = this.calculateTimeLeft();
    
    if (timeLeft.expired) {
      this.handleExpiration();
      return;
    }
    
    // Update display elements
    if (this.showDays && this.daysElement) {
      this.daysElement.textContent = this.formatTime(timeLeft.days);
    }
    
    this.hoursElement.textContent = this.formatTime(timeLeft.hours);
    this.minutesElement.textContent = this.formatTime(timeLeft.minutes);
    this.secondsElement.textContent = this.formatTime(timeLeft.seconds);
    
    // Emit update event
    this.emit('announcement-bar:updated', {
      timeLeft,
      sectionId: this.sectionId
    });
  }

  formatTime(time) {
    return time.toString().padStart(2, '0');
  }

  handleExpiration() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Reset to 00:00:00:00
    if (this.showDays && this.daysElement) {
      this.daysElement.textContent = '00';
    }
    this.hoursElement.textContent = '00';
    this.minutesElement.textContent = '00';
    this.secondsElement.textContent = '00';
    
    // Emit expiration event
    this.emit('announcement-bar:expired', {
      sectionId: this.sectionId
    });
    
    // If using daily reset, restart countdown to next midnight
    if (!this.useCustomDate) {
      setTimeout(() => {
        this.startCountdown();
      }, 1000);
    }
  }

  bindEvents() {
    // Handle visibility changes
    if ('hidden' in document) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    // Handle theme editor events
    if (this.isShopifyEditor()) {
      this.bindEditorEvents();
    }
    
    // Handle window resize for sticky positioning
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
  }

  bindEditorEvents() {
    document.addEventListener(`shopify:section:${this.sectionId}:load`, this.handleSectionLoad.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:unload`, this.handleSectionUnload.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:select`, this.handleSectionSelect.bind(this));
    document.addEventListener(`shopify:section:${this.sectionId}:deselect`, this.handleSectionDeselect.bind(this));
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseCountdown();
    } else {
      this.resumeCountdown();
    }
  }

  handleResize() {
    if (this.isSticky) {
      const header = document.querySelector('.site-header');
      if (header) {
        header.style.top = `${this.element.offsetHeight}px`;
      }
    }
  }

  handleSectionLoad() {
    this.init();
  }

  handleSectionUnload() {
    this.destroy();
  }

  handleSectionSelect() {
    this.element.classList.add('is-selected');
  }

  handleSectionDeselect() {
    this.element.classList.remove('is-selected');
  }

  pauseCountdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resumeCountdown() {
    if (!this.timer) {
      this.startCountdown();
    }
  }

  show() {
    this.element.classList.remove('is-hidden');
    this.element.classList.add('is-visible');
    this.isVisible = true;
  }

  hide() {
    this.element.classList.add('is-hidden');
    this.element.classList.remove('is-visible');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
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
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    
    this.element.dispatchEvent(event);
  }

  destroy() {
    // Clean up timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up sticky header adjustments
    if (this.isSticky) {
      const header = document.querySelector('.site-header');
      if (header) {
        header.style.top = '';
      }
    }
    
    // Emit destroyed event
    this.emit('announcement-bar:destroyed', {
      sectionId: this.sectionId
    });
  }

  // Public API methods
  restart() {
    this.destroy();
    this.init();
  }

  setEndDate(date) {
    this.endDate = date;
    this.useCustomDate = true;
    this.element.dataset.customDate = 'true';
    this.element.dataset.endDate = date;
    this.restart();
  }

  getTimeLeft() {
    return this.calculateTimeLeft();
  }
}

// Auto-initialization
document.addEventListener('DOMContentLoaded', () => {
  const components = document.querySelectorAll('[data-component="announcement-bar"]');
  const instances = [];
  
  components.forEach(element => {
    const instance = new AnnouncementBar(element);
    instances.push(instance);
    
    // Store instance reference for external access
    element._announcementBarInstance = instance;
  });
  
  // Store globally for debugging in Shopify editor
  if (window.Shopify && window.Shopify.designMode) {
    window._announcementBarInstances = instances;
  }
});

// Shopify theme editor support
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const newElement = event.target.querySelector('[data-component="announcement-bar"]');
    if (newElement && !newElement._announcementBarInstance) {
      const instance = new AnnouncementBar(newElement);
      newElement._announcementBarInstance = instance;
    }
  });
  
  document.addEventListener('shopify:section:unload', (event) => {
    const element = event.target.querySelector('[data-component="announcement-bar"]');
    if (element && element._announcementBarInstance) {
      element._announcementBarInstance.destroy();
      element._announcementBarInstance = null;
    }
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnnouncementBar;
} else if (typeof window !== 'undefined') {
  window.AnnouncementBar = AnnouncementBar;
}