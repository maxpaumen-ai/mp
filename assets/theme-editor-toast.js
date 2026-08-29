// Theme Editor Toast
// Usage: ThemeEditorToast.show('Message'); or ThemeEditorToast.show('Saved', { duration: 2000 });
(function () {
  'use strict';

  if (typeof window.Shopify === 'undefined' || !window.Shopify.designMode) return;

  var CONTAINER_ID = 'theme-editor-toast-container';
  var DEFAULT_DURATION = 5000;

  function getContainer() {
    var el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.className = 'ElixirToast__container';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
    return el;
  }

  function show(message, options) {
    if (!message) return;
    options = options || {};
    var duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;
    var type = options.type || 'info';

    var container = getContainer();
    var toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.className = 'ElixirToast__toast ElixirToast__toast--' + type;
    toast.textContent = message;
    container.appendChild(toast);

    var remove = function () {
      toast.classList.add('ElixirToast__toast--out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    };

    if (duration > 0) setTimeout(remove, duration);
    return { dismiss: remove };
  }

  window.ThemeEditorToast = { show: show };
})();
