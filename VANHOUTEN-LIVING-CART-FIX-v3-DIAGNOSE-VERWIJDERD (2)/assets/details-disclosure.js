class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', true);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.hoverTimeout = null;
    this.isHoverEnabled = window.innerWidth >= 990;
    
    this.setupHoverEvents();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  setupHoverEvents() {
    if (!this.isHoverEnabled) return;
    
    // Remove existing listeners first to avoid duplicates
    this.removeEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mouseleave', this.onMouseLeave);
    
    // Add hover listeners
    this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
  }

  onMouseEnter() {
    if (!this.isHoverEnabled) return;
    
    // Clear any existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // Open the menu
    this.open();
  }

  onMouseLeave() {
    if (!this.isHoverEnabled) return;
    
    // Set a timeout to close the menu after a brief delay
    this.hoverTimeout = setTimeout(() => {
      this.close();
      this.hoverTimeout = null;
    }, 150);
  }

  onResize() {
    const wasHoverEnabled = this.isHoverEnabled;
    this.isHoverEnabled = window.innerWidth >= 990;
    
    if (wasHoverEnabled !== this.isHoverEnabled) {
      if (this.isHoverEnabled) {
        this.setupHoverEvents();
      } else {
        this.removeEventListener('mouseenter', this.onMouseEnter);
        this.removeEventListener('mouseleave', this.onMouseLeave);
        this.close();
      }
    }
  }

  onToggle() {
    if (!this.header) return;
    
    this.header.preventHide = this.mainDetailsToggle.open;
    
    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);