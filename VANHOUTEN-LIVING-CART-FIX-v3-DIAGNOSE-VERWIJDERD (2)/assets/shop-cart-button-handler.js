/*
 * VANHOUTEN LIVING — shop-cart-button-handler.js
 *
 * Bewust uitgeschakeld.
 *
 * Dit bestand onderschepte eerder zelfstandig alle
 * form[action*="/cart/add"] formulieren, deed event.preventDefault()
 * en startte daarna een tweede /cart/add + cartDrawer.renderContents()-flow.
 *
 * De winkelwagen wordt nu uitsluitend afgehandeld door de bestaande
 * Shopify / Elixir product-form + cart-drawer flow.
 *
 * Laat dit bestand verder leeg om dubbele add-to-cart requests en
 * concurrerende Cart Drawer renders te voorkomen.
 */
