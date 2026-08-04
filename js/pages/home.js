/**
 * Home page specific logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  const seedUsers = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803'];
  const container = document.getElementById('popular-devs-container');
  
  if (!container) return;
  
  // Render skeletons first
  container.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    container.innerHTML += UI.createDevCardSkeleton();
  }
  
  try {
    const users = await Promise.all(
      seedUsers.map(async (username) => {
        try {
          const profile = await API.getUserProfile(username);
          return profile;
        } catch (err) {
          console.error(`Failed to fetch ${username}`, err);
          return null;
        }
      })
    );
    
    container.innerHTML = '';
    users.forEach(user => {
      if (user) {
        container.innerHTML += UI.createDevCard(user);
      }
    });
  } catch (error) {
    container.innerHTML = '<p class="text-center">Failed to load popular developers.</p>';
  }
  
  // Handle hero search
  const searchForm = document.getElementById('hero-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('hero-search-input').value.trim();
      if (query) {
        window.location.href = `search.html?user=${encodeURIComponent(query)}`;
      }
    });
  }
});
