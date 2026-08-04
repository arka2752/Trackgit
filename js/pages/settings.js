document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('token-form');
      const input = document.getElementById('pat-input');
      const msg = document.getElementById('token-msg');
      const clearBtn = document.getElementById('clear-token-btn');
      
      // Load existing token
      input.value = Storage.getToken();
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        Storage.setToken(input.value);
        msg.textContent = 'Token saved successfully!';
        msg.style.color = 'var(--success-color)';
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);
      });
      
      clearBtn.addEventListener('click', () => {
        Storage.setToken('');
        input.value = '';
        msg.textContent = 'Token cleared.';
        msg.style.color = 'var(--text-secondary)';
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);
      });
      
      document.getElementById('clear-history-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to clear all search history?')) {
          Storage.clearHistory();
          alert('Search history cleared.');
        }
      });
    });