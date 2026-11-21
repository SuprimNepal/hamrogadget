/**
 * HamroGadget — Complete Client Application Engine
 * Bento Grid Product Storefront & Admin System for Nepal Market
 */

// ============================================================
// STATE MANAGEMENT
// ============================================================
const state = {
  products: [],
  categories: ['Laptops', 'Phones', 'Headphones', 'Smartwatches', 'Accessories', 'Other Tech'],
  currentView: 'home',
  currentCategory: null,
  currentProduct: null,
  filters: {
    search: '',
    brand: 'all',
    minPrice: '',
    maxPrice: '',
    availability: 'all',
    sort: 'newest'
  },
  adminToken: localStorage.getItem('hg_admin_token') || null,
  currentUser: JSON.parse(localStorage.getItem('hg_user') || 'null'),
  scrapedMedia: [],
  theme: localStorage.getItem('hg_theme') || 'light'
};

// Category SVG Icons
const CategoryIcons = {
  Laptops: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  Phones: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  Headphones: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
  Smartwatches: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="18" x="4" y="3" rx="4"/><path d="m9 3 .5-2h5l.5 2M9 21l.5 2h5l.5-2"/></svg>`,
  Accessories: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10m0 0 4-4m-4 4-4-4"/><rect width="16" height="8" x="4" y="14" rx="2"/></svg>`,
  'Other Tech': `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

// ============================================================
// UTILITIES
// ============================================================
function formatNPR(amount) {
  if (amount == null || isNaN(amount)) return 'NPR 0';
  return 'NPR ' + Number(amount).toLocaleString('en-NP');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function getApiUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  let basePath = window.location.pathname;
  if (basePath.endsWith('.php') || basePath.endsWith('.html')) {
    basePath = basePath.substring(0, basePath.lastIndexOf('/'));
  }
  basePath = basePath.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  return `${basePath}${cleanEndpoint}`;
}

async function apiRequest(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = state.adminToken || localStorage.getItem('hg_user_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = getApiUrl(endpoint);
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    throw err;
  }
}

function setupImageLazyLoading() {
  const images = document.querySelectorAll('.product-card-image img, .hero-card-img, .gallery-main img, .tech-gallery-card img');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          img.onload = () => img.classList.add('loaded');
          if (img.complete) img.classList.add('loaded');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });
    images.forEach(img => observer.observe(img));
  } else {
    images.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
      img.classList.add('loaded');
    });
  }
}

// ============================================================
// THEME MANAGEMENT
// ============================================================
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('hg_theme', state.theme);
      showToast(`Switched to ${state.theme} mode`, 'info');
    });
  }
}

// ============================================================
// AUTHENTICATION UI & STATE MANAGEMENT
// ============================================================
function updateAuthUI() {
  const authButtons = document.getElementById('auth-buttons-group');
  const userMenu = document.getElementById('user-menu-group');
  const drawerAuth = document.getElementById('drawer-auth-section');

  const isAdmin = state.adminToken || (state.currentUser && state.currentUser.role === 'admin');
  const user = state.currentUser;

  // Desktop Header
  if (user || isAdmin) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const name = user ? user.name : 'Administrator';
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

      userMenu.innerHTML = `
        ${isAdmin ? `
          <a href="#/admin" class="btn btn-sm btn-primary" style="background: var(--amber); border-color: var(--amber); color: #fff;">
            ★ Admin Panel
          </a>
        ` : `
          <div class="user-badge" title="${user.email}">
            <div class="user-avatar-circle">${initials}</div>
            <span>${name.split(' ')[0]}</span>
          </div>
        `}
        <button class="btn btn-sm btn-outline" onclick="handleUserLogout()" title="Sign Out">
          Sign Out
        </button>
      `;
    }
  } else {
    if (authButtons) {
      authButtons.style.display = 'flex';
      authButtons.innerHTML = `
        <button class="btn btn-sm btn-outline" id="nav-login-btn" onclick="openLoginModal()">Log In</button>
        <button class="btn btn-sm btn-primary" id="nav-signup-btn" onclick="openSignupModal()">Sign Up</button>
      `;
    }
    if (userMenu) {
      userMenu.style.display = 'none';
      userMenu.innerHTML = '';
    }
  }

  // Mobile Drawer
  if (drawerAuth) {
    if (user || isAdmin) {
      const name = user ? user.name : 'Admin';
      drawerAuth.innerHTML = `
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Signed in as <strong>${name}</strong></div>
        ${isAdmin ? `<a href="#/admin" class="btn btn-primary" style="width: 100%; text-align: center; justify-content: center;" onclick="closeDrawer()">Go to Admin Panel</a>` : ''}
        <button class="btn btn-outline" style="width: 100%;" onclick="handleUserLogout(); closeDrawer();">Sign Out</button>
      `;
    } else {
      drawerAuth.innerHTML = `
        <button class="btn btn-outline" style="width: 100%;" onclick="openLoginModal(); closeDrawer();">Log In</button>
        <button class="btn btn-primary" style="width: 100%;" onclick="openSignupModal(); closeDrawer();">Sign Up</button>
      `;
    }
  }
}

function handleUserLogout() {
  state.adminToken = null;
  state.currentUser = null;
  localStorage.removeItem('hg_admin_token');
  localStorage.removeItem('hg_user_token');
  localStorage.removeItem('hg_user');
  updateAuthUI();
  showToast('You have been signed out.', 'info');
  if (window.location.hash === '#/admin') {
    window.location.hash = '#/';
  } else {
    handleRoute();
  }
}

// ============================================================
// LOGIN MODAL (SMART: REDIRECTS ADMIN, AUTHENTICATES REGULAR)
// ============================================================
window.openLoginModal = function(prefillEmail = '') {
  openModal(`
    <div style="max-width: 400px; margin: 0 auto; padding: 12px 4px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">Welcome Back</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">Sign in to access your tech orders, reviews, or admin console</p>
      </div>

      <!-- Quick Demo Account Fillers -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 16px; font-size: 12px;">
        <div style="font-weight: 700; color: var(--accent); margin-bottom: 6px;">Quick Fill Demo Accounts:</div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-sm btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="fillLoginCredentials('admin12@gmail.com', 'admin12@')">
            ★ Admin Portal
          </button>
          <button type="button" class="btn btn-sm btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="fillLoginCredentials('member@gmail.com', 'member12@')">
            👤 Member User
          </button>
        </div>
      </div>

      <form id="unified-login-form">
        <div class="form-group">
          <label class="form-label">Email Address <span class="form-required">*</span></label>
          <input type="email" id="login-modal-email" class="form-input" placeholder="name@example.com" value="${prefillEmail}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="form-required">*</span></label>
          <input type="password" id="login-modal-password" class="form-input" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="btn btn-primary" id="login-submit-btn" style="width: 100%; padding: 11px; margin-top: 8px;">
          Sign In
        </button>
      </form>

      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px;">
        Don't have an account yet? 
        <a href="javascript:void(0)" onclick="openSignupModal()" style="color: var(--accent); font-weight: 700; text-decoration: underline;">
          Sign Up here
        </a>
      </div>
    </div>
  `);

  document.getElementById('unified-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-modal-email').value.trim();
    const password = document.getElementById('login-modal-password').value.trim();
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying credentials…';

      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Save session
      if (res.role === 'admin') {
        state.adminToken = res.token;
        state.currentUser = res.user;
        localStorage.setItem('hg_admin_token', res.token);
        localStorage.setItem('hg_user', JSON.stringify(res.user));
        closeModal();
        updateAuthUI();
        showToast('Welcome, Administrator! Redirecting to panel…', 'success');
        window.location.hash = '#/admin';
      } else {
        state.currentUser = res.user;
        state.adminToken = null;
        localStorage.setItem('hg_user_token', res.token);
        localStorage.setItem('hg_user', JSON.stringify(res.user));
        localStorage.removeItem('hg_admin_token');
        closeModal();
        updateAuthUI();
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        handleRoute();
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    }
  });
};

window.fillLoginCredentials = function(email, pass) {
  const eInput = document.getElementById('login-modal-email');
  const pInput = document.getElementById('login-modal-password');
  if (eInput) eInput.value = email;
  if (pInput) pInput.value = pass;
};

// ============================================================
// SIGN UP MODAL (POPUP ON SUCCESS, REQUIRES LOGIN)
// ============================================================
window.openSignupModal = function() {
  openModal(`
    <div style="max-width: 420px; margin: 0 auto; padding: 12px 4px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">Create an Account</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">Join HamroGadget to track orders, save bookmarks, and post reviews</p>
      </div>

      <form id="signup-form-element">
        <div class="form-group">
          <label class="form-label">Full Name <span class="form-required">*</span></label>
          <input type="text" id="signup-name" class="form-input" placeholder="e.g. Aayush Shrestha" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address <span class="form-required">*</span></label>
          <input type="email" id="signup-email" class="form-input" placeholder="name@example.com" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Password <span class="form-required">*</span></label>
            <input type="password" id="signup-password" class="form-input" placeholder="Min 6 chars" minlength="6" required>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm <span class="form-required">*</span></label>
            <input type="password" id="signup-confirm" class="form-input" placeholder="Repeat pass" required>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" id="signup-submit-btn" style="width: 100%; padding: 11px; margin-top: 10px;">
          Create HamroGadget Account
        </button>
      </form>

      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px;">
        Already have an account? 
        <a href="javascript:void(0)" onclick="openLoginModal()" style="color: var(--accent); font-weight: 700; text-decoration: underline;">
          Log In here
        </a>
      </div>
    </div>
  `);

  document.getElementById('signup-form-element')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const submitBtn = document.getElementById('signup-submit-btn');

    if (!name || !email || !password) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering account…';

      const res = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      // SUCCESS POPUP MODAL (DOES NOT auto-login, prompts user to log in)
      openModal(`
        <div style="text-align: center; padding: 28px 16px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(5,150,105,0.1); color: var(--emerald); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Account Created Successfully! 🎉</h3>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
            Your HamroGadget account for <strong>${email}</strong> has been created.<br>
            Please proceed to log in with your credentials to start browsing and shopping.
          </p>
          <button class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 15px;" onclick="openLoginModal('${email}')">
            Proceed to Log In &rarr;
          </button>
        </div>
      `);
    } catch (err) {
      showToast(err.message || 'Signup failed.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create HamroGadget Account';
      }
    }
  });
};

// ============================================================
// NAVIGATION & ROUTER
// ============================================================
function initNavigation() {
  const hamburger = document.getElementById('hamburger');
  const drawerClose = document.getElementById('drawer-close');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerOverlay = document.getElementById('nav-drawer-overlay');

  window.openDrawer = function() {
    if (navDrawer) navDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.add('open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
  };

  window.closeDrawer = function() {
    if (navDrawer) navDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  };

  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.drawer-links a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Global search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.hash = `#/category/all?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // Modal close handlers
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Routing
  window.addEventListener('hashchange', handleRoute);
}

function updateActiveNav(activeName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const navVal = link.getAttribute('data-nav');
    if (navVal === activeName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function handleRoute() {
  const hash = window.location.hash || '#/';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (hash.startsWith('#/product/')) {
    const id = hash.replace('#/product/', '').split('?')[0];
    renderProductDetail(id);
    updateActiveNav('');
  } else if (hash.startsWith('#/category/')) {
    const parts = hash.replace('#/category/', '').split('?');
    const category = decodeURIComponent(parts[0]);
    const queryString = parts[1] || '';
    renderCategoryPage(category, queryString);
    updateActiveNav(category);
  } else if (hash === '#/admin') {
    renderAdminPanel();
    updateActiveNav('');
  } else {
    renderHomePage();
    updateActiveNav('home');
  }
}

// ============================================================
// MODAL SYSTEM
// ============================================================
function openModal(contentHtml) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  body.innerHTML = contentHtml;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// VIEW: HOME PAGE (BENTO GRID HERO + SECTIONS + SCRAPED SHOWCASE)
// ============================================================
function renderHomePage() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const featured = state.products.filter(p => p.featured);
  const heroFeatured = featured[0] || state.products[0];
  const heroLaptops = state.products.find(p => p.category === 'Laptops' && p.id !== heroFeatured?.id) || state.products[1];
  const heroPhones = state.products.find(p => p.category === 'Phones' && p.id !== heroFeatured?.id) || state.products[2];
  const heroHeadphones = state.products.find(p => p.category === 'Headphones' && p.id !== heroFeatured?.id) || state.products[3];
  const heroWatches = state.products.find(p => p.category === 'Smartwatches' && p.id !== heroFeatured?.id) || state.products[4];

  // Hero Bento HTML
  const heroHtml = `
    <section class="hero-section">
      <div class="container">
        <div class="bento-grid hero-bento">
          <!-- Featured Main (2x2) -->
          ${heroFeatured ? `
            <a href="#/product/${heroFeatured.id}" class="bento-cell bento-2x2 hero-featured-float" style="animation-delay: 0.1s;">
              <img src="${heroFeatured.images[0]}" alt="${heroFeatured.name}" class="hero-card-img" loading="eager">
              <div class="hero-card-overlay">
                <span class="hero-card-badge">Featured Flagship</span>
                <h2 class="hero-card-title">${heroFeatured.name}</h2>
                <div class="hero-card-price">${formatNPR(heroFeatured.price)}</div>
              </div>
            </a>
          ` : ''}

          <!-- Laptops (1x1) -->
          ${heroLaptops ? `
            <a href="#/product/${heroLaptops.id}" class="bento-cell bento-1x1" style="animation-delay: 0.2s;">
              <img src="${heroLaptops.images[0]}" alt="${heroLaptops.name}" class="hero-card-img" loading="lazy">
              <div class="hero-card-overlay">
                <span class="hero-card-badge">Laptops</span>
                <h3 class="hero-card-title">${heroLaptops.name}</h3>
                <div class="hero-card-price">${formatNPR(heroLaptops.price)}</div>
              </div>
            </a>
          ` : ''}

          <!-- Phones (1x1) -->
          ${heroPhones ? `
            <a href="#/product/${heroPhones.id}" class="bento-cell bento-1x1" style="animation-delay: 0.3s;">
              <img src="${heroPhones.images[0]}" alt="${heroPhones.name}" class="hero-card-img" loading="lazy">
              <div class="hero-card-overlay">
                <span class="hero-card-badge">Smartphones</span>
                <h3 class="hero-card-title">${heroPhones.name}</h3>
                <div class="hero-card-price">${formatNPR(heroPhones.price)}</div>
              </div>
            </a>
          ` : ''}

          <!-- Headphones (1x1) -->
          ${heroHeadphones ? `
            <a href="#/product/${heroHeadphones.id}" class="bento-cell bento-1x1" style="animation-delay: 0.4s;">
              <img src="${heroHeadphones.images[0]}" alt="${heroHeadphones.name}" class="hero-card-img" loading="lazy">
              <div class="hero-card-overlay">
                <span class="hero-card-badge">Audio</span>
                <h3 class="hero-card-title">${heroHeadphones.name}</h3>
                <div class="hero-card-price">${formatNPR(heroHeadphones.price)}</div>
              </div>
            </a>
          ` : ''}

          <!-- Smartwatches (1x1) -->
          ${heroWatches ? `
            <a href="#/product/${heroWatches.id}" class="bento-cell bento-1x1" style="animation-delay: 0.5s;">
              <img src="${heroWatches.images[0]}" alt="${heroWatches.name}" class="hero-card-img" loading="lazy">
              <div class="hero-card-overlay">
                <span class="hero-card-badge">Wearables</span>
                <h3 class="hero-card-title">${heroWatches.name}</h3>
                <div class="hero-card-price">${formatNPR(heroWatches.price)}</div>
              </div>
            </a>
          ` : ''}
        </div>
      </div>
    </section>
  `;

  // Category Tiles
  const categoryTilesHtml = `
    <section class="categories-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Browse by Category</h2>
            <p class="section-subtitle">Genuine electronics with official Nepal distributor warranty</p>
          </div>
        </div>
        <div class="category-tiles">
          ${state.categories.map(cat => {
            const count = state.products.filter(p => p.category === cat).length;
            const icon = CategoryIcons[cat] || CategoryIcons['Other Tech'];
            return `
              <a href="#/category/${encodeURIComponent(cat)}" class="category-tile">
                <div class="category-tile-icon">${icon}</div>
                <div class="category-tile-name">${cat}</div>
                <div class="category-tile-count">${count} items</div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;

  // Featured Products
  const featuredList = state.products.filter(p => p.featured).slice(0, 8);
  const featuredHtml = `
    <section class="products-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Featured Highlights</h2>
            <p class="section-subtitle">Handpicked flagships and top-rated gadgets</p>
          </div>
          <a href="#/category/all" class="section-link">View All &rarr;</a>
        </div>
        <div class="product-grid">
          ${featuredList.map(renderProductCard).join('')}
        </div>
      </div>
    </section>
  `;

  // Scraped Media Gallery Showcase
  const scrapedShowcaseItems = [
    { title: 'Sony PlayStation 5 Slim Edition', tag: 'Official Nepal Launch', img: 'https://media.gadgetbytenepal.com/2022/11/Sony-PlayStation-5-Slim-price-in-Nepal.jpg', cat: 'Other Tech' },
    { title: 'REDMAGIC 12 Pro Gaming Beast', tag: 'Esports Review', img: 'https://media.gadgetbytenepal.com/2026/11/REDMAGIC-12-Pro-Price-in-Nepal-.jpg', cat: 'Phones' },
    { title: 'Lenovo IdeaPad Slim 3 (2026)', tag: 'Student Top Pick', img: 'https://media.gadgetbytenepal.com/2026/11/Lenovo-IdeaPad-Slim-3-2026-Price-in-Nepal.jpg', cat: 'Laptops' },
    { title: 'OnePlus Nord Buds 4 Pro', tag: 'Hi-Res Audio', img: 'https://media.gadgetbytenepal.com/2026/11/Oneplus-Nord-Buds-4-Pro-Review.jpg', cat: 'Headphones' },
    { title: 'Huawei Watch Air Ultra-Thin', tag: 'Titanium Smartwatch', img: 'https://media.gadgetbytenepal.com/2026/11/Huawei-Watch-Air-Rumors.jpg', cat: 'Smartwatches' },
    { title: 'Xiaomi Sound Party RGB', tag: '50W Party Speaker', img: 'https://media.gadgetbytenepal.com/2026/11/Xiaomi-Sound-Party.png', cat: 'Headphones' },
    { title: 'Samsung Galaxy S26 Ultra Leaks', tag: 'Nepal Exclusive', img: 'https://media.gadgetbytenepal.com/2026/11/Samsung-Galaxy-S26-Ultra.png', cat: 'Phones' },
    { title: 'Sharp Aquos Sense 11 OLED', tag: 'Japanese Tech', img: 'https://media.gadgetbytenepal.com/2026/11/Sharp-Aquos-Sense11-Price-in-Nepal.jpg', cat: 'Phones' },
    { title: 'Best Laptops for Students', tag: '2026 Buying Guide', img: 'https://media.gadgetbytenepal.com/2026/11/Best-laptop-for-students-in-Nepal-1.jpg', cat: 'Laptops' },
    { title: 'Xiaomi Smart Band 11', tag: '21-Day Battery', img: 'https://media.gadgetbytenepal.com/2026/09/Xiaomi-Smart-Band-11-Price-Nepal-1.jpg', cat: 'Smartwatches' },
    { title: 'CMF Buds Pro 2 with Dial', tag: 'Nothing Acoustic', img: 'https://media.gadgetbytenepal.com/2026/11/CMF-Clip-Pro-review.jpg', cat: 'Headphones' },
    { title: 'Apple 20th Anniversary Edition', tag: 'Flagship Rumor', img: 'https://media.gadgetbytenepal.com/2026/11/Apple-20th-anniversary-iPhone.png', cat: 'Phones' }
  ];

  const techGalleryHtml = `
    <section class="tech-gallery-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Nepal Tech Media & Verified Reviews</h2>
            <p class="section-subtitle">Real authentic photography from Nepal's premier tech portal tests</p>
          </div>
          <span class="badge badge-category" style="padding: 6px 12px; font-size: 12px;">1,040+ Scraped Photos</span>
        </div>
        <div class="tech-gallery-grid">
          ${scrapedShowcaseItems.map(item => `
            <div class="tech-gallery-card" onclick="window.location.hash='#/category/${encodeURIComponent(item.cat)}'">
              <img data-src="${item.img}" alt="${item.title}" loading="lazy">
              <div class="tech-gallery-overlay">
                <div>
                  <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; color: var(--amber); font-weight: 700;">${item.tag}</div>
                  <div style="font-size: 13px; font-weight: 700;">${item.title}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  // New Arrivals
  const newArrivals = [...state.products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const newArrivalsHtml = `
    <section class="products-section" style="padding: 48px 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">New Arrivals in Nepal</h2>
            <p class="section-subtitle">Freshly stocked authentic technology hardware</p>
          </div>
        </div>
        <div class="product-grid">
          ${newArrivals.map(renderProductCard).join('')}
        </div>
      </div>
    </section>
  `;

  // Trust Strip
  const trustStripHtml = `
    <section class="trust-strip">
      <div class="container">
        <div class="trust-items">
          <div class="trust-item">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="trust-title">100% Genuine Tech</div>
            <div class="trust-desc">Direct authorized distributor stock with genuine serial numbers.</div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="trust-title">Official Warranty</div>
            <div class="trust-desc">Up to 2 years official warranty backed by authorized service centers.</div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <div class="trust-title">VAT Bill Guaranteed</div>
            <div class="trust-desc">Clean commercial invoicing for individuals and corporate purchases.</div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 18h6"/></svg>
            </div>
            <div class="trust-title">Nepal-Wide Delivery</div>
            <div class="trust-desc">Express delivery across Kathmandu, Pokhara, Chitwan, and all 7 provinces.</div>
          </div>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = heroHtml + categoryTilesHtml + featuredHtml + techGalleryHtml + newArrivalsHtml + trustStripHtml;
  setupImageLazyLoading();
}

// Product Card HTML
function renderProductCard(p) {
  const stockClass = p.availability === 'In Stock' ? 'badge-stock-in' : (p.availability === 'Pre-Order' ? 'badge-stock-pre' : 'badge-stock-out');
  return `
    <div class="product-card" onclick="window.location.hash='#/product/${p.id}'" role="button" tabindex="0">
      <div class="product-card-image">
        <div class="product-card-badges">
          <span class="badge badge-category">${p.category}</span>
          <span class="badge ${stockClass}">${p.availability}</span>
          ${p.discountPrice ? `<span class="badge badge-discount">Save ${formatNPR(p.price - p.discountPrice)}</span>` : ''}
        </div>
        <img data-src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-card-body">
        <div class="product-card-brand">${p.brand}</div>
        <h3 class="product-card-name">${p.name}</h3>
        <p class="product-card-desc">${p.shortDescription || ''}</p>
        <div class="product-card-price">
          <span class="price-current">${formatNPR(p.discountPrice || p.price)}</span>
          ${p.discountPrice ? `<span class="price-original">${formatNPR(p.price)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// VIEW: CATEGORY / LISTING PAGE (WITH FILTERS)
// ============================================================
function renderCategoryPage(category, queryString = '') {
  const container = document.getElementById('main-content');
  if (!container) return;

  const urlParams = new URLSearchParams(queryString);
  const currentSearch = urlParams.get('search') || '';
  const currentBrand = urlParams.get('brand') || 'all';
  const currentMinPrice = urlParams.get('minPrice') || '';
  const currentMaxPrice = urlParams.get('maxPrice') || '';
  const currentAvailability = urlParams.get('availability') || 'all';
  const currentSort = urlParams.get('sort') || 'newest';

  // Filter products
  let filtered = [...state.products];
  if (category && category.toLowerCase() !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (currentBrand && currentBrand !== 'all') {
    filtered = filtered.filter(p => p.brand.toLowerCase() === currentBrand.toLowerCase());
  }
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q)
    );
  }
  if (currentMinPrice) filtered = filtered.filter(p => p.price >= Number(currentMinPrice));
  if (currentMaxPrice) filtered = filtered.filter(p => p.price <= Number(currentMaxPrice));
  if (currentAvailability && currentAvailability !== 'all') {
    filtered = filtered.filter(p => p.availability === currentAvailability);
  }

  // Sort
  if (currentSort === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (currentSort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  // Extract available brands for this category
  const baseCategoryProducts = category && category.toLowerCase() !== 'all'
    ? state.products.filter(p => p.category.toLowerCase() === category.toLowerCase())
    : state.products;
  const brands = Array.from(new Set(baseCategoryProducts.map(p => p.brand))).filter(Boolean);

  const title = category && category.toLowerCase() !== 'all' ? category : 'All Products';

  const html = `
    <div class="category-page">
      <div class="container">
        <div class="category-page-header">
          <h1 class="category-page-title">${title} in Nepal</h1>
          <div class="category-page-count">Showing ${filtered.length} products</div>
        </div>

        <div class="category-layout">
          <!-- Sidebar Filters -->
          <aside class="filters-sidebar">
            <!-- Search -->
            <div class="filter-group">
              <label class="filter-group-title">Search</label>
              <input type="text" class="filter-input" id="filter-search" placeholder="Search in ${title}…" value="${currentSearch}">
            </div>

            <!-- Sort -->
            <div class="filter-group">
              <label class="filter-group-title">Sort By</label>
              <select class="filter-select" id="filter-sort">
                <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Newest Arrivals</option>
                <option value="price-asc" ${currentSort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                <option value="price-desc" ${currentSort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              </select>
            </div>

            <!-- Price Range -->
            <div class="filter-group">
              <label class="filter-group-title">Price Range (NPR)</label>
              <div class="price-range-row">
                <input type="number" class="filter-input" id="filter-min-price" placeholder="Min" value="${currentMinPrice}">
                <span class="price-range-sep">–</span>
                <input type="number" class="filter-input" id="filter-max-price" placeholder="Max" value="${currentMaxPrice}">
              </div>
            </div>

            <!-- Availability -->
            <div class="filter-group">
              <label class="filter-group-title">Availability</label>
              <select class="filter-select" id="filter-availability">
                <option value="all" ${currentAvailability === 'all' ? 'selected' : ''}>All Availability</option>
                <option value="In Stock" ${currentAvailability === 'In Stock' ? 'selected' : ''}>In Stock</option>
                <option value="Pre-Order" ${currentAvailability === 'Pre-Order' ? 'selected' : ''}>Pre-Order</option>
                <option value="Out of Stock" ${currentAvailability === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
              </select>
            </div>

            <!-- Brand Filter -->
            <div class="filter-group">
              <label class="filter-group-title">Brand</label>
              <div class="brand-chips">
                <button class="brand-chip ${currentBrand === 'all' ? 'active' : ''}" data-brand="all">All</button>
                ${brands.map(b => `
                  <button class="brand-chip ${currentBrand.toLowerCase() === b.toLowerCase() ? 'active' : ''}" data-brand="${b}">${b}</button>
                `).join('')}
              </div>
            </div>

            <button class="btn btn-sm btn-outline" style="width: 100%; margin-top: 12px;" id="reset-filters-btn">Reset All Filters</button>
          </aside>

          <!-- Main Product Grid Area -->
          <div class="category-main">
            <!-- Active Filter Chips -->
            <div class="active-filters">
              ${currentSearch ? `<span class="active-filter-tag">Search: "${currentSearch}" <button onclick="removeFilter('search')">&times;</button></span>` : ''}
              ${currentBrand !== 'all' ? `<span class="active-filter-tag">Brand: ${currentBrand} <button onclick="removeFilter('brand')">&times;</button></span>` : ''}
              ${currentMinPrice ? `<span class="active-filter-tag">Min: NPR ${currentMinPrice} <button onclick="removeFilter('minPrice')">&times;</button></span>` : ''}
              ${currentMaxPrice ? `<span class="active-filter-tag">Max: NPR ${currentMaxPrice} <button onclick="removeFilter('maxPrice')">&times;</button></span>` : ''}
              ${currentAvailability !== 'all' ? `<span class="active-filter-tag">${currentAvailability} <button onclick="removeFilter('availability')">&times;</button></span>` : ''}
            </div>

            ${filtered.length > 0 ? `
              <div class="product-grid" style="grid-template-columns: repeat(3, 1fr);">
                ${filtered.map(renderProductCard).join('')}
              </div>
            ` : `
              <div style="text-align: center; padding: 64px 20px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius);">
                <p style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">No products match your filters</p>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">Try clearing some filters or searching with different keywords.</p>
                <button class="btn btn-primary" onclick="removeFilter('all')">Clear All Filters</button>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupImageLazyLoading();

  // Attach filter event listeners
  function applyFilters() {
    const s = document.getElementById('filter-search')?.value.trim();
    const sort = document.getElementById('filter-sort')?.value;
    const min = document.getElementById('filter-min-price')?.value;
    const max = document.getElementById('filter-max-price')?.value;
    const avail = document.getElementById('filter-availability')?.value;

    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (currentBrand && currentBrand !== 'all') params.set('brand', currentBrand);
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
    if (avail && avail !== 'all') params.set('availability', avail);
    if (sort && sort !== 'newest') params.set('sort', sort);

    const newQuery = params.toString();
    window.location.hash = `#/category/${encodeURIComponent(category)}${newQuery ? '?' + newQuery : ''}`;
  }

  // Brand chips click
  document.querySelectorAll('.brand-chips .brand-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const b = btn.getAttribute('data-brand');
      const params = new URLSearchParams(queryString);
      if (b === 'all') params.delete('brand');
      else params.set('brand', b);
      const newQuery = params.toString();
      window.location.hash = `#/category/${encodeURIComponent(category)}${newQuery ? '?' + newQuery : ''}`;
    });
  });

  // Debounced search
  let timer;
  const searchEl = document.getElementById('filter-search');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 350);
    });
  }

  document.getElementById('filter-sort')?.addEventListener('change', applyFilters);
  document.getElementById('filter-min-price')?.addEventListener('change', applyFilters);
  document.getElementById('filter-max-price')?.addEventListener('change', applyFilters);
  document.getElementById('filter-availability')?.addEventListener('change', applyFilters);

  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    window.location.hash = `#/category/${encodeURIComponent(category)}`;
  });
}

window.removeFilter = function(filterKey) {
  const parts = (window.location.hash || '').split('?');
  const base = parts[0];
  const params = new URLSearchParams(parts[1] || '');

  if (filterKey === 'all') {
    window.location.hash = base;
    return;
  }
  params.delete(filterKey);
  const newQuery = params.toString();
  window.location.hash = `${base}${newQuery ? '?' + newQuery : ''}`;
};

// ============================================================
// VIEW: PRODUCT DETAIL PAGE
// ============================================================
function renderProductDetail(productId) {
  const container = document.getElementById('main-content');
  if (!container) return;

  const product = state.products.find(p => p.id === productId);
  if (!product) {
    container.innerHTML = `
      <div class="container" style="padding: 64px 20px; text-align: center;">
        <h2>Product Not Found</h2>
        <p style="color: var(--text-muted); margin: 12px 0 24px;">The gadget you are looking for does not exist or has been removed.</p>
        <a href="#/" class="btn btn-primary">Return to Storefront</a>
      </div>
    `;
    return;
  }

  const related = state.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const stockBadgeClass = product.availability === 'In Stock' ? 'badge-stock-in' : (product.availability === 'Pre-Order' ? 'badge-stock-pre' : 'badge-stock-out');

  const html = `
    <div class="product-detail">
      <div class="container">
        <!-- Breadcrumb -->
        <nav style="margin-bottom: 24px; font-size: 13px; color: var(--text-muted);">
          <a href="#/" style="color: var(--accent);">Home</a> &rsaquo;
          <a href="#/category/${encodeURIComponent(product.category)}" style="color: var(--accent);">${product.category}</a> &rsaquo;
          <span>${product.name}</span>
        </nav>

        <div class="product-detail-layout">
          <!-- Gallery -->
          <div class="product-gallery">
            <div class="gallery-main">
              <img id="main-product-image" src="${product.images[0]}" alt="${product.name}">
            </div>
            ${product.images.length > 1 ? `
              <div class="gallery-thumbs">
                ${product.images.map((img, idx) => `
                  <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
                    <img src="${img}" alt="${product.name} thumbnail ${idx + 1}">
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Info -->
          <div class="product-info">
            <div class="product-info-brand">${product.brand}</div>
            <h1 class="product-info-name">${product.name}</h1>
            <p class="product-info-desc">${product.shortDescription || ''}</p>

            <div class="product-info-price">
              <span class="price-current">${formatNPR(product.discountPrice || product.price)}</span>
              ${product.discountPrice ? `<span class="price-original">${formatNPR(product.price)}</span>` : ''}
            </div>

            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 24px;">
              <span class="badge ${stockBadgeClass}" style="padding: 6px 12px; font-size: 12px;">${product.availability}</span>
              ${product.warranty ? `
                <span class="product-info-warranty">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ${product.warranty} Official Warranty
                </span>
              ` : ''}
            </div>

            <!-- Features -->
            ${product.features && product.features.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 class="specs-title">Key Highlights</h3>
                <ul class="features-list">
                  ${product.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- Specs Table -->
            ${product.specs && Object.keys(product.specs).length > 0 ? `
              <div class="specs-section">
                <h3 class="specs-title">Technical Specifications</h3>
                <table class="specs-table">
                  <tbody>
                    ${Object.entries(product.specs).map(([k, v]) => `
                      <tr>
                        <td>${formatSpecKey(k)}</td>
                        <td>${v}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Tags -->
            ${product.tags && product.tags.length > 0 ? `
              <div class="product-tags">
                ${product.tags.map(t => `<span class="product-tag">#${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Related Products -->
        ${related.length > 0 ? `
          <div class="related-section">
            <div class="section-header">
              <h2 class="section-title">Similar ${product.category} in Nepal</h2>
            </div>
            <div class="product-grid">
              ${related.map(renderProductCard).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupImageLazyLoading();
}

function formatSpecKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

window.switchGalleryImage = function(src, thumbEl) {
  const main = document.getElementById('main-product-image');
  if (main) main.src = src;
  document.querySelectorAll('.gallery-thumb').forEach(el => el.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
};

// ============================================================
// VIEW: ADMIN PANEL (MANAGEMENT & CRUD)
// ============================================================
function renderAdminPanel() {
  const container = document.getElementById('main-content');
  if (!container) return;

  if (!state.adminToken) {
    container.innerHTML = `
      <div class="container" style="padding: 64px 20px; text-align: center;">
        <div style="max-width: 440px; margin: 0 auto; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 36px 24px;">
          <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Administrator Access Required</h2>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">
            Please sign in with administrator credentials (<strong>admin12@gmail.com</strong>) to access the product catalog management console.
          </p>
          <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="openLoginModal('admin12@gmail.com')">
            Sign In as Admin
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Authenticated Admin Dashboard
  container.innerHTML = `
    <div class="admin-panel">
      <div class="container">
        <div class="admin-header">
          <div>
            <h1 class="admin-title">Product Catalog Management</h1>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Signed in as <strong>admin12@gmail.com</strong></p>
          </div>
          <div class="admin-actions">
            <button class="btn btn-primary" onclick="openAddProductModal()">+ Add New Product</button>
            <button class="btn btn-outline" onclick="handleUserLogout()">Logout</button>
          </div>
        </div>

        <div class="admin-table-wrapper">
          <div class="admin-search">
            <input type="text" id="admin-filter-search" placeholder="Search catalog by name, brand, category, or specs…">
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price (NPR)</th>
                <th>Stock Status</th>
                <th>Featured</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-products-tbody">
              <!-- Rendered via renderAdminTableRows -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderAdminTableRows();

  const searchInput = document.getElementById('admin-filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      renderAdminTableRows(q);
    });
  }
}

function renderAdminTableRows(filterQuery = '') {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  let items = [...state.products];
  if (filterQuery) {
    items = items.filter(p =>
      p.name.toLowerCase().includes(filterQuery) ||
      p.brand.toLowerCase().includes(filterQuery) ||
      p.category.toLowerCase().includes(filterQuery)
    );
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">No products found</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${p.images[0] || ''}" alt="" class="admin-thumb">
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${p.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${p.brand}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-category">${p.category}</span></td>
      <td>
        <div style="font-weight: 600;">${formatNPR(p.price)}</div>
        ${p.discountPrice ? `<div style="font-size: 11px; color: var(--red);">Discount: ${formatNPR(p.discountPrice)}</div>` : ''}
      </td>
      <td>
        <button class="admin-toggle-btn ${p.availability === 'In Stock' ? 'active' : ''}" onclick="toggleStockStatus('${p.id}')">
          ${p.availability}
        </button>
      </td>
      <td>
        <button class="admin-toggle-btn ${p.featured ? 'active' : ''}" onclick="toggleFeaturedStatus('${p.id}')">
          ${p.featured ? '★ Featured' : '☆ Standard'}
        </button>
      </td>
      <td style="text-align: right;">
        <div class="admin-table-actions" style="justify-content: flex-end;">
          <button class="edit-btn" onclick="openEditProductModal('${p.id}')" title="Edit">✏️ Edit</button>
          <button class="delete-btn" onclick="confirmDeleteProduct('${p.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Toggle Stock / Featured
window.toggleStockStatus = async function(id) {
  try {
    const updated = await apiRequest(`/api/products/${id}/stock`, { method: 'PATCH' });
    const idx = state.products.findIndex(p => p.id === id);
    if (idx !== -1) state.products[idx] = updated;
    renderAdminTableRows();
    showToast(`Stock updated: ${updated.availability}`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update stock', 'error');
  }
};

window.toggleFeaturedStatus = async function(id) {
  try {
    const updated = await apiRequest(`/api/products/${id}/featured`, { method: 'PATCH' });
    const idx = state.products.findIndex(p => p.id === id);
    if (idx !== -1) state.products[idx] = updated;
    renderAdminTableRows();
    showToast(`Featured: ${updated.featured ? 'Yes' : 'No'}`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update featured', 'error');
  }
};

window.confirmDeleteProduct = function(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  if (confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
    apiRequest(`/api/products/${id}`, { method: 'DELETE' })
      .then(() => {
        state.products = state.products.filter(p => p.id !== id);
        renderAdminTableRows();
        showToast('Product deleted from catalog', 'success');
      })
      .catch(err => showToast(err.message || 'Failed to delete', 'error'));
  }
};

// ============================================================
// ADMIN: ADD / EDIT PRODUCT MODAL WITH DYNAMIC SPECS
// ============================================================
window.openAddProductModal = function() {
  openProductFormModal(null);
};

window.openEditProductModal = function(id) {
  const p = state.products.find(item => item.id === id);
  if (p) openProductFormModal(p);
};

function getSpecFieldsForCategory(cat, currentSpecs = {}) {
  switch (cat) {
    case 'Laptops':
      return [
        { key: 'processor', label: 'Processor (CPU)', val: currentSpecs.processor || '' },
        { key: 'ram', label: 'RAM', val: currentSpecs.ram || '' },
        { key: 'storage', label: 'Storage', val: currentSpecs.storage || '' },
        { key: 'display', label: 'Display Specs', val: currentSpecs.display || '' },
        { key: 'gpu', label: 'Graphics (GPU)', val: currentSpecs.gpu || '' },
        { key: 'battery', label: 'Battery', val: currentSpecs.battery || '' },
        { key: 'os', label: 'Operating System', val: currentSpecs.os || '' },
        { key: 'ports', label: 'Ports', val: currentSpecs.ports || '' },
        { key: 'weight', label: 'Weight', val: currentSpecs.weight || '' }
      ];
    case 'Phones':
      return [
        { key: 'display', label: 'Display', val: currentSpecs.display || '' },
        { key: 'chipset', label: 'Chipset', val: currentSpecs.chipset || '' },
        { key: 'ram', label: 'RAM / Storage', val: currentSpecs.ram || '' },
        { key: 'camera', label: 'Camera System', val: currentSpecs.camera || '' },
        { key: 'battery', label: 'Battery Capacity', val: currentSpecs.battery || '' },
        { key: 'charging', label: 'Fast Charging', val: currentSpecs.charging || '' },
        { key: 'os', label: 'OS Version', val: currentSpecs.os || '' }
      ];
    case 'Headphones':
      return [
        { key: 'type', label: 'Type (Over-ear/In-ear)', val: currentSpecs.type || '' },
        { key: 'driver', label: 'Driver Size', val: currentSpecs.driver || '' },
        { key: 'connectivity', label: 'Connectivity', val: currentSpecs.connectivity || '' },
        { key: 'batteryLife', label: 'Battery Life', val: currentSpecs.batteryLife || '' },
        { key: 'noiseCancellation', label: 'Noise Cancellation', val: currentSpecs.noiseCancellation || '' },
        { key: 'microphone', label: 'Microphone', val: currentSpecs.microphone || '' },
        { key: 'weight', label: 'Weight', val: currentSpecs.weight || '' }
      ];
    case 'Smartwatches':
      return [
        { key: 'display', label: 'Display', val: currentSpecs.display || '' },
        { key: 'processor', label: 'Processor', val: currentSpecs.processor || '' },
        { key: 'battery', label: 'Battery Life', val: currentSpecs.battery || '' },
        { key: 'connectivity', label: 'Connectivity (GPS/LTE)', val: currentSpecs.connectivity || '' },
        { key: 'waterResistance', label: 'Water Resistance', val: currentSpecs.waterResistance || '' },
        { key: 'sensors', label: 'Health Sensors', val: currentSpecs.sensors || '' }
      ];
    case 'Accessories':
      return [
        { key: 'type', label: 'Accessory Type', val: currentSpecs.type || '' },
        { key: 'connectivity', label: 'Connectivity', val: currentSpecs.connectivity || '' },
        { key: 'battery', label: 'Battery / Power', val: currentSpecs.battery || '' },
        { key: 'compatibility', label: 'Device Compatibility', val: currentSpecs.compatibility || '' },
        { key: 'weight', label: 'Weight', val: currentSpecs.weight || '' }
      ];
    default:
      return [
        { key: 'type', label: 'Product Type', val: currentSpecs.type || '' },
        { key: 'specs', label: 'Key Specifications', val: currentSpecs.specs || '' }
      ];
  }
}

function openProductFormModal(product = null) {
  const isEdit = !!product;
  const initialCategory = product?.category || 'Laptops';
  const initialSpecs = product?.specs || {};
  const initialImages = product?.images?.length ? product.images : ['https://media.gadgetbytenepal.com/2026/11/best-laptop-in-every-price-segment.jpg'];
  const initialFeatures = product?.features?.length ? product.features : ['100% Genuine authorized distributor stock with official VAT bill'];

  const modalHtml = `
    <div style="max-height: 80vh; overflow-y: auto; padding: 12px 4px;">
      <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">
        ${isEdit ? 'Edit Product: ' + product.name : 'Add New Tech Product'}
      </h2>

      <form id="product-form">
        <!-- Basic Info -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Product Name <span class="form-required">*</span></label>
            <input type="text" id="p-name" class="form-input" value="${product?.name || ''}" placeholder="e.g. MacBook Air M4" required>
          </div>
          <div class="form-group">
            <label class="form-label">Brand <span class="form-required">*</span></label>
            <input type="text" id="p-brand" class="form-input" value="${product?.brand || ''}" placeholder="e.g. Apple, Dell, Sony" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Category <span class="form-required">*</span></label>
            <select id="p-category" class="form-input" required>
              ${state.categories.map(c => `
                <option value="${c}" ${c === initialCategory ? 'selected' : ''}>${c}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Price (NPR) <span class="form-required">*</span></label>
            <input type="number" id="p-price" class="form-input" value="${product?.price || ''}" placeholder="e.g. 150000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Discount Price (NPR)</label>
            <input type="number" id="p-discount" class="form-input" value="${product?.discountPrice || ''}" placeholder="Optional">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Stock Availability</label>
            <select id="p-availability" class="form-input">
              <option value="In Stock" ${product?.availability === 'In Stock' ? 'selected' : ''}>In Stock</option>
              <option value="Pre-Order" ${product?.availability === 'Pre-Order' ? 'selected' : ''}>Pre-Order</option>
              <option value="Out of Stock" ${product?.availability === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Official Warranty</label>
            <input type="text" id="p-warranty" class="form-input" value="${product?.warranty || '1 Year Authorized'}" placeholder="e.g. 1 Year">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Short Description</label>
          <textarea id="p-desc" class="form-input" rows="2" placeholder="Brief 1-2 sentence overview">${product?.shortDescription || ''}</textarea>
        </div>

        <!-- Dynamic Category Specs -->
        <div style="margin: 20px 0; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius); border: 1px solid var(--border);">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--accent);">Category-Specific Specs (<span id="cat-specs-label">${initialCategory}</span>)</h4>
          <div id="dynamic-specs-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Image URLs -->
        <div class="form-group">
          <label class="form-label">Image URLs (Scraped or Uploaded CDN)</label>
          <div id="image-inputs-container">
            ${initialImages.map((img, i) => `
              <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <input type="url" class="form-input p-image-url" value="${img}" placeholder="https://..." required>
                ${i > 0 ? `<button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.remove()">&times;</button>` : ''}
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="margin-top: 4px;" onclick="addImageUrlRow()">+ Add Another Image URL</button>
        </div>

        <!-- Key Features List -->
        <div class="form-group">
          <label class="form-label">Key Highlights / Features</label>
          <div id="features-inputs-container">
            ${initialFeatures.map((f, i) => `
              <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <input type="text" class="form-input p-feature-item" value="${f}" placeholder="Feature highlight…">
                ${i > 0 ? `<button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.remove()">&times;</button>` : ''}
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="margin-top: 4px;" onclick="addFeatureRow()">+ Add Feature Bullet</button>
        </div>

        <!-- Tags & Featured -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div style="flex: 1; margin-right: 24px;">
            <label class="form-label">Tags (comma-separated)</label>
            <input type="text" id="p-tags" class="form-input" value="${product?.tags ? product.tags.join(', ') : 'flagship, new-arrival'}" placeholder="e.g. flagship, apple, pro">
          </div>
          <div style="display: flex; align-items: center; gap: 8px; padding-top: 20px;">
            <input type="checkbox" id="p-featured" style="width: 18px; height: 18px;" ${product?.featured ? 'checked' : ''}>
            <label for="p-featured" style="font-weight: 600; font-size: 14px; cursor: pointer;">Feature on Home Bento</label>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Product'}</button>
        </div>
      </form>
    </div>
  `;

  openModal(modalHtml);

  // Render spec inputs based on selected category
  const renderSpecs = (cat) => {
    const label = document.getElementById('cat-specs-label');
    if (label) label.textContent = cat;
    const container = document.getElementById('dynamic-specs-container');
    if (!container) return;
    const fields = getSpecFieldsForCategory(cat, initialSpecs);
    container.innerHTML = fields.map(f => `
      <div>
        <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">${f.label}</label>
        <input type="text" class="form-input spec-input" data-key="${f.key}" value="${f.val}" placeholder="${f.label}…" style="margin-top: 2px;">
      </div>
    `).join('');
  };

  renderSpecs(initialCategory);

  const catSelect = document.getElementById('p-category');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => renderSpecs(e.target.value));
  }

  // Handle submit
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('p-name').value.trim();
      const brand = document.getElementById('p-brand').value.trim();
      const category = document.getElementById('p-category').value;
      const price = Number(document.getElementById('p-price').value);
      const discountVal = document.getElementById('p-discount').value;
      const discountPrice = discountVal ? Number(discountVal) : null;
      const availability = document.getElementById('p-availability').value;
      const warranty = document.getElementById('p-warranty').value.trim();
      const shortDescription = document.getElementById('p-desc').value.trim();
      const featured = document.getElementById('p-featured').checked;
      const tags = document.getElementById('p-tags').value.split(',').map(t => t.trim()).filter(Boolean);

      // Collect images
      const images = Array.from(document.querySelectorAll('.p-image-url'))
        .map(input => input.value.trim())
        .filter(Boolean);

      // Collect features
      const features = Array.from(document.querySelectorAll('.p-feature-item'))
        .map(input => input.value.trim())
        .filter(Boolean);

      // Collect specs
      const specs = {};
      document.querySelectorAll('.spec-input').forEach(input => {
        const k = input.getAttribute('data-key');
        const v = input.value.trim();
        if (v) specs[k] = v;
      });

      const payload = {
        name,
        brand,
        category,
        price,
        discountPrice,
        availability,
        warranty,
        shortDescription,
        featured,
        tags,
        images,
        features,
        specs
      };

      try {
        if (isEdit) {
          const updated = await apiRequest(`/api/products/${product.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          const idx = state.products.findIndex(p => p.id === product.id);
          if (idx !== -1) state.products[idx] = updated;
          showToast(`"${updated.name}" updated successfully!`, 'success');
        } else {
          const created = await apiRequest('/api/products', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          state.products.unshift(created);
          showToast(`"${created.name}" added to catalog!`, 'success');
        }

        closeModal();
        renderAdminTableRows();
      } catch (err) {
        showToast(err.message || 'Error saving product', 'error');
      }
    });
  }
}

window.addImageUrlRow = function() {
  const container = document.getElementById('image-inputs-container');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px;';
  div.innerHTML = `
    <input type="url" class="form-input p-image-url" placeholder="https://..." required>
    <button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};

window.addFeatureRow = function() {
  const container = document.getElementById('features-inputs-container');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px;';
  div.innerHTML = `
    <input type="text" class="form-input p-feature-item" placeholder="Feature highlight…">
    <button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};

// ============================================================
// FOOTER COMPONENT
// ============================================================
function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="#/" class="logo">
            <span class="logo-text">Hamro<strong>Gadget</strong></span>
          </a>
          <p class="footer-brand-desc">
            Nepal's premier independent consumer electronics and gadget storefront. Verified distributor pricing, genuine VAT bills, and express nationwide delivery.
          </p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="Twitter / X">X</a>
            <a href="#" aria-label="YouTube">YT</a>
          </div>
        </div>

        <div>
          <h4 class="footer-heading">Top Categories</h4>
          <ul class="footer-links">
            <li><a href="#/category/Laptops">Laptops in Nepal</a></li>
            <li><a href="#/category/Phones">Smartphones & iPhones</a></li>
            <li><a href="#/category/Headphones">Headphones & Earbuds</a></li>
            <li><a href="#/category/Smartwatches">Smartwatches</a></li>
            <li><a href="#/category/Accessories">Tech Accessories</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-heading">Customer Care</h4>
          <ul class="footer-links">
            <li><a href="javascript:void(0)" onclick="showToast('Warranty claims serviced via authorized brand service centers across Nepal.', 'info')">Warranty Claims</a></li>
            <li><a href="javascript:void(0)" onclick="showToast('Standard 2-3 business days delivery across all 7 provinces.', 'info')">Shipping & Delivery</a></li>
            <li><a href="javascript:void(0)" onclick="showToast('Cash on Delivery, eSewa, Khalti, and Fonepay accepted.', 'info')">Payment Options</a></li>
            <li><a href="javascript:void(0)" onclick="showToast('Authenticity verified: All serial numbers registered with official distributors.', 'info')">Genuine Guarantee</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-heading">Kathmandu Store</h4>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 8px;">
            Putalisadak, New Road & Banepa Hubs<br>
            Kathmandu, Bagmati 44600, Nepal
          </p>
          <p style="font-size: 13px; color: var(--accent); font-weight: 600;">
            Support: +977-1-4245678
          </p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            Daily: 10:00 AM – 7:30 PM NST
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <div>&copy; 2026 HamroGadget Nepal Pvt. Ltd. All Rights Reserved.</div>
        <div>Designed with precision Bento Grid &bull; 1,040+ Scraped Tech Photos</div>
      </div>
    </div>
  `;
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  updateAuthUI();
  renderFooter();

  try {
    const [products, categories] = await Promise.all([
      apiRequest('/api/products'),
      apiRequest('/api/categories').catch(() => state.categories)
    ]);

    state.products = products || [];
    if (categories && Array.isArray(categories)) {
      state.categories = categories;
    }

    // Hide initial loading screen
    const loader = document.getElementById('loading-screen');
    if (loader) loader.style.display = 'none';

    // Route initially
    handleRoute();
  } catch (err) {
    console.error('Failed to initialize application:', err);
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.innerHTML = `
        <div style="text-align: center; color: var(--red); padding: 40px;">
          <h3>Failed to load catalog data</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Please make sure the server is running on port 5000.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Retry Connection</button>
        </div>
      `;
    }
  }
});
