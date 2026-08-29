var productFormSelector = 'form[action*="cart/add"].product-buy-form-pdp';

function Elixir_ProductFormExists() {
    return document.querySelector(productFormSelector) !== null;
}

function Elixir_GetProductForm() {
    return document.querySelector(productFormSelector);
}

function Elixir_ProductFormHasItemsInputs() {
    var form = Elixir_GetProductForm();
    if (!form) return false;
    return form.querySelector('input[name^="items["]') !== null;
}

// Returns the variant ID from the product form. In single-variant mode uses input[name="id"]; in items[] mode (e.g. Quantity Break) uses the first items[X][id] value so price/context use the correct variant.
function Elixir_GetProductFormVariantId() {
    var form = Elixir_GetProductForm();
    if (!form) return null;
    var input = form.querySelector('input[name="id"]');
    if (input && input.value) return input.value;
    if (Elixir_ProductFormHasItemsInputs()) {
        var firstId = form.querySelector('input[name^="items["][name*="][id]"]');
        if (firstId && firstId.value) return firstId.value;
    }
    return null;
}

// Returns the selling plan ID from the product form (input[name="selling_plan"]), or null if missing/empty.
function Elixir_GetProductFormSellingPlan() {
    var form = Elixir_GetProductForm();
    if (!form) return null;
    var input = form.querySelector('input[name="selling_plan"]');
    return input && input.value ? input.value : null;
}

// Sets the selling plan on the product form. Creates input[name="selling_plan"] if missing.
// Pass null, undefined or '' to clear (one-time purchase). Dispatches input and change events.
function Elixir_SetProductFormSellingPlan(sellingPlanId) {
    var form = Elixir_GetProductForm();
    if (!form) return false;
    var value = (sellingPlanId !== undefined && sellingPlanId !== null && sellingPlanId !== '') ? String(sellingPlanId) : '';
    var input = form.querySelector('input[name="selling_plan"]');
    if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'selling_plan';
        form.appendChild(input);
    }
    input.value = value;
    input.setAttribute('value', value);
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    return true;
}

function Elixir_SetProductFormVariantId(variantId) {
    var form = Elixir_GetProductForm();
    if (!form) return false;
    var input = form.querySelector('input[name="id"]');
    if (input) {
        input.value = variantId !== undefined && variantId !== null && variantId !== '' ? String(variantId) : '';
        return true;
    }
    if (variantId === undefined || variantId === null || variantId === '') return true;
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'id';
    input.value = String(variantId);
    input.className = 'product-variant-id';
    form.appendChild(input);
    return true;
}

function Elixir_ProductFormSwitchToItemsMode(items, options) {
    var form = Elixir_GetProductForm();
    if (!form) return false;
    if (!items || !Array.isArray(items) || items.length === 0) return false;

    options = options || {};
    var containerClass = options.containerClass || 'product-form-items-container';
    var startIndex = options.startIndex !== undefined ? options.startIndex : 1;

    var existing = form.querySelector('.' + containerClass);
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.className = containerClass;

    items.forEach(function (item, i) {
        var index = startIndex + i;
        var idIn = document.createElement('input');
        idIn.type = 'hidden';
        idIn.name = 'items[' + index + '][id]';
        idIn.value = String(item.id);
        idIn.className = 'product-variant-id';
        container.appendChild(idIn);

        var qtyIn = document.createElement('input');
        qtyIn.type = 'hidden';
        qtyIn.name = 'items[' + index + '][quantity]';
        qtyIn.value = String(item.quantity != null ? item.quantity : 1);
        container.appendChild(qtyIn);

        if (item.selling_plan != null && item.selling_plan !== '') {
            var planIn = document.createElement('input');
            planIn.type = 'hidden';
            planIn.name = 'items[' + index + '][selling_plan]';
            planIn.value = String(item.selling_plan);
            container.appendChild(planIn);
        }

        if (item.properties && typeof item.properties === 'object') {
            Object.keys(item.properties).forEach(function (key) {
                var propIn = document.createElement('input');
                propIn.type = 'hidden';
                propIn.name = 'items[' + index + '][properties][' + key + ']';
                propIn.value = String(item.properties[key]);
                container.appendChild(propIn);
            });
        }
    });

    var mainIdInput = form.querySelector('input[name="id"]');
    if (mainIdInput) mainIdInput.remove();

    form.appendChild(container);
    return true;
}

function Elixir_ProductFormSwitchToSingleIdMode(variantId, itemsContainerSelector) {
    var form = Elixir_GetProductForm();
    if (!form) return false;

    if (itemsContainerSelector) {
        var container = form.querySelector(itemsContainerSelector);
        if (container && (variantId === undefined || variantId === null || variantId === '')) {
            var firstIdInput = container.querySelector('input[name^="items["][name*="][id]"]');
            if (firstIdInput && firstIdInput.value) variantId = firstIdInput.value;
        }
        if (container) container.remove();
    }

    var input = form.querySelector('input[name="id"]');
    if (input) {
        if (variantId !== undefined && variantId !== null && variantId !== '') input.value = String(variantId);
        return true;
    }
    if (variantId === undefined || variantId === null || variantId === '') return true;

    input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'id';
    input.value = String(variantId);
    input.className = 'product-variant-id';
    form.appendChild(input);
    return true;
}

function Elixir_InitProductFormQuantityListener() {
    document.addEventListener('change', function (e) {
        if (!e.target || e.target.name !== 'quantity') return;
        var form = Elixir_GetProductForm();
        if (!form || !form.contains(e.target)) return;
        var qty = parseInt(e.target.value, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        document.dispatchEvent(new CustomEvent('quantity:changed', {
            bubbles: true,
            detail: { quantity: qty }
        }));
    });
}
Elixir_InitProductFormQuantityListener();
