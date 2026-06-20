/**
 * Auto-hide navigation on scroll
 */
(function() {
  const topBar = document.querySelector('.top-bar');
  const bottomNav = document.querySelector('.bottom-nav');
  let lastScrollY = 0;
  let hideTimeout;

  if (!topBar || !bottomNav) return;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100;

    if (isScrollingDown) {
      // Scrolling down - hide bars
      topBar.classList.add('hide-on-scroll');
      bottomNav.classList.add('hide-on-scroll');
    } else {
      // Scrolling up - show bars
      topBar.classList.remove('hide-on-scroll');
      bottomNav.classList.remove('hide-on-scroll');
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
})();
