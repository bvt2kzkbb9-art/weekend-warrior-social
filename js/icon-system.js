/**
 * WEEKEND WARRIOR SOCIAL - Icon System
 * Premium Dark Fantasy Icons - 32×32px, stroke 2.4px
 *
 * Usage:
 *   <icon name="notification" class="icon-small"></icon>
 *   <icon name="arena" class="icon-large active"></icon>
 */

class IconElement extends HTMLElement {
  connectedCallback() {
    const iconName = this.getAttribute('name');
    const size = this.getAttribute('size') || '24';
    const className = this.getAttribute('class') || '';

    if (!iconName) {
      console.warn('IconElement: name attribute is required');
      return;
    }

    // Load SVG icon
    this.loadIcon(iconName, size, className);
  }

  async loadIcon(name, size, className) {
    try {
      const response = await fetch(`/assets/icons/${name}.svg`);
      const svg = await response.text();

      // Create wrapper div
      const wrapper = document.createElement('div');
      wrapper.className = `icon-wrapper ${className}`;
      wrapper.style.width = `${size}px`;
      wrapper.style.height = `${size}px`;
      wrapper.innerHTML = svg;

      // Style the SVG inside
      const svgElement = wrapper.querySelector('svg');
      if (svgElement) {
        svgElement.setAttribute('width', size);
        svgElement.setAttribute('height', size);
        svgElement.style.width = `${size}px`;
        svgElement.style.height = `${size}px`;
      }

      this.appendChild(wrapper);
    } catch (error) {
      console.error(`Failed to load icon: ${name}`, error);
      this.innerHTML = `<span class="icon-error">✕</span>`;
    }
  }
}

// Register custom element
customElements.define('icon', IconElement);

/**
 * Icon Helper Functions
 */
const IconSystem = {
  /**
   * Create icon inline in HTML
   * @param {string} name - Icon name (without .svg)
   * @param {number} size - Size in pixels (default: 24)
   * @param {string} classes - Additional CSS classes
   */
  async create(name, size = 24, classes = '') {
    try {
      const response = await fetch(`/assets/icons/${name}.svg`);
      const svg = await response.text();
      const div = document.createElement('div');
      div.className = `icon ${classes}`;
      div.style.width = `${size}px`;
      div.style.height = `${size}px`;
      div.innerHTML = svg;
      return div;
    } catch (error) {
      console.error(`Icon load failed: ${name}`, error);
      return null;
    }
  },

  /**
   * List all available icons
   */
  available: {
    navigation: [
      'notification',
      'messages',
      'profile',
      'logout',
      'arena',
      'chronicles',
      'missions',
      'glory',
      'hero'
    ],
    helpers: [
      'eye', 'fire', 'xp', 'photo', 'comment',
      'share', 'like', 'search', 'filter', 'menu',
      'close', 'back', 'edit', 'delete', 'stats',
      'ranking', 'cup', 'add', 'more'
    ]
  }
};
