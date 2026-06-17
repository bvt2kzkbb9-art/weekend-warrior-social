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

    const progress = mission.progress || 0;
    const total = mission.steps || 3;
    const percent = (progress / total) * 100;

    const difficultyClass = `mission-difficulty ${mission.difficulty || 'easy'}`;
    const difficultyLabel = {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny'
    }[mission.difficulty] || 'Łatwy';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'mission-card-image';

    if (mission.image) {
      const img = document.createElement('img');
      img.src = MissionRenderer.getImageUrl(mission.image);
      img.alt = mission.title;
      img.loading = 'lazy';

      img.addEventListener('error', function() {
        this.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'mission-card-image-placeholder';
        placeholder.textContent = mission.badge || '⚔️';
        this.parentElement.appendChild(placeholder);
      });

      imageContainer.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'mission-card-image-placeholder';
      placeholder.textContent = mission.badge || '⚔️';
      imageContainer.appendChild(placeholder);
    }

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'mission-card-content';
    content.innerHTML = `
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

      <button class="mission-card-action" data-mission-id="${mission.id}">
        ${progress >= total ? 'Odbierz' : 'Przejmij'}
      </button>
    `;

    card.appendChild(content);

    const actionBtn = content.querySelector('.mission-card-action');
    actionBtn.addEventListener('click', () => handleMissionClick(mission.id));

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
