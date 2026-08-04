/**
 * Global App Initialization and Event Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    const updateIcon = () => {
      const theme = Storage.getTheme();
      themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
    
    updateIcon();
    
    themeToggleBtn.addEventListener('click', () => {
      const current = Storage.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      Storage.setTheme(next);
      updateIcon();
      
      // Notify charts if any exist on the page to redraw for new theme
      window.dispatchEvent(new Event('themeChanged'));
    });
  }
  
  // Highlight active nav link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
