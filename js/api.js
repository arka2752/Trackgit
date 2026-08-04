/**
 * API Wrapper for GitHub REST and Contribution Proxy
 */
const API = {
  BASE_URL: 'https://api.github.com',
  CONTRIB_API: 'https://github-contributions-api.jasonraimondi.com/v1/year', // using a known open source proxy for contribution data
  
  /**
   * Helper to perform fetch with appropriate headers
   */
  async fetchGitHub(endpoint, options = {}) {
    const token = Storage.getToken();
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      // Update Rate Limit Display
      this.updateRateLimitDisplay(response);
      
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        if (rateLimitRemaining === '0') {
          const resetTime = new Date(Number(response.headers.get('X-RateLimit-Reset')) * 1000);
          throw new Error(`Rate limit reached. Resets at ${resetTime.toLocaleTimeString()}. Add a token in Settings.`);
        }
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Not found');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network failure. Please check your connection.');
      }
      throw error;
    }
  },
  
  /**
   * Fetch user profile
   */
  async getUserProfile(username) {
    return this.fetchGitHub(`/users/${username}`);
  },
  
  /**
   * Fetch user repositories (paginated up to maxPages)
   */
  async getUserRepos(username, maxPages = 3) {
    let repos = [];
    let page = 1;
    const perPage = 100;
    
    while (page <= maxPages) {
      const data = await this.fetchGitHub(`/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`);
      repos = repos.concat(data);
      if (data.length < perPage) {
        break; // No more pages
      }
      page++;
    }
    
    return { repos, capped: page > maxPages };
  },
  
  /**
   * Fetch contribution calendar data from proxy
   */
  async getContributions(username) {
    try {
      // Use the proxy for contributions
      const response = await fetch(`${this.CONTRIB_API}/${username}`);
      if (!response.ok) {
        throw new Error('Contributions unavailable');
      }
      return await response.json();
    } catch (error) {
      console.warn("Contribution fetch failed:", error);
      return null;
    }
  },
  
  /**
   * Update the UI rate limit counter
   */
  updateRateLimitDisplay(response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    
    if (remaining && limit) {
      const limitDisplay = document.getElementById('rate-limit-text');
      if (limitDisplay) {
        limitDisplay.textContent = `${remaining}/${limit}`;
      }
    }
  }
};
