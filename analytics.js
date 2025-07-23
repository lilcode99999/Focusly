class AnalyticsDashboard {
  constructor() {
    this.currentRange = 'today';
    this.data = {
      timeSessions: [],
      dailyStats: {},
      analytics: []
    };
    
    this.init();
  }
  
  async init() {
    // Check Pro status first
    const { isPro } = await chrome.storage.sync.get(['isPro']);
    
    if (!isPro) {
      // Show upgrade prompt instead of analytics
      this.showUpgradePrompt();
      return;
    }
    
    await this.loadData();
    this.setupDateRangeSelector();
    this.updateDashboard();
    
    // Update every 30 seconds
    setInterval(() => {
      this.loadData().then(() => this.updateDashboard());
    }, 30000);
  }
  
  showUpgradePrompt() {
    const container = document.querySelector('.analytics-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px;">
          <h2>Analytics Dashboard is a Pro Feature</h2>
          <p style="color: #666; margin: 20px 0;">
            Unlock detailed insights into your browsing habits and productivity patterns with Smart Bookmarks Pro.
          </p>
          <button class="btn-primary" id="analyticsUpgradeBtn" style="
            padding: 12px 24px;
            background: #4A90E2;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">
            Upgrade to Pro - $9.99/month
          </button>
        </div>
      `;
      
      document.getElementById('analyticsUpgradeBtn')?.addEventListener('click', () => {
        window.location.href = chrome.runtime.getURL('options.html');
      });
    }
  }
  
  async loadData() {
    try {
      const result = await chrome.storage.local.get(['timeSessions', 'dailyStats', 'analytics']);
      this.data = {
        timeSessions: result.timeSessions || [],
        dailyStats: result.dailyStats || {},
        analytics: result.analytics || []
      };
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }
  
  setupDateRangeSelector() {
    const options = document.querySelectorAll('.date-range-option');
    
    options.forEach(option => {
      option.addEventListener('click', () => {
        options.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        this.currentRange = option.dataset.range;
        this.updateDashboard();
      });
    });
  }
  
  updateDashboard() {
    const stats = this.calculateStats();
    this.updateStatsCards(stats);
    this.updateTopSites(stats.topSites);
    this.updateInsights(stats);
    this.renderCharts(stats);
  }
  
  calculateStats() {
    const now = new Date();
    const dateRange = this.getDateRange(this.currentRange);
    
    // Filter data based on date range
    const filteredSessions = this.data.timeSessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    });
    
    // Calculate total active time
    const totalActiveTime = filteredSessions.reduce((total, session) => {
      return total + (session.activeTime || 0);
    }, 0);
    
    // Calculate sites visited
    const uniqueSites = new Set(filteredSessions.map(session => session.domain));
    const sitesVisited = uniqueSites.size;
    
    // Calculate focus score (based on ratio of productive vs distracting sites)
    const focusScore = this.calculateFocusScore(filteredSessions);
    
    // Calculate bookmarks added
    const bookmarksAdded = this.data.analytics.filter(event => 
      event.type === 'bookmark_click' && 
      new Date(event.timestamp) >= dateRange.start &&
      new Date(event.timestamp) <= dateRange.end
    ).length;
    
    // Calculate top sites
    const topSites = this.calculateTopSites(filteredSessions);
    
    // Calculate changes from previous period
    const previousStats = this.calculatePreviousPeriodStats();
    
    return {
      totalActiveTime,
      sitesVisited,
      focusScore,
      bookmarksAdded,
      topSites,
      changes: {
        time: this.calculateChange(totalActiveTime, previousStats.totalActiveTime),
        sites: this.calculateChange(sitesVisited, previousStats.sitesVisited),
        focus: this.calculateChange(focusScore, previousStats.focusScore),
        bookmarks: this.calculateChange(bookmarksAdded, previousStats.bookmarksAdded)
      },
      hourlyBreakdown: this.calculateHourlyBreakdown(filteredSessions),
      dailyPattern: this.calculateDailyPattern(filteredSessions)
    };
  }
  
  getDateRange(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          start: today,
          end: now
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart,
          end: now
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          start: monthStart,
          end: now
        };
      default:
        return { start: today, end: now };
    }
  }
  
  calculateFocusScore(sessions) {
    if (sessions.length === 0) return 0;
    
    const productiveSites = [
      'github.com', 'stackoverflow.com', 'docs.', 'developer.',
      'mdn.', 'w3schools.com', 'coursera.org', 'udemy.com',
      'linkedin.com/learning', 'pluralsight.com'
    ];
    
    const distractingSites = [
      'youtube.com', 'netflix.com', 'reddit.com', 'twitter.com',
      'facebook.com', 'instagram.com', 'tiktok.com', 'twitch.tv'
    ];
    
    let productiveTime = 0;
    let distractingTime = 0;
    let totalTime = 0;
    
    sessions.forEach(session => {
      const domain = session.domain;
      const time = session.activeTime || 0;
      totalTime += time;
      
      if (productiveSites.some(site => domain.includes(site))) {
        productiveTime += time;
      } else if (distractingSites.some(site => domain.includes(site))) {
        distractingTime += time;
      }
    });
    
    if (totalTime === 0) return 0;
    
    return Math.round((productiveTime / totalTime) * 100);
  }
  
  calculateTopSites(sessions) {
    const siteStats = {};
    
    sessions.forEach(session => {
      const domain = session.domain;
      if (!siteStats[domain]) {
        siteStats[domain] = {
          domain,
          activeTime: 0,
          visits: 0,
          title: this.getDomainTitle(domain)
        };
      }
      
      siteStats[domain].activeTime += session.activeTime || 0;
      siteStats[domain].visits += 1;
    });
    
    return Object.values(siteStats)
      .sort((a, b) => b.activeTime - a.activeTime)
      .slice(0, 10);
  }
  
  getDomainTitle(domain) {
    const titles = {
      'github.com': 'GitHub',
      'stackoverflow.com': 'Stack Overflow',
      'youtube.com': 'YouTube',
      'google.com': 'Google',
      'reddit.com': 'Reddit',
      'twitter.com': 'Twitter',
      'linkedin.com': 'LinkedIn',
      'facebook.com': 'Facebook'
    };
    
    return titles[domain] || domain.replace('www.', '').split('.')[0];
  }
  
  calculatePreviousPeriodStats() {
    // Calculate stats for the previous period to show changes
    const previousRange = this.getPreviousDateRange(this.currentRange);
    
    const previousSessions = this.data.timeSessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= previousRange.start && sessionDate <= previousRange.end;
    });
    
    const totalActiveTime = previousSessions.reduce((total, session) => {
      return total + (session.activeTime || 0);
    }, 0);
    
    const uniqueSites = new Set(previousSessions.map(session => session.domain));
    const sitesVisited = uniqueSites.size;
    const focusScore = this.calculateFocusScore(previousSessions);
    
    const bookmarksAdded = this.data.analytics.filter(event => 
      event.type === 'bookmark_click' && 
      new Date(event.timestamp) >= previousRange.start &&
      new Date(event.timestamp) <= previousRange.end
    ).length;
    
    return {
      totalActiveTime,
      sitesVisited,
      focusScore,
      bookmarksAdded
    };
  }
  
  getPreviousDateRange(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          start: yesterday,
          end: today
        };
      case 'week':
        const prevWeekEnd = new Date(today);
        prevWeekEnd.setDate(today.getDate() - 7);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekEnd.getDate() - 7);
        return {
          start: prevWeekStart,
          end: prevWeekEnd
        };
      case 'month':
        const prevMonthEnd = new Date(today);
        prevMonthEnd.setDate(today.getDate() - 30);
        const prevMonthStart = new Date(prevMonthEnd);
        prevMonthStart.setDate(prevMonthEnd.getDate() - 30);
        return {
          start: prevMonthStart,
          end: prevMonthEnd
        };
      default:
        return this.getDateRange('today');
    }
  }
  
  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  calculateHourlyBreakdown(sessions) {
    const hourlyData = new Array(24).fill(0);
    
    sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      hourlyData[hour] += session.activeTime || 0;
    });
    
    return hourlyData;
  }
  
  calculateDailyPattern(sessions) {
    const dailyData = {};
    
    sessions.forEach(session => {
      const date = new Date(session.timestamp).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += session.activeTime || 0;
    });
    
    return dailyData;
  }
  
  updateStatsCards(stats) {
    // Update total time
    const totalTimeEl = document.getElementById('totalTime');
    totalTimeEl.textContent = this.formatTime(stats.totalActiveTime);
    
    // Update sites visited
    const sitesVisitedEl = document.getElementById('sitesVisited');
    sitesVisitedEl.textContent = stats.sitesVisited;
    
    // Update focus score
    const focusScoreEl = document.getElementById('focusScore');
    focusScoreEl.textContent = `${stats.focusScore}%`;
    
    // Update bookmarks added
    const bookmarksAddedEl = document.getElementById('bookmarksAdded');
    bookmarksAddedEl.textContent = stats.bookmarksAdded;
    
    // Update change indicators
    this.updateChangeIndicator('timeChange', stats.changes.time, 'from yesterday');
    this.updateChangeIndicator('sitesChange', stats.changes.sites, 'from yesterday');
    this.updateChangeIndicator('focusChange', stats.changes.focus, 'from yesterday');
    this.updateChangeIndicator('bookmarksChange', stats.changes.bookmarks, 'from yesterday');
  }
  
  updateChangeIndicator(elementId, change, suffix) {
    const element = document.getElementById(elementId);
    const isPositive = change >= 0;
    const prefix = isPositive ? '+' : '';
    
    element.textContent = `${prefix}${change}% ${suffix}`;
    element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
  }
  
  updateTopSites(topSites) {
    const container = document.getElementById('topSitesList');
    
    if (topSites.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No data available for this period</p>';
      return;
    }
    
    const maxTime = Math.max(...topSites.map(site => site.activeTime));
    
    container.innerHTML = topSites.map(site => {
      const percentage = maxTime > 0 ? (site.activeTime / maxTime) * 100 : 0;
      const favicon = this.getFaviconForDomain(site.domain);
      
      return `
        <div class="site-item">
          <div class="site-favicon">${favicon}</div>
          <div class="site-info">
            <div class="site-name">${this.escapeHtml(site.title)}</div>
            <div class="site-url">${this.escapeHtml(site.domain)}</div>
          </div>
          <div class="site-stats">
            <div class="site-time">${this.formatTime(site.activeTime)}</div>
            <div class="site-visits">${site.visits} visit${site.visits !== 1 ? 's' : ''}</div>
            <div class="site-progress">
              <div class="site-progress-bar" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  getFaviconForDomain(domain) {
    const icons = {
      'github.com': '🐙',
      'stackoverflow.com': '📚',
      'youtube.com': '📺',
      'google.com': '🔍',
      'reddit.com': '🔴',
      'twitter.com': '🐦',
      'linkedin.com': '💼',
      'facebook.com': '📘',
      'instagram.com': '📸',
      'netflix.com': '🎬',
      'docs.': '📖',
      'developer.': '👨‍💻'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (domain.includes(key)) {
        return icon;
      }
    }
    
    return '🌐';
  }
  
  updateInsights(stats) {
    // Generate dynamic insights based on data
    const insights = this.generateInsights(stats);
    
    // Update insight cards with real data
    const insightCards = document.querySelectorAll('.insight-card');
    insights.forEach((insight, index) => {
      if (insightCards[index]) {
        const titleEl = insightCards[index].querySelector('.insight-title');
        const descEl = insightCards[index].querySelector('.insight-description');
        
        if (titleEl) titleEl.textContent = insight.title;
        if (descEl) descEl.innerHTML = insight.description;
      }
    });
  }
  
  generateInsights(stats) {
    const insights = [];
    
    // Focus pattern insight
    const peakHour = this.findPeakProductivityHour(stats.hourlyBreakdown);
    insights.push({
      title: 'Focus Patterns',
      description: `Your most productive hour is <span class="insight-highlight">${peakHour}</span>. Your focus score is ${stats.focusScore}% this period.`
    });
    
    // Distraction analysis
    const focusImprovement = stats.changes.focus;
    insights.push({
      title: 'Distraction Analysis',
      description: `Your focus score ${focusImprovement >= 0 ? 'improved' : 'decreased'} by <span class="insight-highlight">${Math.abs(focusImprovement)}%</span> compared to the previous period.`
    });
    
    // Bookmark behavior
    insights.push({
      title: 'Bookmark Behavior',
      description: `You've added <span class="insight-highlight">${stats.bookmarksAdded} bookmarks</span> this period. Most bookmarking happens during productive hours.`
    });
    
    // Productivity tip
    const avgSessionLength = this.calculateAverageSessionLength();
    insights.push({
      title: 'Productivity Tip',
      description: `Your average session length is <span class="insight-highlight">${this.formatTime(avgSessionLength)}</span>. Consider using the Pomodoro technique for better focus.`
    });
    
    return insights;
  }
  
  findPeakProductivityHour(hourlyData) {
    const maxValue = Math.max(...hourlyData);
    const peakHour = hourlyData.indexOf(maxValue);
    
    const hour12 = peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour;
    const ampm = peakHour < 12 ? 'AM' : 'PM';
    
    return `${hour12}:00 ${ampm}`;
  }
  
  calculateAverageSessionLength() {
    if (this.data.timeSessions.length === 0) return 0;
    
    const totalTime = this.data.timeSessions.reduce((total, session) => {
      return total + (session.activeTime || 0);
    }, 0);
    
    return totalTime / this.data.timeSessions.length;
  }
  
  renderCharts(stats) {
    // Simple chart placeholders - in a real implementation, you'd use Chart.js or similar
    const timeChart = document.getElementById('timeChart');
    const patternChart = document.getElementById('patternChart');
    
    timeChart.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${this.formatTime(stats.totalActiveTime)}</div>
        <div style="color: var(--text-secondary);">Total Active Time</div>
        <div style="margin-top: 16px; color: var(--text-tertiary); font-size: 12px;">Chart visualization would go here</div>
      </div>
    `;
    
    patternChart.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${stats.focusScore}%</div>
        <div style="color: var(--text-secondary);">Focus Score</div>
        <div style="margin-top: 16px; color: var(--text-tertiary); font-size: 12px;">Daily pattern chart would go here</div>
      </div>
    `;
  }
  
  formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0m';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AnalyticsDashboard();
});