/**
 * Utility functions for formatting and calculations
 */
const Utils = {
  /**
   * Format numbers to K/M format (e.g. 1200 -> 1.2k)
   */
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  },
  
  /**
   * Format date to locale string (e.g. "Oct 12, 2023")
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },
  
  /**
   * Debounce function for input handlers
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  /**
   * Helper to truncate string
   */
  truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  },
  
  /**
   * Map GitHub language to Devicon class
   */
  getDeviconClass(lang) {
    if (!lang) return null;
    const l = lang.toLowerCase();
    const map = {
      'html': 'devicon-html5-plain',
      'css': 'devicon-css3-plain',
      'javascript': 'devicon-javascript-plain',
      'typescript': 'devicon-typescript-plain',
      'python': 'devicon-python-plain',
      'java': 'devicon-java-plain',
      'c++': 'devicon-cplusplus-plain',
      'c#': 'devicon-csharp-plain',
      'php': 'devicon-php-plain',
      'ruby': 'devicon-ruby-plain',
      'go': 'devicon-go-plain',
      'rust': 'devicon-rust-plain',
      'swift': 'devicon-swift-plain',
      'kotlin': 'devicon-kotlin-plain',
      'dart': 'devicon-dart-plain',
      'shell': 'devicon-bash-plain',
      'c': 'devicon-c-plain',
      'vue': 'devicon-vuejs-plain',
      'svelte': 'devicon-svelte-plain'
    };
    return map[l] || null;
  }
};
