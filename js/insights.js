/**
 * Core Logic for generating insights and developer score
 */
const Insights = {
  /**
   * Determine developer roles based on their repo languages
   */
  classifyRole(repos) {
    const langCounts = {};
    let totalWithLang = 0;
    
    repos.forEach(repo => {
      if (repo.language) {
        const lang = repo.language.toLowerCase();
        langCounts[lang] = (langCounts[lang] || 0) + 1;
        totalWithLang++;
      }
    });
    
    if (totalWithLang === 0) return ['Unknown Role'];
    
    // Categorize languages
    const frontendLangs = ['javascript', 'typescript', 'html', 'css', 'svelte', 'vue'];
    const backendLangs = ['python', 'go', 'java', 'ruby', 'php', 'c#', 'rust', 'c++', 'c'];
    const mobileLangs = ['swift', 'kotlin', 'dart', 'objective-c'];
    
    let feCount = 0, beCount = 0, mobileCount = 0, mlCount = 0;
    
    repos.forEach(repo => {
      if (!repo.language) return;
      const lang = repo.language.toLowerCase();
      if (frontendLangs.includes(lang)) feCount++;
      if (backendLangs.includes(lang)) beCount++;
      if (mobileLangs.includes(lang)) mobileCount++;
      
      // ML Check
      if (lang === 'python') {
        const topics = repo.topics || [];
        if (topics.some(t => ['machine-learning', 'deep-learning', 'pytorch', 'tensorflow', 'ai', 'data-science'].includes(t))) {
          mlCount++;
        }
      }
    });
    
    const fePercent = feCount / totalWithLang;
    const bePercent = beCount / totalWithLang;
    const mobilePercent = mobileCount / totalWithLang;
    const mlPercent = mlCount / totalWithLang;
    
    let roles = [];
    
    if (fePercent >= 0.2 && bePercent >= 0.2) {
      roles.push('Full Stack Developer');
    } else {
      if (fePercent > 0.5) roles.push('Frontend Developer');
      if (bePercent > 0.5) roles.push('Backend Developer');
    }
    
    if (mobilePercent >= 0.3) roles.push('Mobile Developer');
    if (mlPercent >= 0.25) roles.push('ML/AI Developer');
    
    if (roles.length === 0) {
      // Fallback to top language + developer
      const topLang = Object.keys(langCounts).sort((a,b) => langCounts[b] - langCounts[a])[0];
      roles.push(`${topLang.charAt(0).toUpperCase() + topLang.slice(1)} Developer`);
    }
    
    return roles.slice(0, 2); // Max 2 roles
  },
  
  /**
   * Determine experience level
   */
  classifyExperience(profile, repos) {
    const joinedDate = new Date(profile.created_at);
    const now = new Date();
    const yearsActive = (now - joinedDate) / (1000 * 60 * 60 * 24 * 365.25);
    const repoCount = repos.filter(r => !r.fork).length;
    
    if (yearsActive < 1 || repoCount < 5) {
      return 'Beginner';
    } else if (yearsActive >= 3 && repoCount >= 20) {
      return 'Advanced';
    }
    return 'Intermediate';
  },
  
  /**
   * Calculate 0-100 Score
   * Formula:
   * 30% Repo Quality (avg stars/forks log-scaled)
   * 20% Followers (log-scaled)
   * 20% Activity (recency of pushes)
   * 15% Language Diversity (distinct languages up to 6)
   * 15% Repo count (log-scaled)
   */
  calculateScore(profile, repos) {
    // 1. Repo Quality (30%)
    let totalStars = 0;
    let totalForks = 0;
    let distinctLangs = new Set();
    let recentPushes = 0;
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    repos.forEach(repo => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.language) distinctLangs.add(repo.language);
      if (new Date(repo.pushed_at) > oneYearAgo) recentPushes++;
    });
    
    // Log scaling helper (Math.log10(val + 1) / targetLog)
    const logScale = (val, maxTarget) => Math.min(1, Math.log10(val + 1) / Math.log10(maxTarget + 1));
    
    // Quality metric (combined stars and forks) - max target say 10,000 for perfect quality score
    const qualityScore = logScale(totalStars + totalForks, 10000) * 30;
    
    // 2. Followers (20%) - max target 10,000
    const followerScore = logScale(profile.followers, 10000) * 20;
    
    // 3. Activity (20%) - based on % of repos pushed to in last year
    let activityScore = 0;
    if (repos.length > 0) {
      const activeRatio = Math.min(1, recentPushes / Math.min(repos.length, 30)); 
      // Reward if they have at least some recent activity. 
      // A user with 100 repos doesn't need to push to all 100 to be "active", so cap denominator at 30.
      activityScore = activeRatio * 20;
    } else {
      // Reward based on overall profile recent update if no repos
      const lastUpdate = new Date(profile.updated_at);
      if (lastUpdate > oneYearAgo) activityScore = 10;
    }
    
    // 4. Language Diversity (15%) - max 6 languages for full points
    const langScore = Math.min(1, distinctLangs.size / 6) * 15;
    
    // 5. Repo Count (15%) - max target 100
    const repoCountScore = logScale(repos.length, 100) * 15;
    
    const totalScore = qualityScore + followerScore + activityScore + langScore + repoCountScore;
    return Math.round(totalScore);
  }
};
