document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('favorites-container');
      const emptyState = document.getElementById('no-favorites');
      
      function renderFavorites() {
        const favs = Storage.getFavorites();
        if (favs.length === 0) {
          container.classList.add('hidden');
          emptyState.classList.remove('hidden');
        } else {
          emptyState.classList.add('hidden');
          container.classList.remove('hidden');
          container.innerHTML = favs.map(f => UI.createDevCard(f)).join('');
        }
      }
      
      renderFavorites();
      
      // Re-render when a favorite is clicked (since the global listener in ui.js handles logic)
      document.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) {
          setTimeout(renderFavorites, 0); // let UI update storage first
        }
      });
    });