document.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const queryUser = urlParams.get('user');
      
      const searchInput = document.getElementById('search-input');
      const searchForm = document.getElementById('search-form');
      const errContainer = document.getElementById('error-container');
      const content = document.getElementById('content-container');
      const loading = document.getElementById('loading-container');
      
      let currentRepos = [];
      
      if (queryUser) {
        searchInput.value = queryUser;
        fetchData(queryUser);
      }
      
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = searchInput.value.trim();
        if (user) {
          window.history.pushState({}, '', `?user=${encodeURIComponent(user)}`);
          fetchData(user);
        }
      });
      
      async function fetchData(username) {
        errContainer.classList.add('hidden');
        content.classList.add('hidden');
        loading.classList.remove('hidden');
        
        try {
          const profile = await API.getUserProfile(username);
          const { repos, capped } = await API.getUserRepos(username);
          const contributions = await API.getContributions(username);
          
          Storage.addHistory(username);
          currentRepos = repos;
          
          renderProfile(profile);
          renderStats(profile, repos);
          renderInsights(profile, repos);
          renderHeatmap(contributions, username);
          renderRepos(repos, capped);
          
          // Render Charts
          Charts.renderLanguageChart('lang-chart', repos);
          Charts.renderStarsChart('stars-chart', repos);
          
          // Setup Notes
          const notesArea = document.getElementById('notes-area');
          notesArea.value = Storage.getNote(username);
          notesArea.oninput = Utils.debounce((e) => {
            Storage.saveNote(username, e.target.value);
          }, 500);
          
          loading.classList.add('hidden');
          content.classList.remove('hidden');
          
        } catch (error) {
          loading.classList.add('hidden');
          errContainer.textContent = error.message;
          errContainer.classList.remove('hidden');
        }
      }
      
      function renderProfile(profile) {
        const container = document.getElementById('profile-card');
        const isFav = Storage.isFavorite(profile.login);
        const favIcon = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const favColor = isFav ? 'var(--danger-color)' : 'var(--text-secondary)';
        
        container.innerHTML = `
          <div style="position: relative;">
            <img src="${profile.avatar_url}" alt="${profile.login}" style="width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 16px auto; display: block; border: 1px solid var(--border-color);">
            <button class="btn btn-outline fav-btn" data-user='${JSON.stringify(profile).replace(/'/g, "&apos;")}' style="position: absolute; top: 0; right: 0; border: none; color: ${favColor}; font-size: 1.2rem;">
              <i class="${favIcon}"></i>
            </button>
          </div>
          <h2 style="margin-bottom: 4px;">${profile.name || profile.login}</h2>
          <p style="margin-bottom: 16px;"><a href="${profile.html_url}" target="_blank" rel="noopener noreferrer">@${profile.login}</a></p>
          ${profile.bio ? `<p style="font-size: 0.9rem;">${profile.bio}</p>` : ''}
          
          <div style="text-align: left; font-size: 0.875rem; margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
            ${profile.company ? `<div><i class="fa-regular fa-building" style="width:20px;text-align:center;"></i> ${profile.company}</div>` : ''}
            ${profile.location ? `<div><i class="fa-solid fa-location-dot" style="width:20px;text-align:center;"></i> ${profile.location}</div>` : ''}
            ${profile.blog ? `<div><i class="fa-solid fa-link" style="width:20px;text-align:center;"></i> <a href="${profile.blog.startsWith('http') ? profile.blog : 'https://'+profile.blog}" target="_blank">${profile.blog}</a></div>` : ''}
            <div><i class="fa-solid fa-calendar-days" style="width:20px;text-align:center;"></i> Joined ${Utils.formatDate(profile.created_at)}</div>
          </div>
        `;
      }
      
      function renderStats(profile, repos) {
        const container = document.getElementById('stats-row');
        let totalStars = 0;
        let totalForks = 0;
        repos.forEach(r => { totalStars += r.stargazers_count; totalForks += r.forks_count; });
        
        const stats = [
          { label: 'Followers', val: profile.followers },
          { label: 'Following', val: profile.following },
          { label: 'Repositories', val: profile.public_repos },
          { label: 'Total Stars', val: totalStars },
          { label: 'Total Forks', val: totalForks }
        ];
        
        container.innerHTML = stats.map(s => `
          <div class="card" style="flex: 1; min-width: 120px; text-align: center; padding: var(--spacing-sm) var(--spacing-xs);">
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${Utils.formatNumber(s.val)}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">${s.label}</div>
          </div>
        `).join('');
      }
      
      function renderInsights(profile, repos) {
        const score = Insights.calculateScore(profile, repos);
        UI.renderScoreRing(score, 'score-container');
        
        const roles = Insights.classifyRole(repos);
        const exp = Insights.classifyExperience(profile, repos);
        
        const tags = document.getElementById('insights-tags');
        tags.innerHTML = `
          <span class="badge badge-success">${exp}</span>
          ${roles.map(r => `<span class="badge badge-outline" style="background: var(--accent-color); color: white; border: none;">${r}</span>`).join('')}
        `;
      }
      
      function renderHeatmap(data, username) {
        const container = document.getElementById('heatmap-container');
        if (!data || !data.contributions) {
          container.innerHTML = `<p class="text-center" style="color: var(--text-secondary);">Contribution data unavailable for this user.</p>`;
          return;
        }
        
        // Heatmap Grid
        let gridHtml = '<div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 8px;">';
        const weeks = [];
        let currentWeek = [];
        data.contributions.forEach((day, index) => {
          // Assuming proxy data returns array of days, we group into columns (weeks) starting on Sunday (0)
          const d = new Date(day.date + 'T12:00:00Z');
          if (d.getDay() === 0 && index !== 0) {
            weeks.push(currentWeek);
            currentWeek = [];
          }
          currentWeek.push(day);
        });
        if (currentWeek.length > 0) weeks.push(currentWeek);
        
        const isDark = Storage.getTheme() === 'dark';
        const emptyColor = isDark ? '#161b22' : '#ebedf0';
        
        weeks.forEach(week => {
          gridHtml += '<div style="display: flex; flex-direction: column; gap: 4px;">';
          if (week === weeks[0]) {
             const firstDay = new Date(week[0].date + 'T12:00:00Z').getDay();
             for(let i=0; i<firstDay; i++) {
               gridHtml += '<div style="width: 12px; height: 12px;"></div>';
             }
          }
          week.forEach(day => {
            let bg = emptyColor;
            if (day.intensity > 0) {
              const intensityMap = isDark 
                ? ['#0e4429', '#006d32', '#26a641', '#39d353'] 
                : ['#9be9a8', '#40c463', '#30a14e', '#216e39'];
              bg = intensityMap[Math.min(day.intensity - 1, 3)] || intensityMap[3];
            }
            gridHtml += `<div title="${day.count} contributions on ${day.date}" style="width: 12px; height: 12px; border-radius: 2px; background-color: ${bg};"></div>`;
          });
          gridHtml += '</div>';
        });
        gridHtml += '</div>';

        container.innerHTML = `
          <div style="display: flex; gap: 24px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Total Contributions (Last Year)</div>
              <div style="font-size: 1.25rem; font-weight: bold;">${Utils.formatNumber(data.total[new Date().getFullYear()] || 0)}</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Current Streak</div>
              <div style="font-size: 1.25rem; font-weight: bold;">${data.streak ? data.streak.current : 0} days</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Longest Streak</div>
              <div style="font-size: 1.25rem; font-weight: bold;">${data.streak ? data.streak.longest : 0} days</div>
            </div>
          </div>
          ${gridHtml}
        `;
      }
      
      function renderRepos(repos, capped) {
        const container = document.getElementById('repos-container');
        
        const doRender = (repoList) => {
          if (repoList.length === 0) {
            container.innerHTML = `<p class="text-center">No repositories found.</p>`;
            return;
          }
          
          let html = repoList.slice(0, 50).map(r => UI.createRepoCard(r)).join(''); // limit display for perf
          if (capped) {
            html += `<p class="text-center" style="color: var(--warning-color); font-size: 0.875rem;">Showing first 300 repositories due to API limits.</p>`;
          }
          container.innerHTML = html;
        };
        
        doRender(repos);
        
        const filterInput = document.getElementById('repo-filter');
        filterInput.addEventListener('input', (e) => {
          const term = e.target.value.toLowerCase();
          const filtered = repos.filter(r => r.name.toLowerCase().includes(term) || (r.description && r.description.toLowerCase().includes(term)));
          doRender(filtered);
        });
      }
      
    });