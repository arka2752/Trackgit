document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('compare-form');
      const input1 = document.getElementById('user1');
      const input2 = document.getElementById('user2');
      const errorContainer = document.getElementById('error-container');
      const loadingContainer = document.getElementById('loading-container');
      const resultsContainer = document.getElementById('results-container');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u1 = input1.value.trim();
        const u2 = input2.value.trim();
        if (!u1 || !u2 || u1.toLowerCase() === u2.toLowerCase()) return;
        
        errorContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        loadingContainer.classList.remove('hidden');
        
        try {
          // Fetch profiles concurrently
          const [p1, p2] = await Promise.all([
            API.getUserProfile(u1),
            API.getUserProfile(u2)
          ]);
          
          // Fetch repos concurrently
          const [r1Res, r2Res] = await Promise.all([
            API.getUserRepos(u1),
            API.getUserRepos(u2)
          ]);
          
          const r1 = r1Res.repos;
          const r2 = r2Res.repos;
          
          renderComparison(p1, p2, r1, r2);
          
          loadingContainer.classList.add('hidden');
          resultsContainer.classList.remove('hidden');
          
        } catch (error) {
          loadingContainer.classList.add('hidden');
          errorContainer.textContent = error.message;
          errorContainer.classList.remove('hidden');
        }
      });
      
      function renderComparison(p1, p2, r1, r2) {
        document.getElementById('th-user1').innerHTML = `
          <img src="${p1.avatar_url}" style="width:50px; border-radius:50%; margin:0 auto 8px auto;">
          <div><a href="search.html?user=${p1.login}">@${p1.login}</a></div>
        `;
        document.getElementById('th-user2').innerHTML = `
          <img src="${p2.avatar_url}" style="width:50px; border-radius:50%; margin:0 auto 8px auto;">
          <div><a href="search.html?user=${p2.login}">@${p2.login}</a></div>
        `;
        
        let s1Stars = 0, s1Forks = 0;
        r1.forEach(r => { s1Stars += r.stargazers_count; s1Forks += r.forks_count; });
        
        let s2Stars = 0, s2Forks = 0;
        r2.forEach(r => { s2Stars += r.stargazers_count; s2Forks += r.forks_count; });
        
        const score1 = Insights.calculateScore(p1, r1);
        const score2 = Insights.calculateScore(p2, r2);
        
        const metrics = [
          { label: 'Developer Score', v1: score1, v2: score2, fmt: Utils.formatNumber },
          { label: 'Followers', v1: p1.followers, v2: p2.followers, fmt: Utils.formatNumber },
          { label: 'Public Repositories', v1: p1.public_repos, v2: p2.public_repos, fmt: Utils.formatNumber },
          { label: 'Total Stars', v1: s1Stars, v2: s2Stars, fmt: Utils.formatNumber },
          { label: 'Total Forks', v1: s1Forks, v2: s2Forks, fmt: Utils.formatNumber },
        ];
        
        const tbody = document.getElementById('compare-body');
        tbody.innerHTML = metrics.map(m => {
          const classes = Compare.getHighlightClasses(m.v1, m.v2);
          return `
            <tr>
              <td>${m.label}</td>
              <td><span class="${classes.c1}">${m.fmt(m.v1)}</span></td>
              <td><span class="${classes.c2}">${m.fmt(m.v2)}</span></td>
            </tr>
          `;
        }).join('');
        
        // Add roles non-comparable
        const role1 = Insights.classifyRole(r1).join(', ');
        const role2 = Insights.classifyRole(r2).join(', ');
        
        tbody.innerHTML += `
          <tr>
            <td>Predicted Focus</td>
            <td>${role1}</td>
            <td>${role2}</td>
          </tr>
        `;
        
        // Render Charts
        Charts.renderCompareRadarChart('compare-radar-chart', p1.login, p2.login, p1, p2, r1, r2);
        Charts.renderCompareBarChart('compare-bar-chart', p1.login, p2.login, p1, p2, r1, r2);
        
        // Generate Text Insights
        const insightsList = document.getElementById('compare-insights');
        const insights = [];
        
        // Score comparison
        if (score1 > score2 + 10) insights.push(`<strong>${p1.name || p1.login}</strong> has a significantly higher Developer Score than ${p2.name || p2.login}.`);
        else if (score2 > score1 + 10) insights.push(`<strong>${p2.name || p2.login}</strong> has a significantly higher Developer Score than ${p1.name || p1.login}.`);
        else insights.push(`Both developers have very similar overall Developer Scores.`);
        
        // Audience
        if (p1.followers > p2.followers * 2) insights.push(`<strong>${p1.name || p1.login}</strong> has a much larger audience (more than double the followers).`);
        else if (p2.followers > p1.followers * 2) insights.push(`<strong>${p2.name || p2.login}</strong> has a much larger audience (more than double the followers).`);
        
        // Roles
        if (role1 !== role2) {
          insights.push(`Their primary focus differs: <strong>${p1.name || p1.login}</strong> is a ${role1 || 'Generalist'}, whereas <strong>${p2.name || p2.login}</strong> is a ${role2 || 'Generalist'}.`);
        } else {
          insights.push(`Both developers share a similar technical focus (${role1}).`);
        }
        
        // Repo Impact
        const impact1 = s1Stars + s1Forks;
        const impact2 = s2Stars + s2Forks;
        if (impact1 > impact2 * 2) insights.push(`Repositories by <strong>${p1.name || p1.login}</strong> have generated considerably more community engagement (stars/forks).`);
        else if (impact2 > impact1 * 2) insights.push(`Repositories by <strong>${p2.name || p2.login}</strong> have generated considerably more community engagement (stars/forks).`);
        
        insightsList.innerHTML = insights.map(i => `<li>${i}</li>`).join('');
      }
    });