/**
 * Mission Card Renderer
 * Renders mission cards with images from Cloudinary
 */

const MissionRenderer = {
  /**
   * Render single mission card with image
   */
  renderCard: (mission) => {
    const card = document.createElement('div');
    card.className = 'mission-card';
    card.id = `mission-${mission.id}`;
    
    // Progress (default 0/steps)
    const progress = mission.progress || 0;
    const total = mission.steps || 3;
    const percent = (progress / total) * 100;
    
    // Difficulty badge
    const difficultyClass = `mission-difficulty ${mission.difficulty || 'easy'}`;
    const difficultyLabel = {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny'
    }[mission.difficulty] || 'Łatwy';
    
    // Image
    let imageHTML = '';
    if (mission.image) {
      imageHTML = `
        <div class="mission-card-image">
          <img 
            src="${MissionRenderer.getImageUrl(mission.image)}"
            alt="${mission.title}"
            loading="lazy"
            onerror="this.style.display='none'; this.parentElement.innerHTML += '<div class=\"mission-card-image-placeholder\">${mission.badge || '⚔️'}</div>'"
          />
        </div>
      `;
    } else {
      imageHTML = `
        <div class="mission-card-image">
          <div class="mission-card-image-placeholder">${mission.badge || '⚔️'}</div>
        </div>
      `;
    }
    
    card.innerHTML = `
      ${imageHTML}
      <div class="mission-card-content">
        <div class="mission-card-header">
          <div class="mission-card-title">${mission.title}</div>
          <div class="mission-card-desc">${mission.desc}</div>
        </div>
        
        <div class="mission-progress">
          <div class="mission-progress-bar">
            <div class="mission-progress-fill" style="width: ${percent}%"></div>
          </div>
        </div>
        
        <div class="mission-stats">
          <span class="${difficultyClass}">${difficultyLabel}</span>
          <span class="mission-xp">+${mission.xp || 20} XP</span>
        </div>
        
        <button class="mission-card-action" onclick="handleMissionClick('${mission.id}')">
          ${progress >= total ? 'Odbierz' : 'Przejmij'}
        </button>
      </div>
    `;
    
    return card;
  },
  
  /**
   * Get image URL from Cloudinary or fallback
   */
  getImageUrl: (imagePath) => {
    // If already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a filename, build Cloudinary URL
    if (!imagePath.includes('/')) {
      return ImageHelper.mission(imagePath);
    }
    
    // If relative path, convert to Cloudinary
    const filename = imagePath.split('/').pop();
    return ImageHelper.mission(filename);
  },
  
  /**
   * Render all missions into container
   */
  render: (missions, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    missions.forEach(mission => {
      const card = MissionRenderer.renderCard(mission);
      container.appendChild(card);
    });
  }
};

// Handle mission click
function handleMissionClick(missionId) {
  console.log('Mission clicked:', missionId);
  // TODO: Open mission detail / start mission
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Will be called from page JS
  });
}
