/**
 * Simple SPA Router
 */

const routes = new Map();
let currentRoute = '';

export function defineRoute(path, component) {
  routes.set(path, component);
}

export function getRoute(path) {
  return routes.get(path);
}

export async function navigateTo(path) {
  const route = getRoute(path);
  if (!route) {
    console.error(`Route not found: ${path}`);
    return;
  }

  currentRoute = path;

  const main = document.querySelector('.main');
  if (!main) return;

  try {
    let content = '';
    if (typeof route === 'function') {
      content = await route();
    } else {
      content = route;
    }

    main.innerHTML = content;

    if (path === '/bohater') {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          const { logout } = await import('./auth.js');
          await logout();
        });
      }
    }

    // Update active nav item
    updateActiveNav(path);

    // Scroll to top
    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Navigation error:', err);
    main.innerHTML = '<div class="page-container"><p>Error loading page</p></div>';
  }
}

export function updateActiveNav(path) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-route') === path) {
      item.classList.add('active');
    }
  });
}

export function getCurrentRoute() {
  return currentRoute;
}

/**
 * Initialize router with hash-based navigation
 */
export function initRouter() {
  window.addEventListener('hashchange', () => {
    const path = window.location.hash.slice(1) || '/';
    navigateTo(path);
  });

  // Handle initial route
  const initialPath = window.location.hash.slice(1) || '/';
  navigateTo(initialPath);
}
