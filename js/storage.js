/**
 * Centralized LocalStorage manager
 */
const Storage = {
  KEYS: {
    TOKEN: 'github_pat_token',
    THEME: 'theme_preference',
    FAVORITES: 'github_dashboard_favorites',
    HISTORY: 'github_search_history',
    NOTES: 'github_dev_notes'
  },
  
  // -- Token Management --
  getToken() {
    return localStorage.getItem(this.KEYS.TOKEN) || '';
  },
  setToken(token) {
    if (token) {
      localStorage.setItem(this.KEYS.TOKEN, token.trim());
    } else {
      localStorage.removeItem(this.KEYS.TOKEN);
    }
  },
  
  // -- Theme Management --
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'light';
  },
  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  // -- Favorites Management --
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  },
  addFavorite(user) {
    const favorites = this.getFavorites();
    if (!favorites.some(f => f.login.toLowerCase() === user.login.toLowerCase())) {
      favorites.push({
        login: user.login,
        avatar_url: user.avatar_url,
        name: user.name,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },
  removeFavorite(username) {
    let favorites = this.getFavorites();
    favorites = favorites.filter(f => f.login.toLowerCase() !== username.toLowerCase());
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
  },
  isFavorite(username) {
    return this.getFavorites().some(f => f.login.toLowerCase() === username.toLowerCase());
  },
  
  // -- Search History Management --
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.HISTORY)) || [];
    } catch {
      return [];
    }
  },
  addHistory(username) {
    if (!username) return;
    let history = this.getHistory();
    // Remove if exists to put at the top
    history = history.filter(h => h.username.toLowerCase() !== username.toLowerCase());
    history.unshift({ username, timestamp: new Date().toISOString() });
    
    // Cap at 20
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  },
  removeHistory(username) {
    let history = this.getHistory();
    history = history.filter(h => h.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  },
  clearHistory() {
    localStorage.removeItem(this.KEYS.HISTORY);
  },
  
  // -- Notes Management --
  getNote(username) {
    try {
      const notes = JSON.parse(localStorage.getItem(this.KEYS.NOTES)) || {};
      return notes[username.toLowerCase()] || '';
    } catch {
      return '';
    }
  },
  saveNote(username, noteText) {
    try {
      const notes = JSON.parse(localStorage.getItem(this.KEYS.NOTES)) || {};
      if (noteText.trim() === '') {
        delete notes[username.toLowerCase()];
      } else {
        notes[username.toLowerCase()] = noteText;
      }
      localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving note', e);
    }
  }
};

// Immediately apply theme to avoid flash
(function() {
  const theme = Storage.getTheme();
  document.documentElement.setAttribute('data-theme', theme);
})();
