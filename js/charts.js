/**
 * Chart.js Integration
 */
const Charts = {
  instances: {},
  
  init() {
    // Register global Chart defaults to respect theme
    this.updateThemeDefaults();
    
    // Listen for theme changes to redraw
    window.addEventListener('themeChanged', () => {
      this.updateThemeDefaults();
      Object.values(this.instances).forEach(chart => chart.update());
    });
  },
  
  updateThemeDefaults() {
    if (!window.Chart) return;
    const isDark = Storage.getTheme() === 'dark';
    const textColor = isDark ? '#848d97' : '#656d76';
    const gridColor = isDark ? '#30363d' : '#d0d7de';
    
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  },
  
  // Color palette for charts
  colors: [
    '#0969da', '#1a7f37', '#cf222e', '#9a6700', '#8250df', '#bf3989', '#d4a72c'
  ],
  
  destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },
  
  renderLanguageChart(ctxId, repos) {
    this.destroyChart(ctxId);
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;
    
    const langCounts = {};
    repos.forEach(repo => {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    });
    
    const labels = Object.keys(langCounts).sort((a,b) => langCounts[b] - langCounts[a]);
    const data = labels.map(l => langCounts[l]);
    
    if (labels.length === 0) {
      // No languages found, maybe show a placeholder or hide canvas
      ctx.parentElement.innerHTML = '<p class="text-center" style="padding: 20px;">No language data available</p>';
      return;
    }
    
    this.instances[ctxId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.slice(0, 6), // Top 6
        datasets: [{
          data: data.slice(0, 6),
          backgroundColor: this.colors.slice(0, 6),
          borderWidth: 1,
          borderColor: Storage.getTheme() === 'dark' ? '#161b22' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        borderWidth: 0,
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }
        },
        animation: {
          duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000
        }
      }
    });
  },
  
  renderStarsChart(ctxId, repos) {
    this.destroyChart(ctxId);
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;
    
    // Sort by stars descending
    const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
    
    if (sorted.length === 0 || sorted[0].stargazers_count === 0) {
      ctx.parentElement.innerHTML = '<p class="text-center" style="padding: 20px;">No stars received yet</p>';
      return;
    }
    
    this.instances[ctxId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(r => Utils.truncate(r.name, 15)),
        datasets: [{
          label: 'Stars',
          data: sorted.map(r => r.stargazers_count),
          backgroundColor: 'rgba(227, 179, 65, 0.85)',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { grid: { display: false }, border: { display: false } }
        },
        animation: {
          duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000
        }
      }
    });
  },
  
  renderCompareRadarChart(ctxId, user1, user2, p1, p2, r1, r2) {
    this.destroyChart(ctxId);
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;
    
    const logScale = (val, maxTarget) => Math.min(100, (Math.log10(val + 1) / Math.log10(maxTarget + 1)) * 100);
    
    const s1Stars = r1.reduce((acc, r) => acc + r.stargazers_count, 0);
    const s2Stars = r2.reduce((acc, r) => acc + r.stargazers_count, 0);
    const s1Forks = r1.reduce((acc, r) => acc + r.forks_count, 0);
    const s2Forks = r2.reduce((acc, r) => acc + r.forks_count, 0);
    
    const getRecentPushes = (repos) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return repos.filter(repo => new Date(repo.pushed_at) > oneYearAgo).length;
    };
    
    const data1 = [
      Insights.calculateScore(p1, r1),
      logScale(p1.followers, 10000),
      logScale(s1Stars + s1Forks, 10000),
      logScale(r1.length, 100),
      Math.min(100, (getRecentPushes(r1) / Math.min(Math.max(r1.length, 1), 30)) * 100)
    ];
    
    const data2 = [
      Insights.calculateScore(p2, r2),
      logScale(p2.followers, 10000),
      logScale(s2Stars + s2Forks, 10000),
      logScale(r2.length, 100),
      Math.min(100, (getRecentPushes(r2) / Math.min(Math.max(r2.length, 1), 30)) * 100)
    ];
    
    const isDark = Storage.getTheme() === 'dark';
    
    this.instances[ctxId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Overall Score', 'Audience', 'Repo Quality', 'Volume', 'Activity'],
        datasets: [
          {
            label: user1,
            data: data1,
            backgroundColor: 'rgba(9, 105, 218, 0.3)',
            borderColor: 'rgba(9, 105, 218, 1)',
            pointBackgroundColor: 'rgba(9, 105, 218, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: user2,
            data: data2,
            backgroundColor: 'rgba(26, 127, 55, 0.3)',
            borderColor: 'rgba(26, 127, 55, 1)',
            pointBackgroundColor: 'rgba(26, 127, 55, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false },
            grid: { color: isDark ? '#30363d' : '#d0d7de' },
            angleLines: { color: isDark ? '#30363d' : '#d0d7de' },
            pointLabels: { color: isDark ? '#848d97' : '#656d76' }
          }
        }
      }
    });
  },
  
  renderCompareBarChart(ctxId, user1, user2, p1, p2, r1, r2) {
    this.destroyChart(ctxId);
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;
    
    const s1Stars = r1.reduce((acc, r) => acc + r.stargazers_count, 0);
    const s2Stars = r2.reduce((acc, r) => acc + r.stargazers_count, 0);
    const s1Forks = r1.reduce((acc, r) => acc + r.forks_count, 0);
    const s2Forks = r2.reduce((acc, r) => acc + r.forks_count, 0);
    
    this.instances[ctxId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Followers', 'Total Stars', 'Total Forks', 'Public Repos'],
        datasets: [
          {
            label: user1,
            data: [p1.followers, s1Stars, s1Forks, p1.public_repos],
            backgroundColor: 'rgba(9, 105, 218, 0.85)',
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: user2,
            data: [p2.followers, s2Stars, s2Forks, p2.public_repos],
            backgroundColor: 'rgba(26, 127, 55, 0.85)',
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            type: 'logarithmic',
            grid: { display: false },
            border: { display: false },
            ticks: {
              callback: function(value) {
                return Utils.formatNumber(value);
              }
            }
          }
        }
      }
    });
  }
};

// Initialize charts module if Chart is available
if (window.Chart) {
  Charts.init();
}
