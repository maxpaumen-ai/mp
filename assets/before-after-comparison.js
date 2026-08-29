/* 
 * Component: Before & After Comparison
 * Description: Interactive image comparison slider with drag functionality
 */

class BeforeAfterComparison {
  constructor(element) {
    this.container = element;
    this.sectionId = element.dataset.sectionId;
    this.initialPosition = parseFloat(element.dataset.initialPosition) || 50;
    
    this.sliderPosition = this.initialPosition;
    this.isDragging = false;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEventHandlers();
    this.bindEvents();
    this.updateSliderPosition(this.initialPosition);
  }

  cacheElements() {
    this.sliderButton = this.container.querySelector('.slider-button');
    this.afterImage = this.container.querySelector('.after-image-container');
    this.dividerLine = this.container.querySelector('.comparison-divider-line');
  }

  bindEventHandlers() {
    // Bind event handlers to maintain proper context for removal
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
  }

  bindEvents() {
    // Slider button events
    this.sliderButton.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.sliderButton.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    
    // Keyboard navigation
    this.sliderButton.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Container click to move slider
    this.container.addEventListener('mousedown', (e) => {
      if (e.target === this.sliderButton || this.sliderButton.contains(e.target)) return;
      this.handleMouseDown(e);
    });
    
    this.container.addEventListener('touchstart', (e) => {
      if (e.target === this.sliderButton || this.sliderButton.contains(e.target)) return;
      this.handleTouchStart(e);
    }, { passive: true });
    
    this.container.addEventListener('click', this.handleContainerClick.bind(this));
    
    // Global events for dragging
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
    document.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundHandleTouchEnd);
  }

  handleMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.sliderButton.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
    
    if (e.target !== this.sliderButton && !this.sliderButton.contains(e.target)) {
      this.moveSliderToPosition(e);
    }
  }

  handleTouchStart(e) {
    this.isDragging = true;
    this.sliderButton.classList.add('dragging');
    
    if (e.target !== this.sliderButton && !this.sliderButton.contains(e.target)) {
      this.moveSliderToPosition(e.touches[0]);
    }
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.moveSliderToPosition(e);
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.moveSliderToPosition(e.touches[0]);
  }

  handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.sliderButton.classList.remove('dragging');
    document.body.style.cursor = '';
  }

  handleTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.sliderButton.classList.remove('dragging');
  }

  handleKeyDown(e) {
    const step = 5;
    let newPosition = this.sliderPosition;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newPosition = Math.max(0, this.sliderPosition - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newPosition = Math.min(100, this.sliderPosition + step);
        break;
      case 'Home':
        e.preventDefault();
        newPosition = 0;
        break;
      case 'End':
        e.preventDefault();
        newPosition = 100;
        break;
      default:
        return;
    }
    
    this.updateSliderPosition(newPosition);
  }

  handleContainerClick(e) {
    if (this.isDragging || e.target === this.sliderButton || this.sliderButton.contains(e.target)) {
      return;
    }
    
    this.moveSliderToPosition(e);
  }

  moveSliderToPosition(event) {
    const rect = this.container.getBoundingClientRect();
    const x = (event.clientX || event.pageX) - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    this.updateSliderPosition(percentage);
  }

  updateSliderPosition(percentage) {
    this.sliderPosition = percentage;
    
    // Update slider button position
    this.sliderButton.style.left = `${percentage}%`;
    
    // Update divider line position
    this.dividerLine.style.left = `${percentage}%`;
    
    // Update after image clip
    this.afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    
    // Update ARIA attributes for accessibility
    this.sliderButton.setAttribute('aria-valuenow', Math.round(percentage));
  }

  // Cleanup method
  destroy() {
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    document.removeEventListener('touchmove', this.boundHandleTouchMove);
    document.removeEventListener('touchend', this.boundHandleTouchEnd);
  }
}

// Auto-initialize components
document.addEventListener('DOMContentLoaded', function() {
  const containers = document.querySelectorAll('[data-component="before-after-comparison"]');
  
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      new BeforeAfterComparison(container);
      container.dataset.initialized = 'true';
    }
  });
});

// Re-initialize on Shopify section load (theme editor)
document.addEventListener('shopify:section:load', function(event) {
  const container = event.target.querySelector('[data-component="before-after-comparison"]');
  if (container && !container.dataset.initialized) {
    new BeforeAfterComparison(container);
    container.dataset.initialized = 'true';
  }
});