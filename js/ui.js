/**
 * UI Rendering and DOM Manipulation
 */
const UI = {
  /**
   * Create skeleton for a dev card (Home page)
   */
  createDevCardSkeleton() {
    return `
      <div class="card dev-card skeleton-card flex-between">
        <div style="display: flex; gap: 16px; align-items: center; width: 100%;">
          <div class="skeleton skeleton-avatar" style="width: 60px; height: 60px;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text short"></div>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Create a dev card (Home / Favorites)
   */
  createDevCard(user) {
    const isFav = Storage.isFavorite(user.login);
    const favIcon = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const favColor = isFav ? 'var(--danger-color)' : 'var(--text-secondary)';
    
    return `
      <div class="card dev-card" style="position: relative;">
        <a href="search.html?user=${user.login}" style="display: flex; align-items: center; gap: 16px; flex: 1; color: inherit; text-decoration: none;">
          <img src="${user.avatar_url}" alt="${user.login}" class="dev-avatar">
          <div class="dev-info">
            <h4>${user.name || user.login}</h4>
            <p>@${user.login}</p>
          </div>
        </a>
        <button class="btn btn-outline fav-btn" data-user='${JSON.stringify(user).replace(/'/g, "&apos;")}' style="position: absolute; right: 16px; color: ${favColor}; border: none; padding: 4px;">
          <i class="${favIcon}"></i>
        </button>
      </div>
    `;
  },
  
  /**
   * Create repo card
   */
  createRepoCard(repo) {
    const deviconClass = Utils.getDeviconClass(repo.language);
    const langHtml = repo.language ? (
      deviconClass 
      ? `<span><i class="${deviconClass}" style="margin-right:4px; font-size:1.1em; color:var(--text-primary);"></i>${repo.language}</span>`
      : `<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:var(--accent-color);margin-right:4px;"></span>${repo.language}</span>`
    ) : '';
    
    return `
      <div class="card repo-card" style="margin-bottom: 16px;">
        <div class="repo-card-header flex-between">
          <h3 style="margin-bottom: 0;"><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a></h3>
          <span class="badge badge-outline">${repo.visibility || 'Public'}</span>
        </div>
        <p style="margin-top: 8px; font-size: 0.9rem;">${repo.description ? Utils.truncate(repo.description, 100) : 'No description provided.'}</p>
        <div class="stats-row" style="display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-secondary); margin-top: 12px; align-items: center;">
          ${langHtml}
          <span title="Stars"><i class="fa-regular fa-star"></i> ${Utils.formatNumber(repo.stargazers_count)}</span>
          <span title="Forks"><i class="fa-solid fa-code-branch"></i> ${Utils.formatNumber(repo.forks_count)}</span>
          <span>Updated ${Utils.formatDate(repo.updated_at)}</span>
        </div>
      </div>
    `;
  },
  
  /**
   * Render score ring
   */
  renderScoreRing(score, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Using SVG for the circle
    let color = 'var(--success-color)';
    if (score < 50) color = 'var(--danger-color)';
    else if (score < 75) color = 'var(--warning-color)';
    
    // Circle circumference is roughly 251 for r=40
    const circumference = 251.2;
    const offset = circumference - (score / 100) * circumference;
    
    container.innerHTML = `
      <div style="position: relative; width: 100px; height: 100px; margin: 0 auto;">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" stroke-width="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8" 
                  stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" 
                  stroke-linecap="round" transform="rotate(-90 50 50)"
                  style="transition: stroke-dashoffset 1.5s ease-out;" id="score-circle-${containerId}"/>
        </svg>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
          ${score}
        </div>
      </div>
    `;
    
    // Trigger animation
    setTimeout(() => {
      const circle = document.getElementById(`score-circle-${containerId}`);
      if (circle) {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          circle.style.strokeDashoffset = offset;
        } else {
          circle.style.strokeDashoffset = offset;
          circle.style.transition = 'none';
        }
      }
    }, 100);
  },
  
  /**
   * Setup global favorite toggle listeners
   */
  setupFavoriteListeners() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.fav-btn');
      if (!btn) return;
      
      const userData = JSON.parse(btn.getAttribute('data-user'));
      const isFav = Storage.isFavorite(userData.login);
      
      if (isFav) {
        Storage.removeFavorite(userData.login);
        btn.querySelector('i').className = 'fa-regular fa-heart';
        btn.style.color = 'var(--text-secondary)';
      } else {
        Storage.addFavorite(userData);
        btn.querySelector('i').className = 'fa-solid fa-heart';
        btn.style.color = 'var(--danger-color)';
      }
    });
  }
};

// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
  UI.setupFavoriteListeners();
});
