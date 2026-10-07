/* =============================================
   STYLESTORE — main.js
   Cart, Wishlist, Filter, Toast, Modal, Header
   ============================================= */

// ─── CART STATE ───────────────────────────────
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('ss_cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
  } catch (e) { /* storage unavailable: keep cart in memory only */ }
  updateHeaderCart();
  updateShippingProgress();
}

function updateHeaderCart() {
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('#cartTotalHeader').forEach(el => el.textContent = '$' + total.toFixed(2));
  document.querySelectorAll('#cartCountHeader').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ─── ADD TO CART ───────────────────────────────
function addToCart(name, price, img, btnEl, qty = 1) {
  qty = Math.max(1, parseInt(qty, 10) || 1);
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name, price, img, qty, id: Date.now() });
  }
  saveCart();
  showToast(`"${name}" added to cart!`, 'success');

  // Button feedback
  if (btnEl) {
    const icon = btnEl.querySelector('i');
    if (icon) {
      icon.className = 'fa-solid fa-check';
      setTimeout(() => { icon.className = 'fa-solid fa-bag-shopping'; }, 1200);
    }
  }
  renderCart();
}

// ─── RENDER CART PAGE ──────────────────────────
function renderCart() {
  const listEl    = document.getElementById('cartItemsList');
  const emptyEl   = document.getElementById('emptyCart');
  const controlEl = document.getElementById('cartControls');
  const summaryEl = document.getElementById('orderSummary');
  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl)   emptyEl.style.display   = 'block';
    if (controlEl) controlEl.style.display = 'none';
    updateSummary();
    return;
  }

  if (emptyEl)   emptyEl.style.display   = 'none';
  if (controlEl) controlEl.style.display = 'flex';

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item" id="item-${item.id}">
      <img src="${item.img}" alt="${item.name}" />
      <div class="cart-item-info">
        <p class="cart-item-title">${item.name}</p>
        <p class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</p>
        <div class="qty-row">
          <button class="qty-btn-sm" onclick="changeItemQty(${item.id}, -1)" aria-label="Decrease">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn-sm" onclick="changeItemQty(${item.id}, 1)" aria-label="Increase">+</button>
          <button class="btn-remove" onclick="removeItem(${item.id})">
            <i class="fa-solid fa-trash-can"></i> Remove
          </button>
        </div>
      </div>
    </div>
  `).join('');

  updateSummary();
}

function changeItemQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
}

function removeItem(id) {
  const item = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  if (item) showToast(`"${item.name}" removed.`, 'error');
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  saveCart();
  renderCart();
  showToast('Cart cleared.', 'error');
}

// ─── ORDER SUMMARY ─────────────────────────────
let discountPercent = 0;

function updateSummary() {
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= 99 ? 0 : subtotal === 0 ? 0 : 9.99;
  const discount  = subtotal * discountPercent;
  const total     = subtotal - discount + shipping;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
set('summarySubtotal', '$' + subtotal.toFixed(2));
  set('summaryShipping', shipping === 0 ? (subtotal === 0 ? '$9.99' : 'FREE 🎉') : '$' + shipping.toFixed(2));
  set('summaryTotal',    '$' + total.toFixed(2));
  set('shippingRemain',  subtotal >= 99 ? 'You have free shipping!' : '$' + (99 - subtotal).toFixed(2));

  const discRow = document.getElementById('discountRow');
  if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';
  set('summaryDiscount', '-$' + discount.toFixed(2));

  // Checkout button state
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function handleCheckout() {
  if (cart.length === 0) return;
  showToast('Proceeding to checkout... (demo)', 'info');
}

function applyCoupon() {
  const code = (document.getElementById('couponInput')?.value || '').trim().toUpperCase();
  if (code === 'SAVE10') {
    discountPercent = 0.1;
    showToast('Coupon applied! 10% off.', 'success');
  } else if (code === 'SAVE20') {
    discountPercent = 0.2;
    showToast('Coupon applied! 20% off.', 'success');
  } else if (code === '') {
    showToast('Please enter a coupon code.', 'error');
    return;
  } else {
    showToast('Invalid coupon code.', 'error');
    return;
  }
  updateSummary();
}

// ─── SHIPPING PROGRESS ─────────────────────────
function updateShippingProgress() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fill = document.getElementById('progressFill');
  const remain = document.getElementById('shippingRemain');
  if (!fill) return;
  const pct = Math.min(100, (subtotal / 99) * 100);
  fill.style.width = pct + '%';
  if (remain) {
    remain.textContent = subtotal >= 99
      ? 'You\'ve got free shipping! 🎉'
      : '$' + (99 - subtotal).toFixed(2);
  }
}

// ─── WISHLIST ──────────────────────────────────
function toggleWishlist(btn) {
  const icon = btn.querySelector('i');
  const isWishlisted = btn.classList.contains('wishlisted');
  btn.classList.toggle('wishlisted');
  if (isWishlisted) {
    icon.className = 'fa-regular fa-heart';
    showToast('Removed from wishlist.', 'error');
  } else {
    icon.className = 'fa-solid fa-heart';
    showToast('Added to wishlist! ❤️', 'success');
  }
}

// ─── PRODUCT FILTER ────────────────────────────
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.product-item');
  const sortSel    = document.getElementById('sortSelect');
  if (!filterBtns.length) return;

  let activeFilter = 'all';

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilterSort(activeFilter, sortSel?.value || 'default');
    });
  });

  if (sortSel) {
    sortSel.addEventListener('change', () => {
      applyFilterSort(activeFilter, sortSel.value);
    });
  }
}

function applyFilterSort(filter, sort) {
  const grid  = document.getElementById('productsGrid');
  const items = Array.from(document.querySelectorAll('.product-item'));
  if (!grid) return;

  // Filter
  items.forEach(item => {
    const cat = item.dataset.category;
    item.classList.toggle('hidden', filter !== 'all' && cat !== filter);
  });

  // Sort
  const visible = items.filter(i => !i.classList.contains('hidden'));
  visible.sort((a, b) => {
    if (sort === 'price-asc')  return +a.dataset.price  - +b.dataset.price;
    if (sort === 'price-desc') return +b.dataset.price  - +a.dataset.price;
    if (sort === 'rating')     return +b.dataset.rating - +a.dataset.rating;
    return 0;
  });
  visible.forEach(item => grid.appendChild(item));
}

// ─── QUICK VIEW MODAL ──────────────────────────
 function openQuickView(name, price, img, desc) {
  document.getElementById('modalTitle').textContent  = name;
  document.getElementById('modalPrice').textContent  = '$' + price.toFixed(2);
  document.getElementById('modalImg').src             = img;
  document.getElementById('modalImg').alt             = name;
  document.getElementById('modalDesc').textContent    = desc;
  const addBtn = document.getElementById('modalAddCart');
  if (addBtn) {
    addBtn.onclick = () => { addToCart(name, price, img, addBtn); closeQuickView(); };
  }
  document.getElementById('quickViewModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  document.getElementById('quickViewModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', e => {
  const overlay = document.getElementById('quickViewModal');
  if (overlay && e.target === overlay) closeQuickView();
});

// ─── TOAST ─────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'default') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ─── HEADER SCROLL ─────────────────────────────
function initHeaderScroll() {
  const header = document.getElementById('headerElement');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ─── HAMBURGER MENU ────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const icon = btn.querySelector('i');
    if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!nav.classList.contains('open'));
  });
  // close when a menu link is tapped
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  // close when tapping outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  // reset when returning to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) setOpen(false);
  });
}

// ─── NEWSLETTER ────────────────────────────────
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }
  showToast('Subscribed successfully! Welcome! 🎉', 'success');
  if (document.getElementById('newsletterEmail')) {
    document.getElementById('newsletterEmail').value = '';
  }
}

// ─── SEARCH (basic client-side) ────────────────
function initSearch() {
  const btn   = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if (!btn || !input) return;

  const doSearch = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const items = document.querySelectorAll('.product-item');
    let found = 0;
    items.forEach(item => {
      const title = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const match = title.includes(q);
      item.classList.toggle('hidden', !match);
      if (match) found++;
    });
    if (found === 0) showToast(`No products found for "${q}"`, 'error');
    else showToast(`${found} product(s) found for "${q}"`, 'success');
    const shop = document.getElementById('shop');
    if (shop) shop.scrollIntoView({ behavior: 'smooth' });
  };

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

// ─── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderCart();
  updateShippingProgress();
  initFilters();
  initHeaderScroll();
  initHamburger();
  initSearch();
  renderCart();         // renders on cart.html; no-op on other pages
  updateSummary();
});