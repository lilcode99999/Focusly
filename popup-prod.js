/**
 * Smart Bookmarks - Professional Productivity Extension
 * ADHD-optimized bookmark management with focus features
 */

class SmartBookmarksApp {
  constructor() {
    // App state
    this.currentTab = 'focus';
    this.isTimerRunning = false;
    this.timerInterval = null;
    this.syncInterval = null;
    this.totalSeconds = 25 * 60; // Default 25 minutes
    this.currentSeconds = this.totalSeconds;
    this.sessionStartTime = null;
    this.isBreakTime = false;
    
    // User data - REAL DATA ONLY, no mock data
    this.userData = {
      todayFocusTime: 0, // Minutes of actual focus time completed today
      weeklyStreak: 0,   // Consecutive days with completed focus sessions
      completedSessions: 0, // Number of completed focus sessions today
      totalFocusTime: 0, // All-time focus time in minutes
      focusSessions: [], // Array of completed session objects
      lastSessionDate: null, // Track daily streak
      // Daily goals
      dailyGoalType: 'time', // 'time' or 'sessions'
      dailyGoalMinutes: 120, // Default 2 hours
      dailyGoalSessions: 4, // Default 4 sessions
      goalStreak: 0, // Days in a row hitting goals
      lastGoalDate: null // Track goal streaks
    };
    
    // Settings
    this.settings = {
      defaultDuration: 25,
      autoBreaks: false,
      sound: true,
      theme: 'system',
      reducedMotion: false,
      desktopNotifications: true,
      breakReminders: true,
      analytics: true
    };
    
    // Account state
    this.user = null;
    this.isAuthenticated = false;
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing Smart Bookmarks App');
      
      // Load user data and settings
      await this.loadData();
      
      // Sync with background timer state
      await this.syncTimerState();
      
      // Set up event listeners
      this.setupTabNavigation();
      this.setupTimerControls();
      this.setupSettings();
      this.setupQuickActions();
      this.setupBookmarkFunctionality();
      this.setupAccountManagement();
      this.setupBreakActions();
      this.setupNotificationPanel();
      this.setupNotesTab();
      this.setupProModal();
      
      // Initialize UI
      this.updateStatsDisplay();
      this.updateTimerDisplay();
      this.renderAccountSection();
      this.applySettings();
      this.updateNotificationBadge();
      
      // Initialize chart after DOM is ready
      setTimeout(() => {
        this.updateFocusChart();
      }, 100);
      
      // Request notification permission
      if (this.settings.desktopNotifications) {
        this.requestNotificationPermission();
      }
      
      // Set up periodic timer sync
      this.startTimerSync();
      
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'timerComplete') {
          // Reload user data to get updated progress
          this.loadData().then(() => {
            this.updateStatsDisplay();
            this.updateTimerDisplay();
          });
        }
      });
      
      // Clean up intervals when popup closes
      window.addEventListener('unload', () => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        if (this.syncInterval) {
          clearInterval(this.syncInterval);
        }
      });
      
      
    } catch (error) {
      console.error('❌ Failed to initialize Smart Bookmarks:', error);
      this.showNotification('Initialization failed', 'error');
    }
  }
  
  async syncTimerState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      console.log('🟡 Popup syncTimerState response:', response);
      if (response && response.timerState) {
        const state = response.timerState;
        console.log('🟡 Timer state received:', state);
        
        // Update local timer state from background
        if (state.isRunning && state.startTime) {
          const elapsed = Date.now() - state.startTime;
          const remaining = Math.max(0, state.duration - elapsed);
          
          this.currentSeconds = Math.floor(remaining / 1000);
          this.totalSeconds = Math.floor(state.duration / 1000);
          this.isTimerRunning = state.isRunning;
          this.isBreakTime = state.mode === 'break';
          
          // Update play/pause icon
          document.getElementById('playPauseIcon').textContent = '⏸';
          
          // Resume timer display updates
          if (this.isTimerRunning && this.currentSeconds > 0 && !this.timerInterval) {
            this.resumeTimerDisplay();
          }
        } else if (state.pausedTime) {
          // Timer is paused
          this.currentSeconds = Math.floor(state.timeRemaining / 1000);
          this.totalSeconds = Math.floor(state.duration / 1000);
          this.isTimerRunning = false;
          this.isBreakTime = state.mode === 'break';
          
          // Update play/pause icon
          document.getElementById('playPauseIcon').textContent = '▶';
          
          // Clear any running interval
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          }
        } else {
          // Timer is stopped
          this.currentSeconds = Math.floor(state.duration / 1000);
          this.totalSeconds = Math.floor(state.duration / 1000);
          this.isTimerRunning = false;
          this.isBreakTime = state.mode === 'break';
          
          // Update play/pause icon
          document.getElementById('playPauseIcon').textContent = '▶';
          
          // Clear any running interval
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          }
        }
        
        this.updateTimerDisplay();
        this.updateProgressCircle();
      }
    } catch (error) {
      console.error('Failed to sync timer state:', error);
    }
  }
  
  startTimerSync() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync timer state every second while popup is open
    this.syncInterval = setInterval(() => {
      if (this.isTimerRunning) {
        this.syncTimerState();
      }
    }, 1000);
  }
  
  resumeTimerDisplay() {
    // Local display update only - actual timer runs in background
    this.timerInterval = setInterval(() => {
      if (this.currentSeconds > 0) {
        this.currentSeconds--;
        this.updateTimerDisplay();
        this.updateProgressCircle();
      } else {
        // Timer completed - sync with background
        this.syncTimerState();
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  async loadData() {
    try {
      const stored = await chrome.storage.local.get([
        'userData', 'settings', 'user', 'lastActiveDate'
      ]);
      
      if (stored.userData) {
        this.userData = { ...this.userData, ...stored.userData };
      }
      
      if (stored.settings) {
        this.settings = { ...this.settings, ...stored.settings };
      }
      
      if (stored.user) {
        this.user = stored.user;
        this.isAuthenticated = true;
      }
      
      // Reset daily stats if new day
      const today = new Date().toDateString();
      if (stored.lastActiveDate !== today) {
        // Check if yesterday's goal was met before resetting
        if (stored.lastActiveDate) {
          const goalMet = this.userData.dailyGoalType === 'time' 
            ? this.userData.todayFocusTime >= this.userData.dailyGoalMinutes
            : this.userData.completedSessions >= this.userData.dailyGoalSessions;
          
          if (goalMet) {
            // Update goal streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (this.userData.lastGoalDate === yesterday.toDateString()) {
              this.userData.goalStreak++;
            } else {
              this.userData.goalStreak = 1;
            }
            this.userData.lastGoalDate = stored.lastActiveDate;
          } else if (this.userData.todayFocusTime > 0) {
            // Reset streak if goal wasn't met
            this.userData.goalStreak = 0;
          }
        }
        
        // Reset daily stats
        this.userData.todayFocusTime = 0;
        this.userData.completedSessions = 0;
        this.goalCelebrated = false;
        
        await this.saveUserData();
        await chrome.storage.local.set({ lastActiveDate: today });
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async saveUserData() {
    try {
      await chrome.storage.local.set({ userData: this.userData });
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.switchTab('focus');
            break;
          case '2':
            e.preventDefault();
            this.switchTab('notes');
            break;
          case '3':
            e.preventDefault();
            this.switchTab('ai');
            break;
          case '4':
            e.preventDefault();
            this.switchTab('hub');
            break;
          case '5':
            e.preventDefault();
            this.switchTab('settings');
            break;
        }
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    this.currentTab = tabName;
  }

  setupTimerControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    playPauseBtn.addEventListener('click', () => {
      if (this.isTimerRunning) {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    });
    
    resetBtn.addEventListener('click', () => {
      this.resetTimer();
    });
    
    decreaseBtn.addEventListener('click', async () => {
      if (!this.isTimerRunning && this.currentSeconds > 60) {
        this.currentSeconds -= 60;
        this.totalSeconds = this.currentSeconds;
        this.updateTimerDisplay();
        
        // Update background timer state
        await chrome.runtime.sendMessage({
          action: 'resetTimer',
          duration: Math.floor(this.totalSeconds / 60)
        });
      }
    });
    
    increaseBtn.addEventListener('click', async () => {
      if (!this.isTimerRunning && this.currentSeconds < 60 * 60) {
        this.currentSeconds += 60;
        this.totalSeconds = this.currentSeconds;
        this.updateTimerDisplay();
        
        // Update background timer state
        await chrome.runtime.sendMessage({
          action: 'resetTimer',
          duration: Math.floor(this.totalSeconds / 60)
        });
      }
    });
    
    presetBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.isTimerRunning) {
          const minutes = parseInt(btn.getAttribute('data-minutes'));
          this.setTimerDuration(minutes);
          
          // Update active preset
          presetBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update background timer state
          await chrome.runtime.sendMessage({
            action: 'resetTimer',
            duration: minutes
          });
        }
      });
    });
  }

  setTimerDuration(minutes) {
    this.totalSeconds = minutes * 60;
    this.currentSeconds = this.totalSeconds;
    this.updateTimerDisplay();
  }

  async startTimer() {
    try {
      // Send message to background to start timer
      await chrome.runtime.sendMessage({
        action: 'startTimer',
        mode: this.isBreakTime ? 'break' : 'focus',
        duration: Math.floor(this.totalSeconds / 60) // Convert to minutes
      });
      
      this.isTimerRunning = true;
      this.sessionStartTime = Date.now();
      document.getElementById('playPauseIcon').textContent = '⏸';
      
      // Start local display updates
      this.resumeTimerDisplay();
      
      this.showNotification(this.isBreakTime ? 'Break started' : 'Focus session started', 'success');
      
      // Add to notification history
      await this.addNotification({
        title: this.isBreakTime ? '☕ Break Started' : '🎯 Focus Session Started',
        message: `${Math.floor(this.totalSeconds / 60)}-minute ${this.isBreakTime ? 'break' : 'focus'} timer running`
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
      this.showNotification('Failed to start timer', 'error');
    }
  }

  async pauseTimer() {
    try {
      // Send message to background to pause timer
      await chrome.runtime.sendMessage({ action: 'pauseTimer' });
      
      this.isTimerRunning = false;
      clearInterval(this.timerInterval);
      document.getElementById('playPauseIcon').textContent = '▶';
      
      this.showNotification('Timer paused', 'warning');
    } catch (error) {
      console.error('Failed to pause timer:', error);
      this.showNotification('Failed to pause timer', 'error');
    }
  }

  async resetTimer() {
    try {
      // Send message to background to reset timer
      await chrome.runtime.sendMessage({
        action: 'resetTimer',
        duration: Math.floor(this.totalSeconds / 60)
      });
      
      this.isTimerRunning = false;
      clearInterval(this.timerInterval);
      this.currentSeconds = this.totalSeconds;
      document.getElementById('playPauseIcon').textContent = '▶';
      this.updateTimerDisplay();
      this.updateProgressCircle();
      
      // Sync with background state
      await this.syncTimerState();
    } catch (error) {
      console.error('Failed to reset timer:', error);
      this.showNotification('Failed to reset timer', 'error');
    }
  }

  async completeSession() {
    // Timer completion is handled by background script
    // This method is now only called when popup detects completion during sync
    // All session recording and notifications are handled by background.js
    
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    
    // Reload user data to get updated stats from background
    await this.loadData();
    
    // Update displays with fresh data
    this.updateStatsDisplay();
    this.updateTimerDisplay();
    
    // Reset timer display for next session
    this.currentSeconds = this.totalSeconds;
  }

  async startBreakTimer() {
    try {
      // Send message to background to start break timer
      await chrome.runtime.sendMessage({
        type: 'startBreakTimer',
        duration: 5 // 5-minute break
      });
      
      this.isBreakTime = true;
      this.setTimerDuration(5);
      await this.syncTimerState();
      
      this.showNotification('Break time! Take a moment to recharge.', 'success');
    } catch (error) {
      console.error('Failed to start break timer:', error);
      this.showNotification('Failed to start break', 'error');
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.currentSeconds / 60);
    const seconds = this.currentSeconds % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = display;
    }
    
    // Update state label
    const stateLabel = document.getElementById('stateLabel');
    if (stateLabel) {
      if (this.isTimerRunning) {
        if (this.isBreakTime) {
          stateLabel.textContent = '☕ Break Time';
          stateLabel.style.color = 'var(--success)';
        } else {
          stateLabel.textContent = '🎯 Focus Session';
          stateLabel.style.color = 'var(--primary)';
        }
      } else if (this.currentSeconds < this.totalSeconds) {
        if (this.isBreakTime) {
          stateLabel.textContent = '☕ Break Paused';
          stateLabel.style.color = 'var(--warning)';
        } else {
          stateLabel.textContent = '⏸ Focus Paused';
          stateLabel.style.color = 'var(--warning)';
        }
      } else {
        if (this.isBreakTime) {
          stateLabel.textContent = '✅ Break Ready';
          stateLabel.style.color = 'var(--success)';
        } else {
          stateLabel.textContent = '🚀 Ready to Focus';
          stateLabel.style.color = 'var(--text-secondary)';
        }
      }
    }
    
    // Update goal progress display
    const sessionCounter = document.getElementById('sessionCounter');
    const progressBar = document.getElementById('goalProgressBar');
    
    if (sessionCounter) {
      let progressPercent = 0;
      
      if (this.userData.dailyGoalType === 'time') {
        const hours = Math.floor(this.userData.todayFocusTime / 60);
        const minutes = this.userData.todayFocusTime % 60;
        const goalHours = Math.floor(this.userData.dailyGoalMinutes / 60);
        const goalMinutes = this.userData.dailyGoalMinutes % 60;
        
        const current = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        const goal = goalHours > 0 ? `${goalHours}h ${goalMinutes > 0 ? goalMinutes + 'm' : ''}` : `${goalMinutes}m`;
        
        sessionCounter.textContent = `Today's Progress: ${current} / ${goal}`;
        progressPercent = Math.min((this.userData.todayFocusTime / this.userData.dailyGoalMinutes) * 100, 100);
      } else {
        sessionCounter.textContent = `Today's Progress: ${this.userData.completedSessions} / ${this.userData.dailyGoalSessions} sessions`;
        progressPercent = Math.min((this.userData.completedSessions / this.userData.dailyGoalSessions) * 100, 100);
      }
      
      // Update progress bar
      if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
        
        // Celebrate goal completion
        if (progressPercent >= 100 && !this.goalCelebrated) {
          this.goalCelebrated = true;
          this.showNotification('🎉 Daily goal achieved! Great work!', 'success');
        }
      }
    }
    
    // Update timer container state
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) {
      timerContainer.classList.remove('focus-mode', 'break-mode', 'paused');
      if (this.isTimerRunning) {
        timerContainer.classList.add(this.isBreakTime ? 'break-mode' : 'focus-mode');
      } else if (this.currentSeconds < this.totalSeconds) {
        timerContainer.classList.add('paused');
      }
    }
    
    // Show/hide appropriate controls based on mode
    const focusPresets = document.getElementById('focusPresets');
    const breakActions = document.getElementById('breakActions');
    const increaseBtn = document.getElementById('increaseBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    
    if (this.isBreakTime) {
      // Hide focus presets and timer adjustment buttons during break
      if (focusPresets) focusPresets.style.display = 'none';
      if (breakActions) breakActions.style.display = 'flex';
      if (increaseBtn) increaseBtn.style.display = 'none';
      if (decreaseBtn) decreaseBtn.style.display = 'none';
    } else {
      // Show focus controls
      if (focusPresets) focusPresets.style.display = 'flex';
      if (breakActions) breakActions.style.display = 'none';
      if (increaseBtn) increaseBtn.style.display = this.isTimerRunning ? 'none' : 'flex';
      if (decreaseBtn) decreaseBtn.style.display = this.isTimerRunning ? 'none' : 'flex';
    }
  }

  updateProgressCircle() {
    const circle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 50; // radius = 50
    const progress = (this.totalSeconds - this.currentSeconds) / this.totalSeconds;
    const offset = circumference - (progress * circumference);
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
    
    // Change gradient based on mode
    circle.setAttribute('stroke', this.isBreakTime ? 'url(#gradient-break)' : 'url(#gradient)');
  }

  updateStatsDisplay() {
    console.log('📊 updateStatsDisplay called');
    
    // Only show real focus time from actual timer sessions
    const hours = Math.floor(this.userData.todayFocusTime / 60);
    const minutes = this.userData.todayFocusTime % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    // Update focus time display (both in old location and Focus Insights)
    const focusTimeEl = document.getElementById('todayFocusTime');
    if (focusTimeEl) {
      focusTimeEl.textContent = timeDisplay;
    }
    const focusTimeInsightEl = document.getElementById('todayFocusTimeInsight');
    if (focusTimeInsightEl) {
      focusTimeInsightEl.textContent = timeDisplay;
    }
    
    // Update session count (both locations)
    const sessionsEl = document.getElementById('completedSessions');
    if (sessionsEl) {
      sessionsEl.textContent = this.userData.completedSessions;
    }
    const sessionsInsightEl = document.getElementById('completedSessionsInsight');
    if (sessionsInsightEl) {
      sessionsInsightEl.textContent = this.userData.completedSessions;
    }
    
    // Update weekly streak (both locations)
    const streakEl = document.getElementById('weeklyStreak');
    if (streakEl) {
      streakEl.textContent = this.userData.weeklyStreak;
    }
    const streakInsightEl = document.getElementById('weeklyStreakInsight');
    if (streakInsightEl) {
      streakInsightEl.textContent = this.userData.weeklyStreak;
    }
    
    // Calculate best focus time based on session history
    const bestTime = this.calculateBestFocusTime();
    const bestTimeEl = document.getElementById('bestFocusTime');
    if (bestTimeEl) {
      bestTimeEl.textContent = bestTime;
    }
    const bestTimeInsightEl = document.getElementById('bestFocusTimeInsight');
    if (bestTimeInsightEl) {
      bestTimeInsightEl.textContent = bestTime;
    }
    
    // Update focus chart with real data
    this.updateFocusChart();
    
    // ADHD-focused productivity score based on consistency, not total time
    let score = 0;
    if (this.userData.completedSessions > 0) {
      // Score based on session completion rate and consistency
      const targetSessions = 4; // 4 focus sessions per day is optimal for ADHD
      const sessionScore = Math.min(100, (this.userData.completedSessions / targetSessions) * 70);
      const consistencyScore = Math.min(30, this.userData.weeklyStreak * 5);
      score = Math.round(sessionScore + consistencyScore);
    }
    
    const scoreEl = document.getElementById('productivityScore');
    if (scoreEl) {
      scoreEl.textContent = `${score}%`;
    }
  }

  calculateBestFocusTime() {
    // Analyze focus sessions to find the most productive time of day
    if (!this.userData.focusSessions || this.userData.focusSessions.length === 0) {
      return "Gathering data...";
    }
    
    // Group sessions by hour of day
    const hourlyStats = {};
    
    this.userData.focusSessions.forEach(session => {
      if (session.completed && session.startTime) {
        const hour = new Date(session.startTime).getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { count: 0, totalDuration: 0 };
        }
        hourlyStats[hour].count++;
        hourlyStats[hour].totalDuration += session.duration || 0;
      }
    });
    
    // Find the hour with the most completed sessions
    let bestHour = -1;
    let maxSessions = 0;
    
    for (const [hour, stats] of Object.entries(hourlyStats)) {
      if (stats.count > maxSessions) {
        maxSessions = stats.count;
        bestHour = parseInt(hour);
      }
    }
    
    if (bestHour >= 0) {
      // Format time range (e.g., "2-4 PM")
      const startHour = bestHour;
      const endHour = (bestHour + 2) % 24; // 2-hour window
      
      const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h || 12);
        return `${displayHour}${period}`;
      };
      
      return `${formatHour(startHour)}-${formatHour(endHour)}`;
    }
    
    return "Gathering data...";
  }

  generateTrendLine(dataPoints, chartHeight, maxValue) {
    // Generate smooth SVG path for trend line
    if (dataPoints.length === 0 || dataPoints.every(v => v === 0)) {
      return '';
    }
    
    const width = 100; // Percentage based width
    const points = dataPoints.map((value, index) => {
      const x = (index / (dataPoints.length - 1)) * width;
      const y = chartHeight - ((value / maxValue) * chartHeight);
      return { x, y, value };
    }).filter(point => point.value > 0); // Only include points with data
    
    if (points.length < 2) {
      return '';
    }
    
    // Create smooth curve using quadratic bezier curves
    let path = `M ${points[0].x}% ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Calculate control point for smooth curve
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      
      path += ` Q ${cpx}% ${prev.y} ${cpx}% ${cpy}`;
      path += ` T ${curr.x}% ${curr.y}`;
    }
    
    return path;
  }

  updateFocusChart() {
    const chartContainer = document.getElementById('focusChartInsight');
    
    if (!chartContainer) {
      return;
    }
    
    // Process focus data for the last 7 days
    const last7Days = [];
    const dayLabels = [];
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      let dayFocusMinutes = 0;
      
      // Calculate focus time from completed sessions
      if (this.userData.focusSessions && this.userData.focusSessions.length > 0) {
        this.userData.focusSessions.forEach(session => {
          if (session.completed && session.startTime) {
            const sessionDate = new Date(session.startTime);
            sessionDate.setHours(0, 0, 0, 0);
            
            if (sessionDate.getTime() === date.getTime()) {
              dayFocusMinutes += session.duration || 0;
            }
          }
        });
      }
      
      // For today, use real-time data
      if (i === 0) {
        dayFocusMinutes = this.userData.todayFocusTime || 0;
      }
      
      last7Days.push(dayFocusMinutes);
      dayLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    // Calculate previous week data for comparison
    const last14Days = [];
    for (let i = 13; i >= 7; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      let dayFocusMinutes = 0;
      
      if (this.userData.focusSessions && this.userData.focusSessions.length > 0) {
        this.userData.focusSessions.forEach(session => {
          if (session.completed && session.startTime) {
            const sessionDate = new Date(session.startTime);
            sessionDate.setHours(0, 0, 0, 0);
            
            if (sessionDate.getTime() === date.getTime()) {
              dayFocusMinutes += session.duration || 0;
            }
          }
        });
      }
      
      last14Days.push(dayFocusMinutes);
    }
    
    // Calculate metrics
    const thisWeekTotal = last7Days.reduce((sum, val) => sum + val, 0);
    const lastWeekTotal = last14Days.reduce((sum, val) => sum + val, 0);
    const weeklyChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100) : 0;
    const avgDaily = Math.round(thisWeekTotal / 7);
    const bestDayIndex = last7Days.indexOf(Math.max(...last7Days));
    const bestDayMinutes = Math.max(...last7Days);
    const activeDays = last7Days.filter(m => m > 0).length;
    
    // Calculate streak
    let currentStreak = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      if (last7Days[i] > 0) {
        currentStreak++;
      } else if (i < last7Days.length - 1) {
        break; // Only break if it's not today
      }
    }
    
    // Determine trend
    const trend = weeklyChange > 5 ? 'improving' : weeklyChange < -5 ? 'declining' : 'steady';
    const trendColor = trend === 'improving' ? '#48bb78' : trend === 'declining' ? '#e53e3e' : '#718096';
    const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
    
    // Generate encouragement message
    const encouragementMessages = {
      improving: [
        "Great momentum! Your focus is trending up",
        "You're building strong habits",
        "Excellent progress this week",
        "Your dedication is paying off"
      ],
      declining: [
        "Every day is a fresh start",
        "Small steps lead to big changes",
        "You've got this! Start with 5 minutes",
        "Progress isn't always linear"
      ],
      steady: [
        "Consistency is key",
        "Steady progress builds habits",
        "You're maintaining your rhythm",
        "Keep up the good work"
      ]
    };
    
    const encouragement = encouragementMessages[trend][Math.floor(Math.random() * encouragementMessages[trend].length)];
    
    // Calculate chart dimensions
    const maxMinutes = Math.max(...last7Days, 60); // Minimum 60 minutes for scale
    const chartHeight = 140; // Increased height for better visibility
    
    // Y-axis scale points
    const scalePoints = [0, 15, 30, 45, 60];
    if (maxMinutes > 60) {
      scalePoints.push(Math.ceil(maxMinutes / 15) * 15);
    }
    
    // Create the chart HTML with comprehensive enhancements
    const chartHTML = `
      <div class="focus-chart-container">
        <style>
          .focus-chart-container {
            background: transparent;
            padding: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          
          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .chart-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
          }
          
          .trend-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            color: ${trendColor};
          }
          
          .chart-wrapper {
            position: relative;
            display: flex;
            gap: 8px;
          }
          
          .y-axis {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 30px;
            height: ${chartHeight}px;
            padding-right: 4px;
          }
          
          .y-axis-label {
            font-size: 10px;
            color: #718096;
            text-align: right;
            line-height: 1;
          }
          
          .y-axis-title {
            position: absolute;
            left: -20px;
            top: 50%;
            transform: rotate(-90deg) translateX(-50%);
            font-size: 10px;
            color: #718096;
            font-weight: 500;
          }
          
          .chart-content {
            flex: 1;
            position: relative;
          }
          
          .chart-grid {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: ${chartHeight}px;
            pointer-events: none;
          }
          
          .grid-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 1px;
            background: #e2e8f0;
            opacity: 0.5;
          }
          
          .chart-bars {
            display: flex;
            align-items: flex-end;
            height: ${chartHeight}px;
            gap: 8px;
            position: relative;
            z-index: 1;
          }
          
          .trend-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: ${chartHeight}px;
            pointer-events: none;
            z-index: 2;
          }
          
          .trend-line svg {
            width: 100%;
            height: 100%;
          }
          
          .trend-line path {
            fill: none;
            stroke: ${trendColor};
            stroke-width: 2;
            stroke-dasharray: 0;
            opacity: 0.7;
          }
          
          .trend-line circle {
            fill: ${trendColor};
            stroke: white;
            stroke-width: 2;
          }
          
          .chart-bar-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          
          .chart-bar {
            width: 100%;
            background: #cbd5e0;
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .chart-bar.has-data {
            background: #4299e1;
          }
          
          .chart-bar.today {
            background: #48bb78;
          }
          
          .chart-bar.best-day {
            box-shadow: 0 0 0 2px #f6ad55;
          }
          
          .chart-bar:hover {
            opacity: 0.8;
            transform: translateY(-2px);
          }
          
          .chart-bar-tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: #2d3748;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
            z-index: 10;
          }
          
          .chart-bar-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-top-color: #2d3748;
          }
          
          .chart-bar-wrapper:hover .chart-bar-tooltip {
            opacity: 1;
          }
          
          .chart-day-label {
            margin-top: 4px;
            font-size: 11px;
            color: #718096;
            font-weight: 500;
          }
          
          .chart-date-label {
            font-size: 9px;
            color: #a0aec0;
            margin-top: 2px;
          }
          
          .chart-bar.animate {
            animation: growBar 0.5s ease-out forwards;
          }
          
          @keyframes growBar {
            from {
              height: 0;
            }
            to {
              height: var(--bar-height);
            }
          }
          
          .chart-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          
          .metric-card {
            text-align: center;
          }
          
          .metric-value {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
          }
          
          .metric-label {
            font-size: 11px;
            color: #718096;
            margin-top: 2px;
          }
          
          .metric-change {
            font-size: 11px;
            margin-top: 2px;
            font-weight: 500;
          }
          
          .metric-change.positive {
            color: #48bb78;
          }
          
          .metric-change.negative {
            color: #e53e3e;
          }
          
          .encouragement-message {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            margin-top: 12px;
            text-align: center;
          }
          
          .encouragement-icon {
            font-size: 20px;
            margin-bottom: 4px;
          }
          
          .encouragement-text {
            font-size: 12px;
            color: #4a5568;
            font-weight: 500;
          }
          
          .achievement-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #fef3c7;
            color: #92400e;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            margin-top: 8px;
          }
          
          .no-data-message {
            text-align: center;
            color: #718096;
            font-size: 13px;
            padding: 40px 20px;
          }
        </style>
        
        ${last7Days.every(m => m === 0) ? `
          <div class="no-data-message">
            <div class="encouragement-icon">🌟</div>
            <p>Start your first focus session to see your progress chart</p>
            <p style="font-size: 11px; margin-top: 8px;">Even 5 minutes counts!</p>
          </div>
        ` : `
          <div class="chart-header">
            <h3 class="chart-title">Daily Focus Progress - Last 7 Days</h3>
            <div class="trend-indicator">
              <span>${trendIcon}</span>
              <span>${Math.abs(weeklyChange).toFixed(0)}% ${weeklyChange >= 0 ? 'up' : 'down'}</span>
            </div>
          </div>
          
          <div class="chart-wrapper">
            <div class="y-axis">
              <span class="y-axis-title">Minutes</span>
              ${scalePoints.reverse().map(point => `
                <span class="y-axis-label">${point}${point >= 60 ? '+' : ''}</span>
              `).join('')}
            </div>
            
            <div class="chart-content">
              <div class="chart-grid">
                ${scalePoints.map((_, i) => `
                  <div class="grid-line" style="bottom: ${(i / (scalePoints.length - 1)) * 100}%"></div>
                `).join('')}
              </div>
              
              <div class="chart-bars">
                ${last7Days.map((minutes, i) => {
                  const height = minutes > 0 ? Math.max(5, (minutes / Math.max(...scalePoints)) * 100) : 2;
                  const isToday = i === 6;
                  const hasData = minutes > 0;
                  const isBestDay = i === bestDayIndex && hasData;
                  
                  return `
                    <div class="chart-bar-wrapper">
                      <div 
                        class="chart-bar ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''} ${isBestDay ? 'best-day' : ''} animate"
                        style="--bar-height: ${height}%; height: ${height}%;"
                        data-minutes="${minutes}"
                      >
                        <div class="chart-bar-tooltip">
                          <strong>${dates[i]}</strong><br>
                          ${minutes} minutes
                          ${isBestDay ? '<br>🏆 Best day!' : ''}
                          ${isToday ? '<br>📍 Today' : ''}
                        </div>
                      </div>
                      <span class="chart-day-label">${dayLabels[i]}</span>
                      <span class="chart-date-label">${dates[i]}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <div class="trend-line">
                <svg>
                  <path d="${this.generateTrendLine(last7Days, chartHeight, Math.max(...scalePoints))}" />
                  ${last7Days.map((minutes, i) => {
                    if (minutes === 0) return '';
                    const x = (i * 100 / 6) + '%';
                    const y = chartHeight - (minutes / Math.max(...scalePoints) * chartHeight);
                    return `<circle cx="${x}" cy="${y}" r="3" />`;
                  }).join('')}
                </svg>
              </div>
            </div>
          </div>
          
          <div class="chart-metrics">
            <div class="metric-card">
              <div class="metric-value">${avgDaily}</div>
              <div class="metric-label">Daily Average</div>
              <div class="metric-change ${weeklyChange >= 0 ? 'positive' : 'negative'}">
                ${weeklyChange >= 0 ? '↑' : '↓'} vs last week
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${currentStreak}</div>
              <div class="metric-label">Day Streak</div>
              ${currentStreak >= 3 ? `<div class="achievement-badge">🔥 On fire!</div>` : ''}
            </div>
            <div class="metric-card">
              <div class="metric-value">${activeDays}/7</div>
              <div class="metric-label">Active Days</div>
              ${activeDays === 7 ? `<div class="achievement-badge">⭐ Perfect week!</div>` : ''}
            </div>
          </div>
          
          <div class="encouragement-message">
            <div class="encouragement-icon">${currentStreak >= 3 ? '🎯' : '💪'}</div>
            <div class="encouragement-text">${encouragement}</div>
            ${bestDayMinutes > 0 ? `
              <div style="font-size: 11px; color: #718096; margin-top: 4px;">
                Best day: ${dayLabels[bestDayIndex]} with ${bestDayMinutes} minutes
              </div>
            ` : ''}
          </div>
        `}
      </div>
    `;
    
    // Update the container with smooth transition
    chartContainer.style.opacity = '0';
    chartContainer.style.transition = 'opacity 0.2s ease';
    
    setTimeout(() => {
      chartContainer.innerHTML = chartHTML;
      chartContainer.style.opacity = '1';
      
      // Trigger bar animations after a brief delay
      setTimeout(() => {
        const bars = chartContainer.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
          setTimeout(() => {
            bar.classList.add('animate');
          }, index * 50);
        });
      }, 100);
    }, 200);
    
    // Update chart when new sessions complete
    if (!this.chartUpdateListener) {
      this.chartUpdateListener = true;
      chrome.runtime.onMessage.addListener((request) => {
        if (request.type === 'sessionComplete' || request.type === 'timerComplete') {
          setTimeout(() => {
            this.updateFocusChart();
          }, 1000);
        }
      });
    }
  }

  setupQuickActions() {
    // Save current page
    document.getElementById('saveCurrentPage')?.addEventListener('click', async () => {
      await this.saveCurrentPage();
    });
    
    // Open bookmarks manager
    document.getElementById('openBookmarksManager')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://bookmarks/' });
    });
    
    // Refresh/Clear search
    document.getElementById('refreshBookmarks')?.addEventListener('click', () => {
      // Clear search input
      const searchInput = document.getElementById('bookmarkSearch');
      if (searchInput) {
        searchInput.value = '';
      }
      
      // Clear displayed bookmarks and show empty state
      this.clearBookmarkDisplay();
      this.showNotification('Search cleared', 'success');
    });
  }
  
  setupBookmarkFunctionality() {
    // Search functionality
    const searchInput = document.getElementById('bookmarkSearch');
    if (searchInput) {
      // Clear any previous search value
      searchInput.value = '';
      
      searchInput.addEventListener('input', (e) => {
        this.searchBookmarks(e.target.value);
      });
    }
    
    // Start with empty state - don't load bookmarks initially
    this.clearBookmarkDisplay();
    this.updateFocusChart();
  }
  
  clearBookmarkDisplay() {
    const container = document.getElementById('recentBookmarks');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </div>
          <h3>Search your bookmarks</h3>
          <p>Type in the search box above to find bookmarks</p>
        </div>
      `;
    }
  }
  
  setupNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const clearAllBtn = document.getElementById('clearAllNotifications');
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target.id !== 'notificationsBtn') {
        panel.style.display = 'none';
      }
    });
    
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllNotifications();
      });
    }
    
    // Initialize notification display
    this.updateNotificationPanel();
  }
  
  toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'block';
      this.updateNotificationPanel();
    } else {
      panel.style.display = 'none';
    }
  }
  
  async updateNotificationPanel() {
    const list = document.getElementById('notificationList');
    const empty = document.getElementById('notificationEmpty');
    
    // Get notifications from storage
    const { notifications = [] } = await chrome.storage.local.get('notifications');
    
    // Add current timer status as first item
    const timerStatus = this.getCurrentTimerStatus();
    
    if (notifications.length === 0 && !timerStatus) {
      list.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    list.style.display = 'block';
    empty.style.display = 'none';
    
    let html = '';
    
    // Add current timer status
    if (timerStatus) {
      html += `
        <div class="notification-item current-timer">
          <div class="notification-title">⏱ ${timerStatus.title}</div>
          <div class="notification-message">${timerStatus.message}</div>
        </div>
      `;
    }
    
    // Add recent notifications
    notifications.slice(0, 5).forEach(notif => {
      const timeAgo = this.getTimeAgo(notif.timestamp);
      html += `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      `;
    });
    
    list.innerHTML = html;
    
    // Mark as read when clicked
    list.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) {
          this.markNotificationRead(id);
        }
      });
    });
  }
  
  getCurrentTimerStatus() {
    if (!this.isTimerRunning) return null;
    
    const minutes = Math.floor(this.currentSeconds / 60);
    const seconds = this.currentSeconds % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (this.isBreakTime) {
      return {
        title: 'Break in Progress',
        message: `${timeString} remaining`
      };
    } else {
      return {
        title: 'Focus Session Active',
        message: `${timeString} remaining`
      };
    }
  }
  
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }
  
  async addNotification(notification) {
    const { notifications = [] } = await chrome.storage.local.get('notifications');
    
    const newNotif = {
      id: Date.now().toString(),
      ...notification,
      timestamp: Date.now(),
      unread: true
    };
    
    // Keep only last 20 notifications
    const updated = [newNotif, ...notifications].slice(0, 20);
    await chrome.storage.local.set({ notifications: updated });
    
    // Update badge
    this.updateNotificationBadge();
  }
  
  async markNotificationRead(id) {
    const { notifications = [] } = await chrome.storage.local.get('notifications');
    const updated = notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    );
    await chrome.storage.local.set({ notifications: updated });
    this.updateNotificationPanel();
    this.updateNotificationBadge();
  }
  
  async clearAllNotifications() {
    await chrome.storage.local.set({ notifications: [] });
    this.updateNotificationPanel();
    this.updateNotificationBadge();
  }
  
  async updateNotificationBadge() {
    const { notifications = [] } = await chrome.storage.local.get('notifications');
    const unreadCount = notifications.filter(n => n.unread).length;
    
    const btn = document.getElementById('notificationsBtn');
    if (btn) {
      // Remove existing badge
      const existingBadge = btn.querySelector('.notification-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add new badge if there are unread notifications
      if (unreadCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        btn.appendChild(badge);
      }
    }
  }
  
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }
  
  calculateProductivityScore() {
    // Simple productivity score based on today's progress
    const goalProgress = this.userData.dailyGoalType === 'time'
      ? (this.userData.todayFocusTime / this.userData.dailyGoalMinutes) * 100
      : (this.userData.completedSessions / this.userData.dailyGoalSessions) * 100;
    
    return Math.min(100, Math.round(goalProgress));
  }

  setupBreakActions() {
    const endBreakBtn = document.getElementById('endBreakBtn');
    const extendBreakBtn = document.getElementById('extendBreakBtn');
    
    if (endBreakBtn) {
      endBreakBtn.addEventListener('click', async () => {
        try {
          // End break early and return to focus mode
          await chrome.runtime.sendMessage({
            action: 'resetTimer',
            duration: 25
          });
          
          // Force back to focus mode
          this.isBreakTime = false;
          this.totalSeconds = 25 * 60;
          this.currentSeconds = this.totalSeconds;
          this.updateTimerDisplay();
          this.showNotification('Break ended - ready to focus!', 'success');
        } catch (error) {
          console.error('Failed to end break:', error);
          this.showNotification('Failed to end break', 'error');
        }
      });
    }
    
    if (extendBreakBtn) {
      extendBreakBtn.addEventListener('click', async () => {
        try {
          // Extend break by 5 minutes
          const currentMinutes = Math.floor(this.currentSeconds / 60);
          const newDuration = currentMinutes + 5;
          
          await chrome.runtime.sendMessage({
            action: 'updateTimerDuration',
            duration: newDuration,
            elapsed: (this.totalSeconds - this.currentSeconds) * 1000
          });
          
          this.totalSeconds = newDuration * 60;
          this.updateTimerDisplay();
          this.showNotification('Break extended by 5 minutes', 'success');
        } catch (error) {
          console.error('Failed to extend break:', error);
          this.showNotification('Failed to extend break', 'error');
        }
      });
    }
  }

  setupSettings() {
    // Goal settings
    const goalType = document.getElementById('goalType');
    const timeGoal = document.getElementById('timeGoal');
    const sessionGoal = document.getElementById('sessionGoal');
    const timeGoalRow = document.getElementById('timeGoalRow');
    const sessionGoalRow = document.getElementById('sessionGoalRow');
    
    // Initialize goal settings
    goalType.value = this.userData.dailyGoalType;
    timeGoal.value = this.userData.dailyGoalMinutes;
    sessionGoal.value = this.userData.dailyGoalSessions;
    
    // Toggle goal type display
    const updateGoalDisplay = () => {
      if (goalType.value === 'time') {
        timeGoalRow.style.display = 'flex';
        sessionGoalRow.style.display = 'none';
      } else {
        timeGoalRow.style.display = 'none';
        sessionGoalRow.style.display = 'flex';
      }
    };
    
    updateGoalDisplay();
    
    goalType.addEventListener('change', () => {
      this.userData.dailyGoalType = goalType.value;
      updateGoalDisplay();
      this.saveUserData();
      this.updateTimerDisplay();
    });
    
    timeGoal.addEventListener('change', () => {
      if (timeGoal.value === 'custom') {
        const customMinutes = prompt('Enter daily focus goal in minutes:', '120');
        if (customMinutes && !isNaN(customMinutes)) {
          this.userData.dailyGoalMinutes = parseInt(customMinutes);
        }
      } else {
        this.userData.dailyGoalMinutes = parseInt(timeGoal.value);
      }
      this.saveUserData();
      this.updateTimerDisplay();
    });
    
    sessionGoal.addEventListener('change', () => {
      if (sessionGoal.value === 'custom') {
        const customSessions = prompt('Enter daily session goal:', '4');
        if (customSessions && !isNaN(customSessions)) {
          this.userData.dailyGoalSessions = parseInt(customSessions);
        }
      } else {
        this.userData.dailyGoalSessions = parseInt(sessionGoal.value);
      }
      this.saveUserData();
      this.updateTimerDisplay();
    });
    
    // Timer settings
    const defaultDuration = document.getElementById('defaultDuration');
    defaultDuration.value = this.settings.defaultDuration;
    defaultDuration.addEventListener('change', () => {
      this.settings.defaultDuration = parseInt(defaultDuration.value);
      this.saveSettings();
    });
    
    // Toggle switches
    this.setupToggle('autoBreaksToggle', 'autoBreaks');
    this.setupToggle('soundToggle', 'sound');
    this.setupToggle('reducedMotionToggle', 'reducedMotion');
    this.setupToggle('desktopNotificationsToggle', 'desktopNotifications');
    this.setupToggle('breakRemindersToggle', 'breakReminders');
    this.setupToggle('analyticsToggle', 'analytics');
    
    // Theme selector
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.value = this.settings.theme;
    themeSelect.addEventListener('change', () => {
      this.settings.theme = themeSelect.value;
      this.applyTheme(themeSelect.value);
      this.saveSettings();
    });
    
    // Data management
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportData();
    });
    
    document.getElementById('resetDataBtn').addEventListener('click', () => {
      this.resetAllData();
    });
  }

  setupToggle(toggleId, settingKey) {
    const toggle = document.getElementById(toggleId);
    if (this.settings[settingKey]) {
      toggle.classList.add('active');
    }
    
    toggle.addEventListener('click', () => {
      this.settings[settingKey] = !this.settings[settingKey];
      toggle.classList.toggle('active');
      this.saveSettings();
      
      // Apply setting immediately
      if (settingKey === 'reducedMotion') {
        this.applyReducedMotion(this.settings[settingKey]);
      }
    });
  }

  setupAccountManagement() {
    // Will be implemented with authentication system
    this.renderAccountSection();
    
    // Check for Pro features access
    document.addEventListener('click', (e) => {
      // Check if clicked element has data-pro attribute
      const proElement = e.target.closest('[data-pro]');
      if (proElement && !this.user?.subscription?.tier === 'pro') {
        e.preventDefault();
        e.stopPropagation();
        this.showUpgradeModal();
      }
    });
  }
  
  showUpgradeModal() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'upgrade-modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.style.cssText = `
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      width: 380px;
      max-width: 90vw;
      box-shadow: var(--shadow-xl);
      text-align: center;
    `;
    
    modal.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: var(--space-4);">🚀</div>
      <h2 style="margin-bottom: var(--space-3);">Upgrade to Pro</h2>
      <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">
        Unlock advanced focus features and boost your productivity
      </p>
      
      <div style="text-align: left; margin-bottom: var(--space-6);">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>AI-powered bookmark tagging</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Advanced focus analytics</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Website blocking during focus</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Body doubling sessions</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Detailed productivity reports</span>
        </div>
      </div>
      
      <div style="font-size: 2rem; font-weight: 700; margin-bottom: var(--space-2);">$9.99/month</div>
      <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
        Cancel anytime. 7-day free trial.
      </p>
      
      <div style="display: flex; gap: var(--space-3);">
        <button class="btn btn-primary" style="flex: 1;" id="upgradeBtn">
          Start Free Trial
        </button>
        <button class="btn btn-secondary" id="cancelUpgrade">
          Maybe Later
        </button>
      </div>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Handle upgrade
    document.getElementById('upgradeBtn').addEventListener('click', async () => {
      if (!this.isAuthenticated) {
        backdrop.remove();
        this.showNotification('Please sign in first to upgrade', 'warning');
        setTimeout(() => this.showSignInFlow(), 500);
        return;
      }
      
      try {
        // Initialize auth service if needed
        if (!window.authService) {
          window.authService = new AuthService();
          await window.authService.initialize();
        }
        
        // Create Stripe checkout session
        const { data, error } = await window.authService.createCheckoutSession();
        
        if (error) {
          this.showNotification('Failed to start checkout', 'error');
          return;
        }
        
        if (data?.url) {
          chrome.tabs.create({ url: data.url });
          backdrop.remove();
        }
        
      } catch (error) {
        console.error('Upgrade failed:', error);
        this.showNotification('Upgrade failed', 'error');
      }
    });
    
    // Handle cancel
    const handleCancel = () => backdrop.remove();
    document.getElementById('cancelUpgrade').addEventListener('click', handleCancel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) handleCancel();
    });
  }

  renderAccountSection() {
    const accountSection = document.getElementById('accountSection');
    
    if (this.isAuthenticated && this.user) {
      accountSection.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4);">
          <div style="width: 48px; height: 48px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
            ${this.user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style="font-weight: 600; margin-bottom: var(--space-1);">${this.user.name || 'User'}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${this.user.email || 'user@example.com'}</div>
          </div>
        </div>
        <div style="display: flex; gap: var(--space-3);">
          <button class="btn btn-secondary" id="manageAccountBtn">Manage Account</button>
          <button class="btn btn-ghost" id="signOutBtn">Sign Out</button>
        </div>
      `;
      
      document.getElementById('signOutBtn').addEventListener('click', () => {
        this.signOut();
      });
    } else {
      accountSection.innerHTML = `
        <div style="text-align: center; padding: var(--space-6) 0;">
          <div style="font-size: 2rem; margin-bottom: var(--space-3);">🎯</div>
          <h3 style="margin-bottom: var(--space-2);">Welcome to Smart Bookmarks</h3>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">Sign in to sync your data across devices and unlock premium features.</p>
          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-primary" id="signInBtn">Sign In</button>
            <button class="btn btn-secondary" id="createAccountBtn">Create Account</button>
          </div>
        </div>
      `;
      
      document.getElementById('signInBtn').addEventListener('click', () => {
        this.showSignInFlow();
      });
      
      document.getElementById('createAccountBtn').addEventListener('click', () => {
        this.showCreateAccountFlow();
      });
    }
  }

  applySettings() {
    this.applyTheme(this.settings.theme);
    this.applyReducedMotion(this.settings.reducedMotion);
  }

  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--border-light', '#475569');
      root.style.setProperty('--gradient-card', 'linear-gradient(145deg, #1e293b 0%, #334155 100%)');
    } else if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--bg-tertiary', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#64748b');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--border-light', '#f1f5f9');
      root.style.setProperty('--gradient-card', 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)');
    } else {
      // System theme - detect user preference
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(darkMode ? 'dark' : 'light');
    }
  }

  applyReducedMotion(enabled) {
    if (enabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  async exportData() {
    try {
      const exportData = {
        userData: this.userData,
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Use Chrome downloads API
      await chrome.downloads.download({
        url: url,
        filename: `focusflow-data-${new Date().toISOString().split('T')[0]}.json`,
        saveAs: true
      });
      
      this.showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Export failed', 'error');
    }
  }

  async resetAllData() {
    const confirmed = confirm('Are you sure you want to reset all data? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await chrome.storage.local.clear();
      this.userData = {
        todayFocusTime: 0,
        weeklyStreak: 0,
        completedSessions: 0,
        productivity: { today: [], week: [0, 0, 0, 0, 0, 0, 0] }
      };
      this.updateStatsDisplay();
      this.showNotification('All data reset', 'success');
    } catch (error) {
      console.error('Reset failed:', error);
      this.showNotification('Reset failed', 'error');
    }
  }

  async showSignInFlow() {
    try {
      // Create modal backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'auth-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'auth-modal';
      modal.style.cssText = `
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        width: 320px;
        box-shadow: var(--shadow-xl);
      `;
      
      modal.innerHTML = `
        <h2 style="margin-bottom: var(--space-4); text-align: center;">Sign In</h2>
        <form id="signInForm">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="signInEmail" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="signInPassword" required>
          </div>
          <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);">
            <button type="submit" class="btn btn-primary" style="flex: 1;">Sign In</button>
            <button type="button" class="btn btn-secondary" id="cancelSignIn">Cancel</button>
          </div>
        </form>
      `;
      
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      
      // Focus email input
      setTimeout(() => {
        document.getElementById('signInEmail').focus();
      }, 100);
      
      // Handle form submission
      document.getElementById('signInForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        
        try {
          // Initialize auth service if needed
          if (!window.authService) {
            window.authService = new AuthService();
            await window.authService.initialize();
          }
          
          const { data, error } = await window.authService.signIn(email, password);
          
          if (error) {
            this.showNotification(error.message || 'Sign in failed', 'error');
            return;
          }
          
          if (data.user) {
            this.user = data.user;
            this.isAuthenticated = true;
            await chrome.storage.local.set({ user: data.user });
            
            backdrop.remove();
            this.renderAccountSection();
            this.showNotification('Signed in successfully!', 'success');
          }
          
        } catch (error) {
          console.error('Sign in error:', error);
          this.showNotification('Sign in failed', 'error');
        }
      });
      
      // Handle cancel
      const handleCancel = () => backdrop.remove();
      document.getElementById('cancelSignIn').addEventListener('click', handleCancel);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleCancel();
      });
      
    } catch (error) {
      console.error('Failed to show sign in:', error);
      this.showNotification('Failed to show sign in', 'error');
    }
  }

  async showCreateAccountFlow() {
    try {
      // Create modal backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'auth-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'auth-modal';
      modal.style.cssText = `
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        width: 320px;
        box-shadow: var(--shadow-xl);
      `;
      
      modal.innerHTML = `
        <h2 style="margin-bottom: var(--space-4); text-align: center;">Create Account</h2>
        <form id="createAccountForm">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="createEmail" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="createPassword" required minlength="8">
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: var(--space-1);">
              Minimum 8 characters
            </p>
          </div>
          <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);">
            <button type="submit" class="btn btn-primary" style="flex: 1;">Create Account</button>
            <button type="button" class="btn btn-secondary" id="cancelCreate">Cancel</button>
          </div>
        </form>
      `;
      
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      
      // Focus email input
      setTimeout(() => {
        document.getElementById('createEmail').focus();
      }, 100);
      
      // Handle form submission
      document.getElementById('createAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('createEmail').value;
        const password = document.getElementById('createPassword').value;
        
        if (password.length < 8) {
          this.showNotification('Password must be at least 8 characters', 'error');
          return;
        }
        
        try {
          // Initialize auth service if needed
          if (!window.authService) {
            window.authService = new AuthService();
            await window.authService.initialize();
          }
          
          const { data, error } = await window.authService.supabase.auth.signUp({
            email: email,
            password: password
          });
          
          if (error) {
            this.showNotification(error.message || 'Account creation failed', 'error');
            return;
          }
          
          backdrop.remove();
          this.showNotification('Account created! Check your email to verify.', 'success');
          
          // Show sign in modal after account creation
          setTimeout(() => {
            this.showSignInFlow();
          }, 1000);
          
        } catch (error) {
          console.error('Account creation error:', error);
          this.showNotification('Account creation failed', 'error');
        }
      });
      
      // Handle cancel
      const handleCancel = () => backdrop.remove();
      document.getElementById('cancelCreate').addEventListener('click', handleCancel);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleCancel();
      });
      
    } catch (error) {
      console.error('Failed to show create account:', error);
      this.showNotification('Failed to show create account', 'error');
    }
  }

  signOut() {
    this.user = null;
    this.isAuthenticated = false;
    chrome.storage.local.remove('user');
    this.renderAccountSection();
    this.showNotification('Signed out successfully', 'success');
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  sendDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'icon48.png',
        silent: false
      });
    }
  }
  
  sendEnhancedNotification(title, body, actions) {
    // Chrome extensions can't use notification actions directly,
    // but we can send a message to the background script
    chrome.runtime.sendMessage({
      type: 'showNotification',
      title: title,
      body: body,
      actions: actions
    });
  }

  playCompletionSound() {
    // Create a subtle completion sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-2);">
        <span>${this.getNotificationIcon(type)}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }
  
  // Bookmark Management Methods
  async saveCurrentPage() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        this.showNotification('No valid page to bookmark', 'error');
        return;
      }
      
      // Skip chrome:// URLs and other non-bookmarkable pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.showNotification('Cannot bookmark browser pages', 'warning');
        return;
      }
      
      // Check if already bookmarked
      const existing = await chrome.bookmarks.search({ url: tab.url });
      if (existing.length > 0) {
        this.showNotification('Page already bookmarked', 'warning');
        return;
      }
      
      // Create bookmark in bookmarks bar
      const bookmark = await chrome.bookmarks.create({
        title: tab.title || tab.url,
        url: tab.url,
        parentId: '1' // Bookmarks bar folder
      });
      
      this.showNotification(`✓ Saved: ${bookmark.title}`, 'success');
      
      // Refresh displays
      await this.loadRecentBookmarks();
      
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      this.showNotification('Failed to save bookmark', 'error');
    }
  }
  
  async loadRecentBookmarks() {
    try {
      const bookmarks = await this.getRecentBookmarks();
      this.displayBookmarks(bookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }
  
  async getRecentBookmarks(limit = 10) {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks = [];
        
        function collectBookmarks(nodes) {
          for (const node of nodes) {
            // Only add valid web bookmarks, exclude chrome:// URLs and empty titles
            if (node.url && !node.url.startsWith('chrome://') && node.title) {
              bookmarks.push(node);
            }
            if (node.children) {
              collectBookmarks(node.children);
            }
          }
        }
        
        collectBookmarks(bookmarkTreeNodes);
        
        // Sort by date and take most recent
        const recentBookmarks = bookmarks
          .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
          .slice(0, limit);
        
        resolve(recentBookmarks);
      });
    });
  }
  
  displayBookmarks(bookmarks) {
    const container = document.getElementById('recentBookmarks');
    if (!container) return;
    
    if (bookmarks.length === 0) {
      // Check if this is from a search or just no bookmarks
      const searchInput = document.getElementById('bookmarkSearch');
      const isSearching = searchInput && searchInput.value.trim() !== '';
      
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>${isSearching ? 'No bookmarks match your search' : 'No bookmarks yet'}</h3>
          <p>${isSearching ? 'Try a different search term' : 'Save your first bookmark to get started'}</p>
          ${!isSearching ? `
            <button class="btn btn-primary" style="margin-top: var(--space-4);" onclick="document.getElementById('saveCurrentPage').click()">
              Save Current Page
            </button>
          ` : ''}
        </div>
      `;
      return;
    }
    
    const bookmarkItems = bookmarks.map(bookmark => `
      <div class="bookmark-item" data-url="${bookmark.url}">
        <div class="bookmark-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="bookmark-content">
          <div class="bookmark-title">${bookmark.title}</div>
          <div class="bookmark-url">${new URL(bookmark.url).hostname}</div>
        </div>
        <button class="bookmark-action" onclick="window.smartBookmarksApp.openBookmark('${bookmark.url}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
          </svg>
        </button>
      </div>
    `).join('');
    
    container.innerHTML = bookmarkItems;
  }
  
  async searchBookmarks(query) {
    if (!query.trim()) {
      // Show empty search state when query is empty
      this.clearBookmarkDisplay();
      return;
    }
    
    try {
      const results = await chrome.bookmarks.search(query);
      this.displayBookmarks(results.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
  
  async openBookmark(url) {
    // Track recently accessed bookmarks
    try {
      const stored = await chrome.storage.local.get(['recentlyAccessed']);
      let recentlyAccessed = stored.recentlyAccessed || [];
      
      // Remove if already exists and add to front
      recentlyAccessed = recentlyAccessed.filter(item => item.url !== url);
      recentlyAccessed.unshift({ url, timestamp: Date.now() });
      
      // Keep only last 20 accessed
      recentlyAccessed = recentlyAccessed.slice(0, 20);
      
      await chrome.storage.local.set({ recentlyAccessed });
    } catch (error) {
      console.error('Failed to track bookmark access:', error);
    }
    
    chrome.tabs.create({ url });
    window.close();
  }
  
  // REMOVED DUPLICATE updateFocusChart method - using the enhanced one above instead
  
  setupNotesTab() {
    // Quick note capture
    const quickNoteInput = document.getElementById('quickNoteInput');
    const saveQuickNoteBtn = document.getElementById('saveQuickNote');
    const storageSelector = document.getElementById('noteStorageDestination');
    
    // Recent notes
    const notesSearch = document.getElementById('notesSearch');
    
    // Load saved storage preference
    chrome.storage.local.get(['noteStoragePreference']).then(result => {
      if (result.noteStoragePreference) {
        storageSelector.value = result.noteStoragePreference;
      }
    });
    
    // Save storage preference on change
    storageSelector?.addEventListener('change', () => {
      chrome.storage.local.set({ noteStoragePreference: storageSelector.value });
    });
    
    // Save quick note with Enter key support
    const saveQuickNote = async () => {
      const noteContent = quickNoteInput.value.trim();
      if (!noteContent) {
        this.showNotification('Please enter a note', 'warning');
        return;
      }
      
      const storageType = storageSelector.value;
      await this.saveNote({
        content: noteContent,
        type: 'quick',
        storageType,
        timestamp: Date.now(),
        category: 'general'
      });
      
      quickNoteInput.value = '';
      this.showNotification('Note saved!', 'success');
      this.updateRecentNotes();
    };
    
    saveQuickNoteBtn?.addEventListener('click', saveQuickNote);
    
    // Allow Enter key to save (Shift+Enter for new line)
    quickNoteInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveQuickNote();
      }
    });
    
    // Search notes
    notesSearch?.addEventListener('input', (e) => {
      this.filterNotes(e.target.value);
    });
    
    // Load recent notes
    this.updateRecentNotes();
    
    // Update session history
    this.updateSessionHistory();
  }
  
  async saveNote(note) {
    try {
      const { notes = [] } = await chrome.storage.local.get('notes');
      
      // Add metadata for AI processing
      note.id = note.id || `note-${Date.now()}`;
      note.category = note.category || 'general';
      note.metadata = {
        wordCount: note.content.split(/\s+/).length,
        hasHashtags: note.content.includes('#'),
        hasTasks: /^[-\*\d]+\./gm.test(note.content),
        sentiment: null, // For future AI analysis
        topics: [], // For future AI extraction
        actionItems: [], // For future AI extraction
        // ADHD-specific metadata
        overwhelmLevel: null, // To be analyzed by AI
        focusContext: note.sessionData ? `Focus session - ${note.sessionData.duration}min` : null,
        distractionTriggers: [],
        structureScore: null
      };
      
      // Add AI processing flags
      note.aiProcessing = {
        analyzed: false,
        lastAnalyzed: null,
        needsReanalysis: true,
        extractedInsights: []
      };
      
      // Add context for AI
      note.context = {
        userGoals: this.userData.dailyGoalType,
        focusHistory: this.userData.focusSessions?.slice(-5) || [], // Last 5 sessions
        currentMood: null, // Future: mood tracking
        relatedNotes: [], // Future: AI-linked notes
        timeOfDay: this.getTimeOfDay(),
        productivityScore: this.calculateProductivityScore()
      };
      
      notes.unshift(note);
      
      // Keep only last 100 notes
      if (notes.length > 100) {
        notes.length = 100;
      }
      
      // Sort to keep pinned notes at top
      notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.timestamp - a.timestamp;
      });
      
      await chrome.storage.local.set({ notes });
      
      // If storage type is supabase, also sync to cloud (future implementation)
      if (note.storageType === 'supabase') {
        // TODO: Sync to Supabase
        console.log('Would sync to Supabase:', note);
      }
      
      // Prepare for future MCP AI integration
      if (note.storageType === 'ai-ready') {
        // Structure note for AI consumption
        const aiReadyNote = {
          ...note,
          context: {
            userGoals: this.userData.dailyGoalType,
            focusHistory: this.userData.focusSessions,
            currentMood: null, // Future: mood tracking
            relatedNotes: [] // Future: AI-linked notes
          }
        };
        console.log('AI-ready note structure:', aiReadyNote);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      this.showNotification('Failed to save note', 'error');
    }
  }
  
  async updateRecentNotes() {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const recentNotesList = document.getElementById('recentNotesList');
    
    if (!recentNotesList) return;
    
    if (notes.length === 0) {
      recentNotesList.innerHTML = `
        <div style="padding: var(--space-6); text-align: center; color: var(--text-tertiary);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto var(--space-3);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p>No notes yet. Start capturing your thoughts!</p>
        </div>
      `;
      return;
    }
    
    // Show recent notes with edit functionality
    const notesHTML = notes.slice(0, 10).map((note, index) => {
      const date = new Date(note.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString();
      const noteId = note.id || `note-${note.timestamp}`;
      const lastEdited = note.lastEdited ? new Date(note.lastEdited) : null;
      const editStr = lastEdited ? ` • Edited ${this.getRelativeTime(lastEdited)}` : '';
      const title = note.title || this.extractTitle(note.content);
      const tags = this.extractTags(note.content);
      const isPinned = note.pinned || false;
      
      return `
        <div class="note-item ${isPinned ? 'pinned' : ''}" data-note-id="${noteId}" data-note-index="${index}" 
             style="padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius); 
                    background: var(--bg-primary); cursor: pointer; transition: var(--transition); position: relative;
                    ${isPinned ? 'border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-2);">
            <div style="flex: 1;">
              ${isPinned ? '<span style="color: var(--primary); margin-right: var(--space-1);">📌</span>' : ''}
              <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeStr} • ${dateStr}${editStr}</span>
              ${tags.length > 0 ? `<div style="margin-top: var(--space-1);">${tags.map(tag => 
                `<span class="tag" style="display: inline-block; margin-right: var(--space-1); padding: 2px 6px; 
                        background: var(--bg-tertiary); color: var(--primary); border-radius: var(--radius-sm); 
                        font-size: 0.7rem;">${tag}</span>`).join('')}</div>` : ''}
            </div>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <span class="badge" style="background: var(--primary); color: white; font-size: 0.75rem;">${note.storageType}</span>
              <button class="pin-btn" data-note-index="${index}" style="background: none; border: none; 
                      color: var(--text-tertiary); cursor: pointer; padding: var(--space-1); font-size: 1rem;"
                      title="${isPinned ? 'Unpin' : 'Pin'}">${isPinned ? '📌' : '📍'}</button>
              <button class="delete-btn" data-note-index="${index}" style="background: none; border: none; 
                      color: var(--text-tertiary); cursor: pointer; padding: var(--space-1);"
                      title="Delete note">🗑️</button>
            </div>
          </div>
          ${title ? `<h4 style="margin: 0 0 var(--space-2) 0; font-size: 1rem; font-weight: 500;">${title}</h4>` : ''}
          <div class="note-content" style="margin: 0; white-space: pre-wrap; word-wrap: break-word;
                  max-height: 100px; overflow: hidden; position: relative;">${this.formatNoteContent(note.content)}</div>
          ${note.content.length > 200 ? `<button class="expand-btn" style="background: none; border: none; 
                  color: var(--primary); cursor: pointer; font-size: 0.875rem; margin-top: var(--space-1);">Show more</button>` : ''}
        </div>
      `;
    }).join('');
    
    recentNotesList.innerHTML = notesHTML;
    
    // Set up event listeners for notes
    this.setupNoteEventListeners();
  }
  
  filterNotes(searchTerm) {
    const noteItems = document.querySelectorAll('.note-item');
    const term = searchTerm.toLowerCase();
    
    noteItems.forEach(item => {
      const content = item.textContent.toLowerCase();
      const tags = item.querySelectorAll('.tag');
      let tagMatch = false;
      
      tags.forEach(tag => {
        if (tag.textContent.toLowerCase().includes(term)) {
          tagMatch = true;
        }
      });
      
      item.style.display = (content.includes(term) || tagMatch) ? 'block' : 'none';
    });
  }
  
  extractTitle(content) {
    // Extract first line as title if it's short enough
    const firstLine = content.split('\n')[0];
    if (firstLine.length <= 50) {
      return firstLine;
    }
    return '';
  }
  
  extractTags(content) {
    // Extract hashtags from content
    const tagRegex = /#[\w-]+/g;
    const matches = content.match(tagRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }
  
  formatNoteContent(content) {
    // Basic markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/#([\w-]+)/g, '<span class="tag" style="color: var(--primary);">#$1</span>') // Tags
      .replace(/^- (.+)$/gm, '• $1') // Bullet points
      .replace(/^\d+\. (.+)$/gm, (match, p1, offset, string) => {
        const lines = string.substring(0, offset).split('\n');
        const lineNumber = lines.length;
        return `${lineNumber}. ${p1}`;
      });
    
    return formatted;
  }
  
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  }
  
  setupNoteEventListeners() {
    // Click to edit note
    document.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't edit if clicking buttons
        if (e.target.closest('.pin-btn') || e.target.closest('.delete-btn') || e.target.closest('.expand-btn')) {
          return;
        }
        
        const noteIndex = parseInt(item.dataset.noteIndex);
        this.editNote(noteIndex);
      });
    });
    
    // Pin/unpin buttons
    document.querySelectorAll('.pin-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const noteIndex = parseInt(btn.dataset.noteIndex);
        await this.togglePinNote(noteIndex);
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const noteIndex = parseInt(btn.dataset.noteIndex);
        if (confirm('Delete this note?')) {
          await this.deleteNote(noteIndex);
        }
      });
    });
    
    // Expand/collapse buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const noteContent = btn.previousElementSibling;
        if (noteContent.style.maxHeight === '100px') {
          noteContent.style.maxHeight = 'none';
          btn.textContent = 'Show less';
        } else {
          noteContent.style.maxHeight = '100px';
          btn.textContent = 'Show more';
        }
      });
    });
  }
  
  async editNote(noteIndex) {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const note = notes[noteIndex];
    if (!note) return;
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'note-edit-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div class="edit-container" style="background: var(--bg-primary); border-radius: var(--radius-lg); 
               padding: var(--space-6); width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
               box-shadow: var(--shadow-xl); position: relative;">
        <!-- Close button positioned absolutely in top-right corner -->
        <button class="close-btn" title="Close editor (ESC)" style="position: absolute; top: var(--space-3); 
                right: var(--space-3); background: var(--bg-tertiary); border: none; font-size: 1.25rem; 
                cursor: pointer; color: var(--text-tertiary); padding: var(--space-2); width: 32px; height: 32px;
                line-height: 1; transition: var(--transition); border-radius: var(--radius); 
                display: flex; align-items: center; justify-content: center; z-index: 10;">&times;</button>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); padding-right: var(--space-8);">
          <h3 style="margin: 0;">Edit Note</h3>
          <div style="display: flex; gap: var(--space-2); position: relative;">
            <div class="share-dropdown-container" style="position: relative;">
              <button class="share-btn" title="Share note with others" style="padding: var(--space-2) var(--space-3); 
                      background: var(--bg-tertiary); border: none; border-radius: var(--radius); 
                      cursor: pointer; display: flex; align-items: center; gap: var(--space-1);
                      transition: var(--transition);">
                <span>📤</span> Share
              </button>
              <!-- Share dropdown menu -->
              <div class="share-dropdown" style="position: absolute; top: 100%; right: 0; margin-top: var(--space-1);
                      background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius);
                      box-shadow: var(--shadow-lg); min-width: 200px; display: none; z-index: 1000;">
                <button class="share-option" data-action="email-note" style="width: 100%; padding: var(--space-2) var(--space-3);
                        background: none; border: none; text-align: left; cursor: pointer; display: flex;
                        align-items: center; gap: var(--space-2); transition: var(--transition);">
                  <span>📧</span> Email Note
                </button>
                <button class="share-option" data-action="copy-link" style="width: 100%; padding: var(--space-2) var(--space-3);
                        background: none; border: none; text-align: left; cursor: pointer; display: flex;
                        align-items: center; gap: var(--space-2); transition: var(--transition);">
                  <span>🔗</span> Copy Link
                </button>
                <button class="share-option" data-action="copy-text" style="width: 100%; padding: var(--space-2) var(--space-3);
                        background: none; border: none; text-align: left; cursor: pointer; display: flex;
                        align-items: center; gap: var(--space-2); transition: var(--transition);">
                  <span>📋</span> Copy Text
                </button>
                <div style="border-top: 1px solid var(--border); margin: var(--space-1) 0;"></div>
                <button class="share-option" data-action="download-pdf" style="width: 100%; padding: var(--space-2) var(--space-3);
                        background: none; border: none; text-align: left; cursor: pointer; display: flex;
                        align-items: center; gap: var(--space-2); transition: var(--transition);">
                  <span>📄</span> Download PDF
                </button>
              </div>
            </div>
            <button class="save-btn" id="manualSaveBtn" title="Save changes (Auto-save: 3s)" 
                    style="padding: var(--space-2) var(--space-3); background: var(--primary); color: white;
                    border: none; border-radius: var(--radius); cursor: pointer; display: flex; 
                    align-items: center; gap: var(--space-1); transition: var(--transition);">
              <span>💾</span> Save
            </button>
          </div>
        </div>
        
        <!-- Save indicator -->
        <div class="save-indicator" style="position: absolute; top: var(--space-2); right: var(--space-2);
                font-size: 0.75rem; color: var(--success); display: none; animation: fadeIn 0.3s ease;">
          ✓ Saved
        </div>
        
        <input type="text" id="editNoteTitle" placeholder="Note title (optional)" 
               value="${note.title || ''}" 
               style="width: 100%; padding: var(--space-3); margin-bottom: var(--space-3); 
                      border: 1px solid var(--border); border-radius: var(--radius); 
                      background: var(--bg-secondary); color: var(--text-primary);">
        
        <div style="margin-bottom: var(--space-2);">
          <label style="display: block; margin-bottom: var(--space-2); font-size: 0.875rem; color: var(--text-secondary);">
            Category:
          </label>
          <select id="editNoteCategory" style="width: 100%; padding: var(--space-2); 
                  border: 1px solid var(--border); border-radius: var(--radius); 
                  background: var(--bg-secondary); color: var(--text-primary);">
            <option value="general" ${note.category === 'general' ? 'selected' : ''}>General</option>
            <option value="focus" ${note.category === 'focus' ? 'selected' : ''}>Focus Session</option>
            <option value="ideas" ${note.category === 'ideas' ? 'selected' : ''}>Ideas</option>
            <option value="tasks" ${note.category === 'tasks' ? 'selected' : ''}>Tasks</option>
            <option value="meeting" ${note.category === 'meeting' ? 'selected' : ''}>Meeting Notes</option>
          </select>
        </div>
        
        <!-- Formatting Toolbar -->
        <div class="formatting-toolbar" style="display: flex; gap: var(--space-1); padding: var(--space-2); 
                background: var(--bg-tertiary); border: 1px solid var(--border); 
                border-radius: var(--radius) var(--radius) 0 0; border-bottom: none; flex-wrap: wrap;">
          <!-- Text Formatting -->
          <button class="format-btn tooltip" data-format="bold" data-tooltip="Bold text (Cmd+B)" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            <strong>B</strong>
          </button>
          <button class="format-btn tooltip" data-format="italic" data-tooltip="Italic text (Cmd+I)" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            <em>I</em>
          </button>
          <button class="format-btn tooltip" data-format="underline" data-tooltip="Underline text (Cmd+U)" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            <u>U</u>
          </button>
          
          <div style="width: 1px; background: var(--border); margin: 0 var(--space-1);"></div>
          
          <!-- Headers -->
          <select class="header-select tooltip" data-tooltip="Header size" 
                  style="padding: var(--space-1); background: var(--bg-primary); 
                  border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                  position: relative;">
            <option value="">Normal</option>
            <option value="h1">Header 1</option>
            <option value="h2">Header 2</option>
            <option value="h3">Header 3</option>
          </select>
          
          <div style="width: 1px; background: var(--border); margin: 0 var(--space-1);"></div>
          
          <!-- Lists -->
          <button class="format-btn tooltip" data-format="bullet" data-tooltip="Bullet points" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            •
          </button>
          <button class="format-btn tooltip" data-format="number" data-tooltip="Numbered list" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            1.
          </button>
          
          <div style="width: 1px; background: var(--border); margin: 0 var(--space-1);"></div>
          
          <!-- Link -->
          <button class="format-btn tooltip" data-format="link" data-tooltip="Insert link (Cmd+K)" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            🔗
          </button>
          
          <div style="width: 1px; background: var(--border); margin: 0 var(--space-1);"></div>
          
          <!-- Alignment -->
          <button class="format-btn tooltip" data-format="align-left" data-tooltip="Align left" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            ≡
          </button>
          <button class="format-btn tooltip" data-format="align-center" data-tooltip="Align center" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            ≡
          </button>
          <button class="format-btn tooltip" data-format="align-right" data-tooltip="Align right" 
                  style="padding: var(--space-1) var(--space-2); background: var(--bg-primary); 
                         border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                         position: relative; transition: var(--transition);">
            ≡
          </button>
          
          <div style="width: 1px; background: var(--border); margin: 0 var(--space-1);"></div>
          
          <!-- Font Size -->
          <select class="font-size-select tooltip" data-tooltip="Text size (Normal, Small, Large)" 
                  style="padding: var(--space-1); background: var(--bg-primary); 
                  border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
                  position: relative;">
            <option value="small">Small</option>
            <option value="normal" selected>Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div contenteditable="true" id="editNoteContent" 
             style="min-height: 200px; padding: var(--space-3); margin-bottom: var(--space-3); 
                    border: 1px solid var(--border); border-radius: 0 0 var(--radius) var(--radius); 
                    background: var(--bg-secondary); color: var(--text-primary); 
                    overflow-y: auto; font-family: inherit; line-height: 1.6;">${note.content}</div>
        
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: var(--space-3);">
          <strong>Shortcuts:</strong> Cmd+B (bold), Cmd+I (italic), Cmd+U (underline), Cmd+K (link), Tab (indent), Cmd+S (save)
        </div>
        
        <!-- Platform Integration (Coming Soon) -->
        <div class="platform-integration" style="margin-bottom: var(--space-3); padding: var(--space-3); 
                background: var(--bg-tertiary); border-radius: var(--radius); opacity: 0.6;">
          <h4 style="margin: 0 0 var(--space-2) 0; font-size: 0.875rem;">Connected Platforms</h4>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button disabled style="padding: var(--space-2); background: var(--bg-primary); 
                    border: 1px solid var(--border); border-radius: var(--radius-sm); 
                    cursor: not-allowed; font-size: 0.875rem; opacity: 0.5;">
              📝 Notion (Coming Soon)
            </button>
            <button disabled style="padding: var(--space-2); background: var(--bg-primary); 
                    border: 1px solid var(--border); border-radius: var(--radius-sm); 
                    cursor: not-allowed; font-size: 0.875rem; opacity: 0.5;">
              📚 Obsidian (Coming Soon)
            </button>
            <button disabled style="padding: var(--space-2); background: var(--bg-primary); 
                    border: 1px solid var(--border); border-radius: var(--radius-sm); 
                    cursor: not-allowed; font-size: 0.875rem; opacity: 0.5;">
              📄 Google Docs (Coming Soon)
            </button>
          </div>
        </div>
        
        <div style="display: flex; gap: var(--space-3); justify-content: space-between;">
          <div style="display: flex; gap: var(--space-2);">
            <button class="export-action" data-format="txt" style="padding: var(--space-2); 
                    background: var(--bg-tertiary); color: var(--text-primary); 
                    border: none; border-radius: var(--radius); cursor: pointer; font-size: 0.875rem;">
              Export .txt
            </button>
            <button class="export-action" data-format="md" style="padding: var(--space-2); 
                    background: var(--bg-tertiary); color: var(--text-primary); 
                    border: none; border-radius: var(--radius); cursor: pointer; font-size: 0.875rem;">
              Export .md
            </button>
          </div>
          <div style="display: flex; gap: var(--space-3);">
            <button id="cancelEdit" style="padding: var(--space-2) var(--space-4); 
                    background: var(--bg-tertiary); color: var(--text-primary); 
                    border: none; border-radius: var(--radius); cursor: pointer;">Cancel</button>
            <button id="saveEdit" style="padding: var(--space-2) var(--space-4); 
                    background: var(--primary); color: white; 
                    border: none; border-radius: var(--radius); cursor: pointer;">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Get elements
    const contentDiv = document.getElementById('editNoteContent');
    const titleInput = document.getElementById('editNoteTitle');
    const categorySelect = document.getElementById('editNoteCategory');
    const closeBtn = modal.querySelector('.close-btn');
    let autoSaveTimeout;
    
    // Close modal function
    const closeModal = () => {
      clearTimeout(autoSaveTimeout);
      modal.remove();
    };
    
    // Close button click
    closeBtn.addEventListener('click', closeModal);
    
    // Close on ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Click outside to close (optional)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Cleanup event listener when modal closes
    const originalRemove = modal.remove.bind(modal);
    modal.remove = () => {
      document.removeEventListener('keydown', handleEsc);
      originalRemove();
    };
    
    // Auto-save functionality
    const autoSave = async () => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(async () => {
        note.content = contentDiv.innerText;
        note.htmlContent = contentDiv.innerHTML;
        note.title = titleInput.value;
        note.category = categorySelect.value;
        note.lastEdited = Date.now();
        notes[noteIndex] = note;
        await chrome.storage.local.set({ notes });
        
        // Mark as saved
        markSaved();
      }, 3000); // Auto-save after 3 seconds of inactivity
    };
    
    contentDiv.addEventListener('input', () => {
      markUnsaved();
      autoSave();
    });
    titleInput.addEventListener('input', () => {
      markUnsaved();
      autoSave();
    });
    categorySelect.addEventListener('change', () => {
      markUnsaved();
      autoSave();
    });
    
    // Formatting functions
    const applyFormat = (command, value = null) => {
      document.execCommand(command, false, value);
      contentDiv.focus();
      autoSave();
    };
    
    // Format button handlers
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const format = btn.dataset.format;
        
        switch(format) {
          case 'bold':
            applyFormat('bold');
            break;
          case 'italic':
            applyFormat('italic');
            break;
          case 'underline':
            applyFormat('underline');
            break;
          case 'bullet':
            applyFormat('insertUnorderedList');
            break;
          case 'number':
            applyFormat('insertOrderedList');
            break;
          case 'link':
            const url = prompt('Enter URL:');
            if (url) applyFormat('createLink', url);
            break;
          case 'align-left':
            applyFormat('justifyLeft');
            break;
          case 'align-center':
            applyFormat('justifyCenter');
            break;
          case 'align-right':
            applyFormat('justifyRight');
            break;
        }
      });
    });
    
    // Header dropdown
    document.querySelector('.header-select').addEventListener('change', (e) => {
      const value = e.target.value;
      if (value) {
        applyFormat('formatBlock', `<${value}>`);
      } else {
        applyFormat('formatBlock', '<p>');
      }
      e.target.value = '';
    });
    
    // Font size dropdown
    document.querySelector('.font-size-select').addEventListener('change', (e) => {
      const sizes = { small: '0.875em', normal: '1em', large: '1.25em' };
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = sizes[e.target.value];
        range.surroundContents(span);
      }
      autoSave();
    });
    
    // Keyboard shortcuts
    contentDiv.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
          case 'k':
            e.preventDefault();
            const url = prompt('Enter URL:');
            if (url) applyFormat('createLink', url);
            break;
        }
      }
      
      // Auto-formatting
      if (e.key === ' ') {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        const text = textNode.textContent;
        const offset = range.startOffset;
        
        // Check for auto-bullet
        if (text.substring(offset - 2, offset) === '- ') {
          e.preventDefault();
          document.execCommand('delete');
          document.execCommand('delete');
          applyFormat('insertUnorderedList');
        }
        // Check for auto-number
        else if (text.substring(offset - 3, offset) === '1. ') {
          e.preventDefault();
          document.execCommand('delete');
          document.execCommand('delete');
          document.execCommand('delete');
          applyFormat('insertOrderedList');
        }
      }
    });
    
    // Setup tooltips for all buttons with tooltip class
    this.setupTooltips(modal);
    
    // Track unsaved changes
    let hasUnsavedChanges = false;
    const saveBtn = modal.querySelector('#manualSaveBtn');
    
    const markUnsaved = () => {
      hasUnsavedChanges = true;
      saveBtn.style.background = 'var(--warning)';
      saveBtn.innerHTML = '<span>💾</span> Save*';
    };
    
    const markSaved = () => {
      hasUnsavedChanges = false;
      saveBtn.style.background = 'var(--primary)';
      saveBtn.innerHTML = '<span>💾</span> Save';
      
      // Show save indicator
      const indicator = modal.querySelector('.save-indicator');
      indicator.style.display = 'block';
      setTimeout(() => indicator.style.display = 'none', 2000);
    };
    
    // Share button functionality with dropdown
    const shareBtn = modal.querySelector('.share-btn');
    const shareDropdown = modal.querySelector('.share-dropdown');
    
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareDropdown.style.display = shareDropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!shareBtn.contains(e.target) && !shareDropdown.contains(e.target)) {
        shareDropdown.style.display = 'none';
      }
    });
    
    // Share option handlers
    modal.querySelectorAll('.share-option').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'var(--bg-tertiary)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'none';
      });
      
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const noteContent = contentDiv.innerText;
        const noteTitle = titleInput.value || 'Untitled Note';
        
        try {
          switch(action) {
            case 'email-note':
              // Create email with note content
              const subject = encodeURIComponent(`Note: ${noteTitle}`);
              const body = encodeURIComponent(`${noteTitle}\n\n${noteContent}\n\n---\nShared from Smart Bookmarks Extension`);
              const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
              
              // Try to open email client
              window.open(mailtoLink, '_blank');
              this.showNotification('Opening email client...', 'success');
              
              // Fallback message if email client doesn't open
              setTimeout(() => {
                this.showNotification('If email didn\'t open, copy text to share manually', 'info');
              }, 3000);
              break;
              
            case 'copy-link':
              // Generate secure shareable link using extension pages
              const noteId = note.id || `note-${note.timestamp}`;
              
              // Save the current note state for sharing
              notes[noteIndex] = {
                ...note,
                content: noteContent,
                htmlContent: contentDiv.innerHTML,
                title: noteTitle,
                category: categorySelect.value,
                lastEdited: Date.now()
              };
              await chrome.storage.local.set({ notes });
              
              // Generate extension URL for viewing the note
              const viewerUrl = chrome.runtime.getURL(`note-viewer.html?id=${encodeURIComponent(noteId)}`);
              
              await navigator.clipboard.writeText(viewerUrl);
              this.showNotification('Secure link copied! Share it with anyone.', 'success');
              break;
              
            case 'copy-text':
              await navigator.clipboard.writeText(noteContent);
              this.showNotification('Text copied to clipboard!', 'success');
              break;
              
            case 'download-pdf':
              // Create professional PDF-ready HTML content
              const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${noteTitle}</title>
  <style>
    @media print {
      body { margin: 0; }
      .pdf-content { page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .pdf-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e293b;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .pdf-meta {
      color: #64748b;
      font-size: 14px;
    }
    .pdf-content {
      font-size: 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .pdf-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    strong { font-weight: 600; }
    em { font-style: italic; }
    ul, ol { margin: 15px 0; padding-left: 30px; }
    li { margin: 5px 0; }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>${noteTitle}</h1>
    <div class="pdf-meta">
      Created: ${new Date(note.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      ${note.lastEdited ? `<br>Last edited: ${new Date(note.lastEdited).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
      ${note.category ? `<br>Category: ${note.category.charAt(0).toUpperCase() + note.category.slice(1)}` : ''}
    </div>
  </div>
  <div class="pdf-content">${contentDiv.innerHTML}</div>
  <div class="pdf-footer">
    Generated by Smart Bookmarks Extension • ${new Date().toLocaleDateString()}
  </div>
  <script>
    // Auto-trigger print dialog for PDF conversion
    window.onload = function() {
      window.print();
      // Close the tab after printing/canceling (optional)
      setTimeout(() => {
        window.close();
      }, 1000);
    };
  </script>
</body>
</html>`;
              
              // Create blob and download
              const pdfBlob = new Blob([pdfHtml], { type: 'text/html' });
              const pdfUrl = URL.createObjectURL(pdfBlob);
              
              // Open in new tab for printing/PDF conversion
              const printWindow = window.open(pdfUrl, '_blank');
              
              // Clean up after a delay
              setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
              }, 10000);
              
              this.showNotification('Opening PDF preview... Use Cmd+P to save as PDF', 'success');
              break;
          }
          
          // Close dropdown after action
          shareDropdown.style.display = 'none';
        } catch (error) {
          console.error('Share action failed:', error);
          this.showNotification('Share failed - check connection', 'error');
        }
      });
    });
    
    // Manual save button
    saveBtn.addEventListener('click', async () => {
      try {
        clearTimeout(autoSaveTimeout);
        note.content = contentDiv.innerText;
        note.htmlContent = contentDiv.innerHTML;
        note.title = titleInput.value;
        note.category = categorySelect.value;
        note.lastEdited = Date.now();
          notes[noteIndex] = note;
        await chrome.storage.local.set({ notes });
        
        markSaved();
        this.showNotification('Note saved!', 'success');
      } catch (error) {
        console.error('Save failed:', error);
        this.showNotification('Save failed - try again', 'error');
      }
    });
    
    // Keyboard shortcut for save (Cmd+S)
    contentDiv.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
      }
    });
    
    // Export handlers
    modal.querySelectorAll('.export-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        const noteContent = contentDiv.innerText;
        const noteTitle = titleInput.value || 'untitled-note';
        const filename = `${noteTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${format}`;
        
        let content = noteContent;
        if (format === 'md') {
          content = this.convertToMarkdown(contentDiv.innerHTML);
        }
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported as ${filename}`, 'success');
      });
    });
    
    // Event handlers
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    
    document.getElementById('saveEdit').addEventListener('click', async () => {
      clearTimeout(autoSaveTimeout);
      note.content = contentDiv.innerText;
      note.htmlContent = contentDiv.innerHTML;
      note.title = titleInput.value;
      note.category = categorySelect.value;
      note.lastEdited = Date.now();
      notes[noteIndex] = note;
      await chrome.storage.local.set({ notes });
      modal.remove();
      this.showNotification('Note updated!', 'success');
      this.updateRecentNotes();
    });
    
    // Focus on content
    contentDiv.focus();
  }
  
  async togglePinNote(noteIndex) {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const note = notes[noteIndex];
    if (!note) return;
    
    note.pinned = !note.pinned;
    
    // Move pinned notes to top
    if (note.pinned) {
      notes.splice(noteIndex, 1);
      notes.unshift(note);
    }
    
    await chrome.storage.local.set({ notes });
    this.updateRecentNotes();
  }
  
  async deleteNote(noteIndex) {
    const { notes = [] } = await chrome.storage.local.get('notes');
    notes.splice(noteIndex, 1);
    await chrome.storage.local.set({ notes });
    this.showNotification('Note deleted', 'info');
    this.updateRecentNotes();
  }
  
  convertToMarkdown(html) {
    // Basic HTML to Markdown conversion
    let markdown = html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      // Bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Underline (convert to emphasis)
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
      // Links
      .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Lists
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      // Paragraphs and breaks
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return markdown;
  }
  
  setupTooltips(container) {
    // Add tooltips to all elements with data-tooltip attribute
    container.querySelectorAll('[data-tooltip]').forEach(element => {
      let tooltipTimeout;
      let tooltip;
      
      element.addEventListener('mouseenter', () => {
        tooltipTimeout = setTimeout(() => {
          // Create tooltip
          tooltip = document.createElement('div');
          tooltip.className = 'tooltip-box';
          tooltip.textContent = element.dataset.tooltip;
          tooltip.style.cssText = `
            position: absolute;
            background: var(--gray-800);
            color: white;
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
          `;
          
          document.body.appendChild(tooltip);
          
          // Position tooltip
          const rect = element.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          
          // Position above the element by default
          let top = rect.top - tooltipRect.height - 8;
          let left = rect.left + (rect.width - tooltipRect.width) / 2;
          
          // If tooltip would go off-screen at top, position below
          if (top < 0) {
            top = rect.bottom + 8;
          }
          
          // Keep tooltip within viewport horizontally
          if (left < 0) {
            left = 8;
          } else if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 8;
          }
          
          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
          
          // Fade in
          requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
          });
        }, 500); // Show after 0.5 seconds
      });
      
      element.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeout);
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      });
      
      // Also remove on click
      element.addEventListener('click', () => {
        clearTimeout(tooltipTimeout);
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      });
    });
  }
  
  updateSessionTimerDisplay() {
    const sessionTimer = document.getElementById('sessionTimer');
    if (!sessionTimer) return;
    
    if (this.isTimerRunning && !this.isBreakTime) {
      const minutes = Math.floor(this.currentSeconds / 60);
      const seconds = this.currentSeconds % 60;
      sessionTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      sessionTimer.style.display = 'inline';
    } else {
      sessionTimer.style.display = 'none';
    }
  }
  
  async createSessionNote(session) {
    // Create a new note with session context
    const sessionDate = new Date(session.timestamp);
    const timeStr = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = sessionDate.toLocaleDateString();
    const duration = Math.round(session.duration);
    
    // Pre-filled note content
    const noteContent = `<h2>Focus Session Notes - ${dateStr} ${timeStr}</h2>
<p><strong>Session duration:</strong> ${duration} minutes</p>
<p><strong>What did you accomplish in this session?</strong></p>
<p></p>
<p><strong>Key insights or challenges:</strong></p>
<p></p>
<p><strong>Next steps:</strong></p>
<p></p>`;
    
    // Save the note
    const newNote = {
      id: `session-note-${Date.now()}`,
      content: noteContent,
      htmlContent: noteContent,
      type: 'session',
      storageType: 'local',
      timestamp: Date.now(),
      category: 'focus',
      title: `Focus Session - ${timeStr}`,
      pinned: false,
      sessionData: {
        duration: duration,
        sessionTime: session.timestamp
      }
    };
    
    await this.saveNote(newNote);
    
    // Switch to notes tab
    this.switchTab('notes');
    
    // Find the note index and open editor
    const { notes = [] } = await chrome.storage.local.get('notes');
    const noteIndex = notes.findIndex(n => n.id === newNote.id);
    if (noteIndex !== -1) {
      // Small delay to ensure UI is updated
      setTimeout(() => {
        this.editNote(noteIndex);
      }, 100);
    }
  }

  async updateSessionHistory() {
    const { focusAnalytics = { sessions: [] } } = await chrome.storage.local.get('focusAnalytics');
    const sessionHistory = document.getElementById('sessionHistory');
    
    if (!sessionHistory) return;
    
    const todaySessions = focusAnalytics.sessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    });
    
    if (todaySessions.length === 0) {
      sessionHistory.innerHTML = `
        <div style="padding: var(--space-4); text-align: center; color: var(--text-tertiary); font-size: 0.875rem;">
          No sessions completed today
        </div>
      `;
      return;
    }
    
    const sessionsHTML = todaySessions.map((session, index) => {
      const time = new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const duration = Math.round(session.duration);
      
      return `
        <div class="session-item" data-session-index="${index}" style="padding: var(--space-2) var(--space-3); 
                    background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.875rem; 
                    cursor: pointer; transition: var(--transition);"
             title="Click to add notes about this session">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${time}</span>
            <span style="color: var(--text-secondary);">${duration} min</span>
            <span class="add-notes-link" style="color: var(--primary); font-size: 0.75rem;">→ Add notes</span>
          </div>
        </div>
      `;
    }).join('');
    
    sessionHistory.innerHTML = sessionsHTML;
    
    // Add event listeners for session notes
    document.querySelectorAll('.session-item').forEach(item => {
      item.addEventListener('click', () => {
        const sessionIndex = parseInt(item.dataset.sessionIndex);
        const session = todaySessions[sessionIndex];
        this.createSessionNote(session);
      });
    });
  }

  setupProModal() {
    // Get modal and button elements
    const modal = document.getElementById('proModal');
    const websiteBlockingCard = document.getElementById('websiteBlockingCard');
    const closeModalBtn = document.getElementById('closeProModal');
    const previewBtn = document.getElementById('previewBlockBtn');
    const upgradeBtn = document.getElementById('upgradeToProBtn');
    const maybeLaterBtn = document.getElementById('maybeLaterBtn');
    
    // Show modal when website blocking card is clicked
    websiteBlockingCard?.addEventListener('click', () => {
      this.showProModal();
    });
    
    // Close modal functions
    const closeModal = () => {
      this.hideProModal();
    };
    
    // Close button
    closeModalBtn?.addEventListener('click', closeModal);
    
    // Maybe later button
    maybeLaterBtn?.addEventListener('click', closeModal);
    
    // Close on background click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('show')) {
        closeModal();
      }
    });
    
    // Preview button - show demo blocking experience
    previewBtn?.addEventListener('click', () => {
      this.previewBlockingDemo();
    });
    
    // Upgrade button - open Stripe checkout
    upgradeBtn?.addEventListener('click', async () => {
      await this.openStripeCheckout();
    });
  }
  
  showProModal() {
    const modal = document.getElementById('proModal');
    if (modal) {
      modal.classList.add('show');
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
  }
  
  hideProModal() {
    const modal = document.getElementById('proModal');
    if (modal) {
      modal.classList.remove('show');
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }
  
  previewBlockingDemo() {
    // Hide the modal
    this.hideProModal();
    
    // Show a temporary blocking overlay demo
    const demoOverlay = document.createElement('div');
    demoOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;
    
    demoOverlay.innerHTML = `
      <div style="text-align: center; color: white; max-width: 400px; padding: 20px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
        <h2 style="font-size: 24px; margin-bottom: 16px;">This site is blocked</h2>
        <p style="opacity: 0.8; margin-bottom: 24px;">
          You're in focus mode. Stay on track and finish your current task first.
        </p>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 14px; opacity: 0.7; margin: 0;">Time remaining in focus session</p>
          <p style="font-size: 32px; font-weight: bold; margin: 8px 0;">23:45</p>
        </div>
        <button style="
          background: white;
          color: black;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 8px;
        ">Close Demo</button>
        <p style="font-size: 12px; opacity: 0.5; margin-top: 16px;">
          This is a preview. Upgrade to Pro to block distracting websites during focus sessions.
        </p>
      </div>
    `;
    
    document.body.appendChild(demoOverlay);
    
    // Add fade-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove demo after click or after 5 seconds
    const removeDemo = () => {
      demoOverlay.remove();
      style.remove();
    };
    
    demoOverlay.addEventListener('click', removeDemo);
    setTimeout(removeDemo, 5000);
  }
  
  async openStripeCheckout() {
    console.log('💰 Opening Stripe checkout');
    
    // Check if we have a saved Stripe Payment Link
    const result = await chrome.storage.local.get(['stripePaymentLink']);
    const savedLink = result.stripePaymentLink;
    
    if (savedLink && savedLink.includes('buy.stripe.com')) {
      // We have a real Stripe link - use it!
      chrome.tabs.create({
        url: savedLink,
        active: true
      });
      
      this.showCheckoutOpenedMessage();
    } else {
      // No link yet - show setup flow
      this.showStripeSetupFlow();
    }
  }
  
  showStripeSetupFlow() {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
      <div style="padding: 20px;">
        <h2 style="color: #1a73e8; margin-bottom: 20px;">🔐 Set Up Stripe Payment Link</h2>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ffeaa7;">
          <strong>Step 1:</strong> 
          <a href="https://dashboard.stripe.com/payment-links" target="_blank" style="color: #0066cc; text-decoration: underline;">
            Open Stripe Dashboard → Payment Links
          </a>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #c3e6cb;">
          <strong>Step 2:</strong> Create Payment Link with:<br>
          <div style="margin-left: 20px; margin-top: 5px;">
            • Product: <code style="background: #e9ecef; padding: 2px 4px;">Smart Bookmarks Pro</code><br>
            • Price: <code style="background: #e9ecef; padding: 2px 4px;">$9.99 USD</code><br>
            • Billing: <code style="background: #e9ecef; padding: 2px 4px;">Monthly recurring</code>
          </div>
        </div>
        
        <div style="background: #cce5ff; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #b8daff;">
          <strong>Step 3:</strong> Paste your Payment Link URL:
          <input 
            type="text" 
            id="stripe-link-input" 
            placeholder="https://buy.stripe.com/..." 
            style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px;"
          >
          <button 
            onclick="window.smartBookmarksApp.saveStripeLink()" 
            style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; width: 100%;"
          >
            Save & Test Payment Link
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button 
            onclick="window.smartBookmarksApp.hideProModal()" 
            style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Focus the input field
    setTimeout(() => {
      document.getElementById('stripe-link-input')?.focus();
    }, 100);
  }
  
  async saveStripeLink() {
    const input = document.getElementById('stripe-link-input');
    const stripeLink = input?.value?.trim();
    
    if (!stripeLink) {
      input.style.borderColor = '#dc3545';
      input.placeholder = 'Please enter your Stripe Payment Link';
      return;
    }
    
    if (!stripeLink.includes('buy.stripe.com')) {
      input.style.borderColor = '#dc3545';
      alert('Please enter a valid Stripe Payment Link (must start with buy.stripe.com)');
      return;
    }
    
    // Save the link
    await chrome.storage.local.set({ stripePaymentLink: stripeLink });
    console.log('✅ Stripe Payment Link saved:', stripeLink);
    
    // Test it immediately
    chrome.tabs.create({ url: stripeLink, active: true });
    
    // Show success message
    this.showCheckoutOpenedMessage();
  }
  
  showCheckoutOpenedMessage() {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <h2 style="color: #4285f4;">🔐 Secure Checkout Opened</h2>
        <p style="font-size: 18px; margin: 20px 0;">Complete your payment in the new tab to unlock Pro features.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
          <strong style="color: #1a73e8;">After successful payment:</strong><br>
          <div style="margin-top: 10px; line-height: 1.8; color: #202124;">
            • Pro features unlock automatically<br>
            • Extended focus sessions available<br>
            • Website blocking enabled<br>
            • Advanced analytics unlocked<br>
            • Priority support activated
          </div>
        </div>
        
        <button 
          onclick="window.smartBookmarksApp.hideProModal()" 
          style="background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;"
        >
          Got it!
        </button>
        
        <p style="margin-top: 20px; font-size: 12px; color: #5f6368;">
          💳 Secure payment processing by Stripe
        </p>
      </div>
    `;
  }
  
  // Email copy function removed - using real Stripe payments instead
  
  // Removed complex payment form - using simple redirect instead
  
  // Removed complex payment submit - using simple redirect instead
  
  // Removed payment message - using simple redirect instead
  
  // Removed unlock features - handled by backend after payment
  
  // Removed fallback popup - using simple redirect instead
  
  // Removed payment status check - handled by backend
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.smartBookmarksApp = new SmartBookmarksApp();
  
  // CRITICAL FIX: Add global click handler for Pro features
  console.log('🚨 ADDING WEBSITE BLOCKING CLICK HANDLER');
  
  // Method 1: Direct click handler on the card
  const websiteBlockingCard = document.getElementById('websiteBlockingCard');
  if (websiteBlockingCard) {
    console.log('✅ Website Blocking Card Found:', websiteBlockingCard);
    websiteBlockingCard.style.cursor = 'pointer';
    
    websiteBlockingCard.addEventListener('click', function(e) {
      console.log('🔥 WEBSITE BLOCKING CLICKED!');
      e.preventDefault();
      e.stopPropagation();
      
      // Show the Pro modal
      if (window.smartBookmarksApp && window.smartBookmarksApp.showProModal) {
        window.smartBookmarksApp.showProModal();
      } else {
        // Fallback: Show modal directly
        const modal = document.getElementById('proModal');
        if (modal) {
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
          console.log('✅ Modal shown via fallback');
        } else {
          console.error('❌ Pro modal not found!');
        }
      }
    });
  } else {
    console.error('❌ Website Blocking Card NOT FOUND!');
  }
  
  // Method 2: Global delegated event listener as backup
  document.addEventListener('click', function(e) {
    const proFeature = e.target.closest('[data-pro-feature="website-blocking"]');
    if (proFeature) {
      console.log('🎯 Pro feature clicked via delegation:', proFeature);
      e.preventDefault();
      e.stopPropagation();
      
      // Show the Pro modal
      const modal = document.getElementById('proModal');
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    }
  });
});

// Clean up when popup is closed
window.addEventListener('unload', () => {
  if (window.smartBookmarksApp) {
    // Clear intervals
    if (window.smartBookmarksApp.timerInterval) {
      clearInterval(window.smartBookmarksApp.timerInterval);
    }
    if (window.smartBookmarksApp.syncInterval) {
      clearInterval(window.smartBookmarksApp.syncInterval);
    }
  }
});


// Header button handlers
document.addEventListener('DOMContentLoaded', () => {
  const notificationsBtn = document.getElementById('notificationsBtn');
  const accountBtn = document.getElementById('accountBtn');
  
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.smartBookmarksApp.toggleNotificationPanel();
    });
  }
  
  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      window.smartBookmarksApp.switchTab('settings');
    });
  }
});