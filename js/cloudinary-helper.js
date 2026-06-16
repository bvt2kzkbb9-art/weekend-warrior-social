/**
 * Cloudinary Image Helper
 * Manages all image URLs and transformations for Weekend Warrior Social
 */

const CLOUDINARY_CONFIG = {
  cloud: 'dxanfwb3l',
  baseUrl: 'https://res.cloudinary.com/dxanfwb3l/image/upload/',

  // Default placeholder (solid color, no "Loading..." text to avoid permanent skeleton appearance)
  placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231a1a1a" width="400" height="300"/%3E%3C/svg%3E'
};

const ImageHelper = {
  /**
   * Challenge image (1200x675)
   */
  challenge: (filename, width = 1200, height = 675) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_${width},h_${height},c_fill,q_auto,f_webp/challenges/${filename}`;
  },
  
  /**
   * Challenge srcset for responsive
   */
  challengeSrcset: (filename) => {
    if (!filename) return '';
    return `
      ${CLOUDINARY_CONFIG.baseUrl}w_600,h_337,c_fill,q_auto,f_webp/challenges/${filename} 600w,
      ${CLOUDINARY_CONFIG.baseUrl}w_1200,h_675,c_fill,q_auto,f_webp/challenges/${filename} 1200w
    `.trim();
  },
  
  /**
   * Mission image (300x300)
   */
  mission: (filename) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_300,h_300,c_fill,q_auto,f_webp/missions/${filename}`;
  },
  
  /**
   * Achievement badge (200x200)
   */
  achievement: (filename) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_200,h_200,c_fill,q_auto,f_webp/achievements/${filename}`;
  },
  
  /**
   * Rank medal (300x300)
   */
  rank: (filename) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_300,h_300,c_fill,q_auto,f_webp/ranks/${filename}`;
  },
  
  /**
   * User avatar (88x88 for display, 176x176 for retina)
   */
  avatar: (filename, size = 88) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_${size * 2},h_${size * 2},c_fill,q_auto,f_webp/avatars/${filename}`;
  },
  
  /**
   * Avatar srcset for responsive
   */
  avatarSrcset: (filename) => {
    if (!filename) return '';
    return `
      ${CLOUDINARY_CONFIG.baseUrl}w_88,h_88,c_fill,q_auto,f_webp/avatars/${filename} 1x,
      ${CLOUDINARY_CONFIG.baseUrl}w_176,h_176,c_fill,q_auto,f_webp/avatars/${filename} 2x
    `.trim();
  },
  
  /**
   * Post image (800x600)
   */
  post: (filename) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_800,h_600,c_fill,q_auto,f_webp/posts/${filename}`;
  },
  
  /**
   * Post image srcset
   */
  postSrcset: (filename) => {
    if (!filename) return '';
    return `
      ${CLOUDINARY_CONFIG.baseUrl}w_400,h_300,c_fill,q_auto,f_webp/posts/${filename} 400w,
      ${CLOUDINARY_CONFIG.baseUrl}w_800,h_600,c_fill,q_auto,f_webp/posts/${filename} 800w
    `.trim();
  },
  
  /**
   * Background image (1920x1080)
   */
  background: (filename) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_1920,h_1080,c_fill,q_auto,f_webp/backgrounds/${filename}`;
  },
  
  /**
   * Generic image with custom dimensions
   */
  custom: (folder, filename, width, height) => {
    if (!filename) return CLOUDINARY_CONFIG.placeholder;
    return `${CLOUDINARY_CONFIG.baseUrl}w_${width},h_${height},c_fill,q_auto,f_webp/${folder}/${filename}`;
  },
  
  /**
   * Enable lazy loading for all images with data-src
   */
  initLazyLoading: () => {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  },
  
  /**
   * Validate image exists in Cloudinary
   */
  validateImage: async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Image validation failed:', url);
      return false;
    }
  },

  /**
   * Safely load image with error handler and fallback
   */
  loadImage: (element, url, fallbackText = '?') => {
    if (!element) return;
    if (!url) {
      element.textContent = fallbackText;
      return;
    }

    const img = document.createElement('img');
    img.src = url;
    img.alt = element.alt || 'Image';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.loading = 'lazy';

    // Timeout fallback - if image doesn't load in 5s, show text
    const loadTimeout = setTimeout(() => {
      if (!img.complete) {
        console.warn('[CloudinaryHelper] Image load timeout:', url);
        element.textContent = fallbackText;
      }
    }, 5000);

    img.onload = () => {
      clearTimeout(loadTimeout);
      element.innerHTML = '';
      element.appendChild(img);
    };

    img.onerror = () => {
      clearTimeout(loadTimeout);
      console.warn('[CloudinaryHelper] Image load failed:', url);
      element.innerHTML = '';
      element.textContent = fallbackText;
    };
  }
};

// Auto-init lazy loading when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ImageHelper.initLazyLoading());
} else {
  ImageHelper.initLazyLoading();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageHelper;
}
