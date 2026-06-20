/**
 * Challenge Artwork Renderer
 * Renders challenge cards with Cloudinary artwork integration
 * Features: Lazy loading, fade-in, placeholder, fallback
 */

const ChallengeArtworkRenderer = {
  /**
   * Challenge to image filename mapping
   */
  imageMap: {
    'lowca_wezy': 'lowca-wezy',
    'tropiciel_hydry': 'tropiciel-hydry',
    'zgniatacz_wezy': 'zgniatacz-wezy',
    'maly_na_rozruch': 'maly-na-rozruch',
    'pogromca_krychy': 'pogromca-krychy',
    'siedem_dni_chwaly': 'siedem-dni-chwaly',
    'pogromca_areny': 'nagroda-wojownika',
    'nackora_wojownika': 'nackora-wojownika',
    'lechenda_wojowmikow': 'legenda-wojownikow',
  },
  
  /**
   * Get Cloudinary URL for challenge
   */
  getChallengeImageUrl: (challengeId, width = 1200, height = 675) => {
    const filename = ChallengeArtworkRenderer.imageMap[challengeId] || challengeId;
    return ImageHelper.challenge(filename, width, height);
  },
  
  /**
   * Get responsive srcset
   */
  getResponsiveSrcset: (challengeId) => {
    const filename = ChallengeArtworkRenderer.imageMap[challengeId] || challengeId;
    return ImageHelper.challengeSrcset(filename);
  },
  
  /**
   * Render single challenge card with artwork
   */
  renderCard: (challenge) => {
    const card = document.createElement('div');
    card.className = 'challenge-card-artwork';
    card.id = `challenge-${challenge.id}`;
    card.setAttribute('data-challenge-id', challenge.id);
    
    const imageUrl = ChallengeArtworkRenderer.getChallengeImageUrl(challenge.id);
    const srcset = ChallengeArtworkRenderer.getResponsiveSrcset(challenge.id);
    const badgeEmoji = challenge.badge || '⚔️';
    const difficulty = challenge.difficulty || 'easy';
    const difficultyLabel = {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny'
    }[difficulty] || 'Łatwy';
    
    card.innerHTML = `
      <!-- Image Container with Artwork -->
      <div class="challenge-image-container loading" data-challenge-id="${challenge.id}">
        <!-- Placeholder while loading -->
        <div class="challenge-image-placeholder">${badgeEmoji}</div>
        
        <!-- Dark overlay for text readability -->
        <div class="challenge-image-overlay"></div>
        
        <!-- Artwork Image -->
        <img
          class="challenge-artwork-image"
          src="${imageUrl}"
          srcset="${srcset}"
          sizes="(max-width: 390px) 130px, (max-width: 768px) 160px, 200px"
          alt="${challenge.title}"
          loading="lazy"
          data-challenge-id="${challenge.id}"
          onerror="ChallengeArtworkRenderer.handleImageError(this)"
        />
      </div>
      
      <!-- Content Section -->
      <div class="challenge-content-section">
        <div>
          <div class="challenge-title-artwork">${challenge.title}</div>
          <div class="challenge-description-artwork">${challenge.desc}</div>
        </div>
        
        <div>
          <div class="challenge-stats-artwork">
            <span class="challenge-difficulty-badge ${difficulty}">${difficultyLabel}</span>
            <span class="challenge-xp-reward">+${challenge.xp || 30} XP</span>
          </div>
          
          <div class="challenge-action-buttons">
            <button 
              class="challenge-action-btn"
              onclick="handleChallengeQuiz('${challenge.id}')"
              aria-label="Quiz wyzwania"
            >
              💗 QUIZ
            </button>
            <button 
              class="challenge-action-btn"
              onclick="handleChallengeStart('${challenge.id}')"
              aria-label="Rzuć wyzwanie"
            >
              ⚔️ RZUĆ
            </button>
          </div>
        </div>
      </div>
    `;
    
    return card;
  },
  
  /**
   * Handle image load event
   */
  onImageLoad: (img) => {
    const container = img.closest('.challenge-image-container');
    if (!container) return;
    
    // Remove loading state
    container.classList.remove('loading');
    
    // Fade in image
    img.classList.add('loaded');
  },
  
  /**
   * Handle image error - show fallback
   */
  handleImageError: (img) => {
    const container = img.closest('.challenge-image-container');
    if (!container) return;
    
    container.classList.remove('loading');
    img.style.display = 'none';
    
    const challengeId = container.getAttribute('data-challenge-id');
    const badgeEmoji = container.querySelector('.challenge-image-placeholder')?.textContent || '⚔️';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'challenge-image-error';
    errorDiv.textContent = badgeEmoji;
    container.appendChild(errorDiv);
  },
  
  /**
   * Render all challenges into container
   */
  render: (challenges, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    container.classList.add('challenges-grid-artwork');
    
    // Add each challenge card
    challenges.forEach((challenge) => {
      const card = ChallengeArtworkRenderer.renderCard(challenge);
      container.appendChild(card);
      
      // Setup image loading
      const img = card.querySelector('.challenge-artwork-image');
      if (img) {
        img.addEventListener('load', () => ChallengeArtworkRenderer.onImageLoad(img));
      }
    });
  },
  
  /**
   * Initialize lazy loading for all images
   */
  initLazyLoading: () => {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('.challenge-artwork-image[loading="lazy"]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.src || img.dataset.src;
            img.srcset = img.srcset || img.dataset.srcset;
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      images.forEach(img => imageObserver.observe(img));
    }
  }
};

/**
 * Challenge action handlers
 */
function handleChallengeQuiz(challengeId) {
  console.log('Quiz started for:', challengeId);
  // TODO: Open quiz modal
  showToast(`Quiz: ${challengeId}`);
}

function handleChallengeStart(challengeId) {
  console.log('Challenge started:', challengeId);
  // TODO: Start challenge
  showToast(`Rzucam wyzwanie: ${challengeId}`);
}

/**
 * Auto-initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ChallengeArtworkRenderer.initLazyLoading();
  });
} else {
  ChallengeArtworkRenderer.initLazyLoading();
}

