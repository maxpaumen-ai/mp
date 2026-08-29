/**
 * Contact Form Component
 * 
 * Handles form validation, submission, and user feedback
 * Follows the component architecture pattern
 */
class ContactForm {
  constructor(element) {
    this.element = element;
    this.form = element.querySelector('form');
    this.fields = element.querySelectorAll('.contact-form__input');
    this.submitButton = element.querySelector('.contact-form__button');
    this.statusContainer = element.querySelector('.contact-form__status');
    
    // Configuration from data attributes
    this.config = {
      validateOnSubmit: element.dataset.validateOnSubmit !== 'false',
      showSuccessMessage: element.dataset.showSuccessMessage !== 'false',
      autoFocusErrors: element.dataset.autoFocusErrors !== 'false',
      debounceDelay: parseInt(element.dataset.debounceDelay) || 300
    };
    
    // Store bound methods to prevent memory leaks
    this.boundValidateField = this.validateField.bind(this);
    this.boundHandleSubmit = this.handleSubmit.bind(this);
    this.boundHandleSubmitClick = this.handleSubmitClick.bind(this);
    
    // Store debounced functions for cleanup
    this.debouncedValidateField = this.debounce(this.boundValidateField, this.config.debounceDelay);
    
    // Store timeout references for cleanup
    this.activeTimeouts = new Set();
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupValidation();
    this.setupAccessibility();
    this.setupColorVariables();
  }

  bindEvents() {
    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', this.boundHandleSubmit);
    }

    // Real-time validation
    this.fields.forEach(field => {
      field.addEventListener('blur', this.boundValidateField);
      field.addEventListener('input', this.debouncedValidateField);
    });

    // Submit button state
    if (this.submitButton) {
      this.submitButton.addEventListener('click', this.boundHandleSubmitClick);
    }
  }

  setupValidation() {
    // Add validation rules to fields
    this.fields.forEach(field => {
      this.addValidationRules(field);
    });
  }

  setupColorVariables() {
    // Convert primary color to RGB for box-shadow
    const primaryColor = getComputedStyle(this.element).getPropertyValue('--primary-color').trim();
    if (primaryColor && primaryColor !== '#000') {
      const rgb = this.hexToRgb(primaryColor);
      if (rgb) {
        this.element.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      }
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  setupAccessibility() {
    // Ensure proper ARIA attributes
    this.fields.forEach(field => {
      if (!field.getAttribute('aria-describedby')) {
        const errorId = `${field.id}-error`;
        field.setAttribute('aria-describedby', errorId);
      }
    });
  }

  addValidationRules(field) {
    const type = field.type;
    const name = field.name;
    
    // Email validation
    if (type === 'email' || name.includes('email')) {
      field.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
    }
    
    // Phone validation - consistent with HTML pattern
    if (type === 'tel' || name.includes('phone')) {
      field.setAttribute('pattern', '[0-9\\-\\+\\(\\)\\s]*');
    }
    
    // Required fields
    if (field.hasAttribute('required') || field.hasAttribute('aria-required')) {
      field.setAttribute('aria-required', 'true');
    }
  }

  validateField(event) {
    const field = event.target;
    const isValid = this.isFieldValid(field);
    
    this.updateFieldState(field, isValid);
    this.updateFormState();
    
    return isValid;
  }

  isFieldValid(field) {
    const value = field.value.trim();
    const type = field.type;
    const isRequired = field.hasAttribute('required') || field.hasAttribute('aria-required');
    
    // Check if required field is empty
    if (isRequired && !value) {
      return false;
    }
    
    // Check email format
    if (type === 'email' && value) {
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
      return emailRegex.test(value);
    }
    
    // Check phone format
    if (type === 'tel' && value) {
      const phoneRegex = /^[\+]?[0-9\-\+\(\)\s]{7,}$/;
      return phoneRegex.test(value);
    }
    
    // Check minimum length for text fields
    if (type === 'text' && value && field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      return value.length >= minLength;
    }
    
    return true;
  }

  updateFieldState(field, isValid) {
    const fieldContainer = field.closest('.contact-form__field');
    const errorElement = fieldContainer.querySelector('.contact-form__field-error');
    const errorText = errorElement?.querySelector('.error-text');
    
    if (isValid) {
      fieldContainer.classList.remove('contact-form__field--with-error');
      field.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    } else {
      fieldContainer.classList.add('contact-form__field--with-error');
      field.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.style.display = 'block';
        // Set appropriate error message
        if (errorText) {
          errorText.textContent = this.getFieldErrorMessage(field);
        }
      }
    }
  }

  getFieldErrorMessage(field) {
    const type = field.type;
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required') || field.hasAttribute('aria-required');
    
    if (isRequired && !value) {
      return `${field.getAttribute('placeholder') || 'This field'} is required`;
    }
    
    if (type === 'email' && value) {
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    
    if (type === 'tel' && value) {
      const phoneRegex = /^[\+]?[0-9\-\+\(\)\s]{7,}$/;
      if (!phoneRegex.test(value)) {
        return 'Please enter a valid phone number';
      }
    }
    
    return 'Please check this field';
  }

  updateFormState() {
    // Only validate required fields for button state
    const requiredFields = Array.from(this.fields).filter(field => 
      field.hasAttribute('required') || field.hasAttribute('aria-required')
    );
    
    const allRequiredFieldsValid = requiredFields.every(field => this.isFieldValid(field));
    
    if (this.submitButton) {
      this.submitButton.disabled = !allRequiredFieldsValid;
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    
    // Validate all fields
    const allFieldsValid = this.validateAllFields();
    
    if (!allFieldsValid) {
      this.showValidationErrors();
      return; // Remove unnecessary return false
    }
    
    // Show loading state
    this.setLoadingState(true);
    
    // Submit form
    this.submitForm();
  }

  handleSubmitClick(event) {
    // Prevent double submission
    if (this.submitButton.disabled) {
      event.preventDefault();
      return false;
    }
  }

  validateAllFields() {
    let allValid = true;
    
    this.fields.forEach(field => {
      const isValid = this.isFieldValid(field);
      this.updateFieldState(field, isValid);
      if (!isValid) {
        allValid = false;
      }
    });
    
    return allValid;
  }

  showValidationErrors() {
    const firstErrorField = this.element.querySelector('.contact-form__field--with-error .contact-form__input');
    
    if (firstErrorField && this.config.autoFocusErrors) {
      firstErrorField.focus();
    }
    
    // Announce errors to screen readers
    this.announceErrors();
  }

  announceErrors() {
    const errorCount = this.element.querySelectorAll('.contact-form__field--with-error').length;
    
    if (errorCount > 0) {
      const message = `${errorCount} field${errorCount > 1 ? 's' : ''} require${errorCount > 1 ? '' : 's'} attention`;
      this.announceToScreenReader(message);
    }
  }

  submitForm() {
    // Create FormData
    const formData = new FormData(this.form);
    
    // Add additional data if needed
    formData.append('form_type', 'contact');
    
    // Submit via fetch
    fetch('/contact', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      if (response.ok) {
        this.handleSuccess();
      } else {
        this.handleError(response);
      }
    })
    .catch(error => {
      this.handleError(error);
    })
    .finally(() => {
      this.setLoadingState(false);
    });
  }

  handleSuccess() {
    if (this.config.showSuccessMessage) {
      this.showSuccessMessage();
    }
    
    // Reset form
    this.resetForm();
    
    // Emit success event
    this.emit('contact:success');
  }

  handleError(error) {
    console.error('Contact form submission error:', error);
    this.showErrorMessage();
    
    // Emit error event
    this.emit('contact:error', { error });
  }

  showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'contact-form__status contact-form__status--success';
    message.innerHTML = `
      <span class="contact-form__status-icon">
        <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-success" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#28a745"/>
          <path d="M4 8L7 11L12 5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span>Thank you! Your message has been sent successfully.</span>
    `;
    
    this.insertStatusMessage(message);
    this.announceToScreenReader('Form submitted successfully');
  }

  showErrorMessage() {
    const message = document.createElement('div');
    message.className = 'contact-form__status contact-form__status--error';
    message.innerHTML = `
      <span class="contact-form__status-icon">
        <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-error" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#dc3545"/>
          <path d="M5 5L11 11M11 5L5 11" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </span>
      <span>Sorry, there was an error sending your message. Please try again.</span>
    `;
    
    this.insertStatusMessage(message);
    this.announceToScreenReader('Error submitting form. Please try again.');
  }

  insertStatusMessage(message) {
    // Remove only existing messages, not the container
    const existingMessages = this.element.querySelectorAll('.contact-form__status--success, .contact-form__status--error');
    existingMessages.forEach(msg => msg.remove());
    
    if (this.statusContainer) {
      this.statusContainer.appendChild(message);
    } else {
      this.form.insertBefore(message, this.form.firstChild);
    }
    
    // Auto-remove success messages after 5 seconds with tracking
    if (message.classList.contains('contact-form__status--success')) {
      const timeoutId = setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
        this.activeTimeouts.delete(timeoutId);
      }, 5000);
      
      this.activeTimeouts.add(timeoutId);
    }
  }

  resetForm() {
    this.form.reset();
    
    // Clear validation states
    this.fields.forEach(field => {
      this.updateFieldState(field, true);
    });
    
    this.updateFormState();
  }

  setLoadingState(isLoading) {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      this.submitButton.textContent = isLoading ? 'Sending...' : 'Send Message';
    }
  }

  announceToScreenReader(message) {
    // Create or update screen reader announcement
    let announcer = document.getElementById('contact-form-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'contact-form-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'visually-hidden';
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  // Utility method for debouncing with proper cleanup
  debounce(func, wait) {
    let timeoutId = null;
    
    const debouncedFn = (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.activeTimeouts.delete(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        timeoutId = null;
        func(...args);
      }, wait);
      
      this.activeTimeouts.add(timeoutId);
    };
    
    // Méthode pour nettoyer ce debounce spécifique
    debouncedFn.cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.activeTimeouts.delete(timeoutId);
        timeoutId = null;
      }
    };
    
    return debouncedFn;
  }

  // Event emission
  emit(eventName, data = {}) {
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  // Public API methods
  validate() {
    return this.validateAllFields();
  }

  reset() {
    this.resetForm();
  }

  destroy() {
    // 1. Clear all active timeouts first
    this.activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();
    
    // 2. Clean up the specific debounce function
    if (this.debouncedValidateField && this.debouncedValidateField.cleanup) {
      this.debouncedValidateField.cleanup();
    }
    
    // 3. Remove event listeners with correct references
    if (this.fields && this.fields.length) {
      this.fields.forEach(field => {
        if (this.boundValidateField) {
          field.removeEventListener('blur', this.boundValidateField);
        }
        if (this.debouncedValidateField) {
          field.removeEventListener('input', this.debouncedValidateField);
        }
      });
    }
    
    // 4. Remove form event listeners
    if (this.form && this.boundHandleSubmit) {
      this.form.removeEventListener('submit', this.boundHandleSubmit);
    }
    
    // 5. Remove button event listeners
    if (this.submitButton && this.boundHandleSubmitClick) {
      this.submitButton.removeEventListener('click', this.boundHandleSubmitClick);
    }
    
    // 6. Clean up screen reader announcer if it exists
    const announcer = document.getElementById('contact-form-announcer');
    if (announcer) {
      announcer.remove();
    }
    
    // 7. Clear all object references to prevent memory leaks
    this.element = null;
    this.form = null;
    this.fields = null;
    this.submitButton = null;
    this.statusContainer = null;
    this.config = null;
    
    // 8. Clear function references
    this.boundValidateField = null;
    this.boundHandleSubmit = null;
    this.boundHandleSubmitClick = null;
    this.debouncedValidateField = null;
    
    // 9. Clear collections
    this.activeTimeouts = null;
  }
}

// Auto-initialize contact forms
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-component="contact-form"]').forEach(element => {
    new ContactForm(element);
  });
});

// Export for manual initialization if needed
window.ContactForm = ContactForm;