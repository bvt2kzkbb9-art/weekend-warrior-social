/**
 * Navigation System
 * Handles top and bottom navigation auto-hide, active states, and animations
 */

class NavigationSystem {
  constructor() {
    this.topNav = document.querySelector('.top-nav');
    this.bottomNav = document.querySelector('.bottom-nav');
    this.lastScrollY = 0;
    this.scrollDirection = 'up';
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.minScrollDistance = 10;

    this.init();
  }

  init() {
    if (!this.topNav || !this.bottomNav) {
      console.warn('Navigation elements not found');
      return;
    }

    this.setActiveNavItem();
    this.setupScrollListener();
    this.setupClickAnimations();
  }

  setupScrollListener() {
    let ticking = false;
    let lastKnownScrollY = 0;

    window.addEventListener('scroll', () => {
      lastKnownScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => this.updateNavigation(lastKnownScrollY));
        ticking = true;
      }

      ticking = false;
    }, { passive: true });
  }

  updateNavigation(scrollY) {
    const delta = scrollY - this.lastScrollY;

    // Determine scroll direction
    if (delta > this.minScrollDistance) {
      this.scrollDirection = 'down';
    } else if (delta < -this.minScrollDistance) {
      this.scrollDirection = 'up';
    }

    // At top of page - always show both nav
    if (scrollY < 50) {
      this.showTopNav();
      this.showBottomNav();
    } else {
      // Hide/show based on scroll direction
      if (this.scrollDirection === 'down') {
        this.hideTopNav();
        this.hideBottomNav();
      } else {
        this.showTopNav();
        this.showBottomNav();
      }
    }

    this.lastScrollY = scrollY;
  }

  showTopNav() {
    this.topNav.classList.remove('hidden');
  }

  hideTopNav() {
    this.topNav.classList.add('hidden');
  }

  showBottomNav() {
    this.bottomNav.classList.remove('hidden');
  }

  hideBottomNav() {
    this.bottomNav.classList.add('hidden');
  }

  setActiveNavItem() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    // Map files to nav items
    const navMap = {
      'index.html': 'arena',
      'feed.html': 'kroniki',
      'challenges.html': 'misje',
      'ranking.html': 'chwal',
      'profile.html': 'bohater',
      'messenger.html': 'messages',
      '': 'arena' // default to arena for root
    };

    const activeId = navMap[currentFile];

    // Remove active from all items
    document.querySelectorAll('.bottom-nav-item.active').forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    });

    // Set active for current page
    if (activeId) {
      const activeItem = document.querySelector(`.bottom-nav-item[data-nav="${activeId}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
        activeItem.setAttribute('aria-current', 'page');
      }
    }
  }

  setupClickAnimations() {
    // Top nav action buttons
    document.querySelectorAll('.top-nav-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.triggerClickAnimation(btn);
        this.triggerHaptic('light');
      });
    });

    // Bottom nav items
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Let the link navigate normally, but trigger animation
        this.triggerClickAnimation(item);
        this.triggerHaptic('medium');
      });
    });
  }

  triggerClickAnimation(element) {
    element.style.animation = 'none';
    // Trigger reflow to restart animation
    void element.offsetWidth;
    element.style.animation = '';
  }

  triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        'light': 10,
        'medium': 20,
        'heavy': 30
      };
      navigator.vibrate(patterns[type] || 10);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NavigationSystem();
  });
} else {
  new NavigationSystem();
}
