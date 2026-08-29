/**
 * Cart Subscribe Button
 * Conditionally displays "Subscribe & Save" button for cart items
 * that have selling plans available but don't currently have one assigned
 */

(function() {


  let cartDataCache = null;

  async function fetchCartData() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) {
        return null;
      }
      cartDataCache = await response.json();
      return cartDataCache;
    } catch (error) {
      return null;
    }
  }

  function itemHasSellingPlan(variantId) {
    if (!cartDataCache || !cartDataCache.items) {
      return false;
    }

    const cartItem = cartDataCache.items.find(item => item.variant_id === variantId);
    if (!cartItem) {
      return false;
    }

    return cartItem.selling_plan_allocation != null && 
           cartItem.selling_plan_allocation !== undefined &&
           cartItem.selling_plan_allocation.selling_plan != null;
  }


  async function updateSubscribeButtons() {
    const cartData = await fetchCartData();
    if (!cartData) {
      document.querySelectorAll('.cart-item__subscribe-button-wrapper').forEach(wrapper => {
        wrapper.style.display = 'none';
      });
      return;
    }

    const cartItemRows = document.querySelectorAll('.cart-item[data-has-selling-plans]');
    
    cartItemRows.forEach((itemRow) => {
      const hasSellingPlans = itemRow.getAttribute('data-has-selling-plans') === 'true';
      const variantId = parseInt(itemRow.getAttribute('data-variant-id'), 10);
      const buttonWrapper = itemRow.querySelector('.cart-item__subscribe-button-wrapper');
      const optionsDiv = itemRow.querySelector('.cart-item__subscribe-options');
      const subscriptionNameText = itemRow.querySelector('.cart-item__subscription-name');
      
      if (!buttonWrapper || !variantId) return;
      
      const hasSellingPlan = itemHasSellingPlan(variantId);
      
      // Get total options count
      const totalOptions = parseInt(buttonWrapper?.querySelector('.cart-item__subscribe-button')?.dataset.totalOptions || optionsDiv?.dataset.totalOptions || '0', 10);
      
      // Show button only if product has selling plans AND doesn't have an active subscription
      if (hasSellingPlans && !hasSellingPlan) {
        buttonWrapper.style.display = '';
        
        if (optionsDiv) {
          optionsDiv.style.display = 'none';
        }
        
        if (subscriptionNameText) {
          subscriptionNameText.style.display = 'none';
        }
      } 
      else {
        buttonWrapper.style.display = 'none';
        // Show options only if there's an active subscription AND more than 1 option
        if (hasSellingPlan && optionsDiv && totalOptions > 1) {
          optionsDiv.style.display = 'flex';
          updateSelectForCurrentSubscription(itemRow, variantId);
          
          if (subscriptionNameText) {
            subscriptionNameText.style.display = 'none';
          }
        } else {
          if (optionsDiv) {
            optionsDiv.style.display = 'none';
          }
          
          if (subscriptionNameText && hasSellingPlan) {
            subscriptionNameText.style.display = '';
          }
        }
      }
    });
  }

  /**
   * Update select dropdown to show current subscription
   */
  function updateSelectForCurrentSubscription(itemRow, variantId) {
    if (!cartDataCache || !cartDataCache.items) return;

    const cartItem = cartDataCache.items.find(item => item.variant_id === variantId);
    if (!cartItem || !cartItem.selling_plan_allocation) return;

    const select = itemRow.querySelector('.cart-item__subscribe-frequency-select');
    if (!select) return;

    const currentPlanId = cartItem.selling_plan_allocation.selling_plan.id;
    
    // Find the option that matches the current plan
    for (let option of select.options) {
      if (option.value !== 'unsubscribe') {
        const parts = option.value.split('-');
        const optionPlanId = parts[0];
        if (optionPlanId === String(currentPlanId)) {
          select.value = option.value;
          break;
        }
      }
    }
  }

  // subscribe button click
  function handleSubscribeButtonClick(event) {
    const button = event.target.closest('.cart-item__subscribe-button');
    if (!button) return;

    const variantId = button.dataset.variantId;
    const lineItemKey = button.dataset.lineItemKey;
    const itemId = button.dataset.itemId;
    const totalOptions = parseInt(button.dataset.totalOptions || '0', 10);
    const firstPlanId = button.dataset.firstPlanId;

    const itemRow = button.closest('.cart-item');
    if (!itemRow) return;

    const buttonWrapper = itemRow.querySelector('.cart-item__subscribe-button-wrapper');
    const optionsDiv = itemRow.querySelector('.cart-item__subscribe-options');
    const select = optionsDiv?.querySelector('.cart-item__subscribe-frequency-select');
    const subscriptionNameText = itemRow.querySelector('.cart-item__subscription-name');

    // If only one option, apply it directly without showing dropdown
    if (totalOptions === 1 && firstPlanId) {
      updateCartItemSellingPlan(lineItemKey, firstPlanId);
      return;
    }

    // If more than one option, show the dropdown
    if (totalOptions > 1) {
      // Show options and hide button
      if (buttonWrapper) {
        buttonWrapper.style.display = 'none';
      }

      if (optionsDiv) {
        optionsDiv.style.display = 'flex';
      }

      // Hide subscription name text when dropdown is shown
      if (subscriptionNameText) {
        subscriptionNameText.style.display = 'none';
      }

      // Apply the first/default selling plan option
      if (select && select.options.length > 0) {
        const firstOption = select.options[0];

        if (firstOption.value !== 'unsubscribe') {
          const selectedValue = firstOption.value;
          const parts = selectedValue.split('-');
          const sellingPlanId = parts[0];

          if (sellingPlanId) {
            select.value = selectedValue;
            updateCartItemSellingPlan(lineItemKey, sellingPlanId);
          }
        }
      }
    }
  }

  /**
   * Update cart item with selling plan
   */
  async function updateCartItemSellingPlan(lineItemKey, sellingPlanId) {
    try {
      const cartDrawerContainer = document.querySelector('cart-drawer');
      if (!cartDrawerContainer) {
        console.error('Cart drawer not found');
        return;
      }

      const body = JSON.stringify({
        id: lineItemKey,
        selling_plan: sellingPlanId || '',
        sections: ['cart-drawer'],
        sections_url: window.location.pathname
      });

      const response = await fetch(`${window.routes?.cart_change_url || '/cart/change'}.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body
      });

      if (!response.ok) {
        throw new Error(`Cart update failed: ${response.status}`);
      }

      const responseText = await response.text();
      const parsedState = JSON.parse(responseText);

      if (parsedState.errors) {
        console.error('Cart update errors:', parsedState.errors);
        return;
      }

      // Update cart drawer with new HTML
      if (parsedState.sections && parsedState.sections['cart-drawer']) {
        const parser = new DOMParser();
        const newCartDrawerHTML = parser.parseFromString(parsedState.sections['cart-drawer'], 'text/html');
        const newCartDrawer = newCartDrawerHTML.querySelector('#CartDrawer');

        if (newCartDrawer && typeof updateCartDrawer === 'function') {
          updateCartDrawer(cartDrawerContainer, newCartDrawer, false);
        }
      }

      await fetchCartData();
      
      setTimeout(() => {
        updateSubscribeButtons();
        attachEventListeners();
      }, 100);

    } catch (error) {
      console.error('Error updating cart item selling plan:', error);
    }
  }

  function handleFrequencySelectChange(event) {
    const select = event.target;
    if (!select || !select.classList.contains('cart-item__subscribe-frequency-select')) return;

    const variantId = select.dataset.variantId;
    const lineItemKey = select.dataset.lineItemKey;
    const itemId = select.dataset.itemId;
    const selectedValue = select.value;
    
    const itemRow = select.closest('.cart-item');
    if (!itemRow) return;

    const buttonWrapper = itemRow.querySelector('.cart-item__subscribe-button-wrapper');
    const optionsDiv = itemRow.querySelector('.cart-item__subscribe-options');
    const subscriptionNameText = itemRow.querySelector('.cart-item__subscription-name');
    
    if (selectedValue === 'unsubscribe') {
      updateCartItemSellingPlan(lineItemKey, '');

      if (buttonWrapper) {
        buttonWrapper.style.display = '';
      }

      if (optionsDiv) {
        optionsDiv.style.display = 'none';
      }

      if (subscriptionNameText) {
        subscriptionNameText.style.display = 'none';
      }
    } else {
      const parts = selectedValue.split('-');
      const sellingPlanId = parts[0]; // First part is the plan ID

      if (!sellingPlanId) {
        return;
      }

      updateCartItemSellingPlan(lineItemKey, sellingPlanId);
      
      // dropdown visible -  subscription name hidden
      const totalOptions = parseInt(optionsDiv?.dataset.totalOptions || '0', 10);
      if (totalOptions > 1 && subscriptionNameText) {
        subscriptionNameText.style.display = 'none';
      }
    }
  }

  function attachEventListeners() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    const buttons = cartDrawer.querySelectorAll('.cart-item__subscribe-button');
    const selects = cartDrawer.querySelectorAll('.cart-item__subscribe-frequency-select');

    buttons.forEach(button => {
      button.removeEventListener('click', handleSubscribeButtonClick);
      button.addEventListener('click', handleSubscribeButtonClick);
    });

    selects.forEach(select => {
      select.removeEventListener('change', handleFrequencySelectChange);
      select.addEventListener('change', handleFrequencySelectChange);
    });
  }

  function initEventListeners() {
    attachEventListeners();

    document.addEventListener('cart-drawer:render', () => {
      setTimeout(attachEventListeners, 100);
    });

    document.addEventListener('cart-drawer:update', () => {
      setTimeout(attachEventListeners, 100);
    });
  }

  function init() {
    setTimeout(() => {
      updateSubscribeButtons();
    }, 500);
    
    document.addEventListener('cart-drawer:update', () => {
      setTimeout(updateSubscribeButtons, 100);
    });
    
    document.addEventListener('cart-drawer:open', () => {
      setTimeout(updateSubscribeButtons, 100);
    });

    document.addEventListener('cart-drawer:render', () => {
      setTimeout(updateSubscribeButtons, 100);
    });

    document.addEventListener('cart-drawer:connected', () => {
      setTimeout(updateSubscribeButtons, 200);
    });
    
    if (window.PUB_SUB_EVENTS && window.PUB_SUB_EVENTS.cartUpdate) {
      document.addEventListener('cart:update', () => {
        setTimeout(updateSubscribeButtons, 100);
      });
    }

    initEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
