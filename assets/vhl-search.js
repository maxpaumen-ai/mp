/* 14 okt 2026 — Zoeksuggesties onder de zoekbalk in de header (Ruben), naar voorbeeld van
   lissee-search.js bij Lissée Paris. Vanaf de eerste letter: collectie-chips, 6 producten met
   foto en prijs, en "Alle resultaten". Bron: /search/suggest.json (typo-tolerant).
   Opmaak: assets/vhl-search.css. Terugdraaien: beide bestanden en de twee regels onderaan
   sections/header.liquid weghalen. */
(function () {
  'use strict';
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var MIN = 1, DELAY = 150, LIMIT = 6, cache = {};

  function fmt(v) {
    v = Number(v) || 0;
    return '€' + v.toFixed(2).replace('.', ',');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(url) {
    return url ? url.replace(/(\.(jpg|jpeg|png|webp|gif))(\?.*)?$/i, '_160x160_crop_center$1$3') : '';
  }

  function build(form, input) {
    var box = document.createElement('div');
    box.className = 'vhl-ps';
    box.id = 'vhl-ps';
    box.hidden = true;
    box.setAttribute('role', 'listbox');
    form.appendChild(box);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'vhl-ps');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');

    var timer = null, controller = null, active = -1, lastQuery = '';

    function close() {
      box.hidden = true;
      box.innerHTML = '';
      active = -1;
      input.setAttribute('aria-expanded', 'false');
      form.classList.remove('has-suggestions');
    }
    function items() {
      return Array.prototype.slice.call(box.querySelectorAll('[data-ps-item]'));
    }
    function setActive(i) {
      var list = items();
      if (!list.length) return;
      if (i < 0) i = list.length - 1;
      if (i >= list.length) i = 0;
      list.forEach(function (el, n) {
        el.classList.toggle('is-active', n === i);
        el.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });
      active = i;
      list[i].scrollIntoView({ block: 'nearest' });
    }

    function render(q, data) {
      var r = (data && data.resources && data.resources.results) || {};
      var products = (r.products || []).slice(0, LIMIT);
      var collections = (r.collections || []).slice(0, 3);
      var html = '';
      if (collections.length) {
        html += '<div class="vhl-ps__chips">';
        collections.forEach(function (c) {
          html += '<a class="vhl-ps__chip" data-ps-item role="option" href="' + esc(c.url) + '">' + esc(c.title) + '</a>';
        });
        html += '</div>';
      }
      if (products.length) {
        html += '<div class="vhl-ps__list">';
        products.forEach(function (p) {
          var onSale = p.compare_at_price_max && Number(p.compare_at_price_max) > Number(p.price);
          html += '<a class="vhl-ps__item" data-ps-item role="option" href="' + esc(p.url) + '">' +
            (p.featured_image && p.featured_image.url
              ? '<img class="vhl-ps__img" src="' + esc(img(p.featured_image.url)) + '" alt="" loading="lazy" width="48" height="48">'
              : '<span class="vhl-ps__img"></span>') +
            '<span class="vhl-ps__body"><span class="vhl-ps__title">' + esc(p.title) + '</span>' +
            '<span class="vhl-ps__price">' + (onSale ? '<s>' + esc(fmt(p.compare_at_price_max)) + '</s> ' : '') + esc(fmt(p.price)) + '</span></span></a>';
        });
        html += '</div>';
      }
      if (!products.length && !collections.length) {
        html += '<p class="vhl-ps__empty">Geen resultaten voor ‘' + esc(q) + '’</p>';
      } else {
        html += '<a class="vhl-ps__all" data-ps-item role="option" href="' + root + 'search?q=' + encodeURIComponent(q) + '&type=product&options%5Bprefix%5D=last">Alle resultaten voor ‘' + esc(q) + '’</a>';
      }
      box.innerHTML = html;
      box.hidden = false;
      active = -1;
      input.setAttribute('aria-expanded', 'true');
      form.classList.add('has-suggestions');
    }

    /* Aanvulling: de suggestie-API van Shopify geeft bij één of twee letters vaak maar weinig
       producten terug. Daarom laden we één keer de productlijst (/products.json) en vullen we
       aan met producten waarvan een woord in de titel met de letters begint. */
    var index = null, indexLoading = null;
    function loadIndex() {
      if (index || indexLoading) return indexLoading;
      indexLoading = fetch(root + 'products.json?limit=250', { headers: { Accept: 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          index = ((data && data.products) || []).filter(function (p) {
            return (p.variants || []).some(function (v) { return v.available; });
          }).map(function (p) {
            var v = p.variants[0] || {};
            return {
              title: p.title, url: root + 'products/' + p.handle,
              price: v.price, compare_at_price_max: v.compare_at_price,
              featured_image: { url: p.images && p.images[0] ? p.images[0].src : '' },
              words: String(p.title).toLowerCase().split(/[^a-z0-9\u00c0-\u024f]+/)
            };
          });
        })
        .catch(function () { index = []; });
      return indexLoading;
    }
    function fill(q, data) {
      var r = data && data.resources && data.resources.results;
      if (!r || !index) return data;
      var have = (r.products || []).slice(0, LIMIT);
      if (have.length >= LIMIT) return data;
      var lq = q.toLowerCase(), seen = {};
      have.forEach(function (p) { seen[String(p.url).split('?')[0]] = true; });
      index.forEach(function (p) {
        if (have.length >= LIMIT || seen[p.url]) return;
        if (p.words.some(function (w) { return w.indexOf(lq) === 0; })) { have.push(p); seen[p.url] = true; }
      });
      r.products = have;
      return data;
    }

    function search(q) {
      lastQuery = q;
      if (cache[q]) { render(q, cache[q]); return; }
      if (controller) controller.abort();
      controller = new AbortController();
      var url = root + 'search/suggest.json?q=' + encodeURIComponent(q) +
        '&resources[type]=product,collection&resources[limit]=' + LIMIT +
        '&resources[options][unavailable_products]=hide' +
        '&resources[options][fields]=title,product_type,variants.title,vendor';
      fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (!data) return;
          return Promise.resolve(loadIndex()).then(function () { return data; });
        })
        .then(function (data) {
          if (!data || q !== lastQuery) return;
          data = fill(q, data);
          cache[q] = data;
          render(q, data);
        })
        .catch(function () {});
    }

    input.addEventListener('input', function () {
      var q = input.value.trim();
      clearTimeout(timer);
      if (q.length < MIN) { close(); return; }
      timer = setTimeout(function () { search(q); }, DELAY);
    });
    input.addEventListener('focus', function () {
      loadIndex();
      var q = input.value.trim();
      if (q.length >= MIN && box.hidden && cache[q]) render(q, cache[q]);
    });
    /* Capture-fase, vóór de Enter-handler van de header zelf: een gekozen suggestie wint. */
    input.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var el = items()[active];
        if (el) window.location.href = el.href;
      }
      else if (e.key === 'Escape') close();
    }, true);
    form.addEventListener('reset', close);
    document.addEventListener('click', function (e) {
      if (e.isTrusted === false) return;
      if (!form.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('shopify:section:load', close);
  }

  function init() {
    var forms = document.querySelectorAll('form.vhliso-search');
    Array.prototype.forEach.call(forms, function (form) {
      var input = form.querySelector('input[name="q"]');
      if (!input || form.querySelector('.vhl-ps')) return;
      if (window.getComputedStyle(form).position === 'static') form.style.position = 'relative';
      build(form, input);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
