/**
 * Compare Logic
 */
const Compare = {
  /**
   * Compare two metrics and return highlight class for user1 and user2
   */
  getHighlightClasses(val1, val2, invert = false) {
    if (val1 === val2) return { c1: '', c2: '' };
    
    let u1Wins = val1 > val2;
    if (invert) u1Wins = !u1Wins; // e.g. for something where lower is better
    
    return {
      c1: u1Wins ? 'highlight-win' : 'highlight-loss',
      c2: !u1Wins ? 'highlight-win' : 'highlight-loss'
    };
  }
};
