// break-notification.js - External script for break notification overlay
console.log('🟣 Break notification script loaded');

// Get notification type from URL params
const params = new URLSearchParams(window.location.search);
const type = params.get('type') || 'focus-complete';
const duration = params.get('duration') || '0';
console.log('🟣 Notification type:', type, 'Duration:', duration);

// Configure UI based on type
const config = {
  'focus-complete': {
    bodyClass: 'focus-complete',
    emoji: '🎯',
    title: 'Focus Session Complete!',
    subtitle: `Great job! You focused for ${duration} minutes. Time for a break.`,
    actions: [
      { action: 'break5', text: 'Take 5 Min Break', primary: true },
      { action: 'break10', text: '10 Min Break', primary: false },
      { action: 'custom', text: 'Custom Break', primary: false },
      { action: 'skip', text: 'Skip Break', primary: false }
    ]
  },
  'break-complete': {
    bodyClass: 'break-complete',
    emoji: '⚡',
    title: 'Break Over - Ready to Focus!',
    subtitle: "How long do you want to focus?",
    actions: [
      { action: 'focus15', text: '15 Minutes', primary: false },
      { action: 'focus25', text: '25 Minutes', primary: true },
      { action: 'focus45', text: '45 Minutes', primary: false },
      { action: 'focusCustom', text: 'Custom Time', primary: false }
    ]
  }
};

const currentConfig = config[type] || config['focus-complete'];

// Apply configuration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Apply configuration
  document.body.className = currentConfig.bodyClass;
  document.getElementById('emoji').textContent = currentConfig.emoji;
  document.getElementById('title').textContent = currentConfig.title;
  document.getElementById('subtitle').textContent = currentConfig.subtitle;
  
  // Show secondary actions for break-complete
  const secondaryActions = document.getElementById('secondaryActions');
  if (type === 'break-complete' && secondaryActions) {
    secondaryActions.style.display = 'flex';
  }
  
  // Render actions
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = currentConfig.actions.map(action => 
    `<button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${action.action}">
      ${action.text}
    </button>`
  ).join('');
  
  // Handle button clicks
  actionsContainer.addEventListener('click', async (e) => {
    if (e.target.matches('button')) {
      const button = e.target;
      const action = button.dataset.action;
      
      // Visual feedback
      const originalText = button.textContent;
      button.textContent = 'Sending...';
      button.disabled = true;
      
      if (action === 'custom' || action === 'focusCustom') {
        // Show custom time input
        const isBreak = action === 'custom';
        const promptText = isBreak ? 
          'Enter break duration in minutes (2-60):' : 
          'Enter focus duration in minutes (5-90):';
        const defaultValue = isBreak ? '15' : '25';
        const customMinutes = prompt(promptText, defaultValue);
        if (customMinutes) {
          const minutes = parseInt(customMinutes);
          const minMinutes = isBreak ? 2 : 5;
          const maxMinutes = isBreak ? 60 : 90;
          if (!isNaN(minutes) && minutes >= minMinutes && minutes <= maxMinutes) {
            console.log('🔴 Sending custom action:', minutes, 'minutes', isBreak ? 'break' : 'focus');
            chrome.runtime.sendMessage({
              action: 'breakNotificationAction',
              breakAction: isBreak ? 'customBreak' : 'customFocus',
              duration: minutes
            }, (response) => {
              console.log('🔴 Custom break response:', response);
              if (chrome.runtime.lastError) {
                console.error('🔴 Chrome runtime error:', chrome.runtime.lastError);
              }
              // Small delay to ensure message is processed
              setTimeout(() => {
                window.close();
              }, 100);
            });
          } else {
            alert(`Please enter a valid number between ${minMinutes} and ${maxMinutes} minutes.`);
            // Restore button
            button.textContent = originalText;
            button.disabled = false;
            return;
          }
        } else {
          // User cancelled, restore button
          button.textContent = 'Custom Break';
          button.disabled = false;
        }
      } else {
        console.log('🔴 Sending break action:', action);
        console.log('🔴 Full message:', {
          action: 'breakNotificationAction',
          breakAction: action
        });
        
        chrome.runtime.sendMessage({
          action: 'breakNotificationAction',
          breakAction: action
        }, (response) => {
          console.log('🔴 Break action response:', response);
          if (chrome.runtime.lastError) {
            console.error('🔴 Chrome runtime error:', chrome.runtime.lastError);
            alert('Error: ' + chrome.runtime.lastError.message);
            button.textContent = originalText;
            button.disabled = false;
            return;
          }
          
          if (!response || !response.success) {
            console.error('🔴 No success response');
            alert('Failed to start break timer');
            button.textContent = originalText;
            button.disabled = false;
            return;
          }
          
          // Success - close window
          console.log('🔴 Success! Closing window...');
          setTimeout(() => {
            window.close();
          }, 100);
        });
      }
    }
  });
  
  // Countdown timer
  let countdown = 90;
  const countdownEl = document.getElementById('countdown');
  const progressRing = document.getElementById('progressRing');
  const circumference = 2 * Math.PI * 18;
  
  progressRing.style.strokeDasharray = circumference;
  
  const updateCountdown = () => {
    countdown--;
    countdownEl.textContent = countdown;
    
    const progress = (90 - countdown) / 90;
    const offset = circumference - (progress * circumference);
    progressRing.style.strokeDashoffset = offset;
    
    if (countdown <= 0) {
      // Auto-select skip/done action when timer runs out
      const skipAction = type === 'focus-complete' ? 'skip' : 'done';
      chrome.runtime.sendMessage({
        action: 'breakNotificationAction',
        breakAction: skipAction
      });
      window.close();
    }
  };
  
  setInterval(updateCountdown, 1000);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.close();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Trigger primary action
      const primaryBtn = document.querySelector('.btn-primary');
      if (primaryBtn) {
        primaryBtn.click();
      }
    } else if (e.key >= '1' && e.key <= '4') {
      // Number keys trigger corresponding button (1-4 for up to 4 buttons)
      const buttons = document.querySelectorAll('.btn');
      const index = parseInt(e.key) - 1;
      if (buttons[index]) {
        buttons[index].click();
      }
    }
  });
  
  // Focus primary button on load
  const primaryBtn = document.querySelector('.btn-primary');
  if (primaryBtn) {
    primaryBtn.focus();
  }
  
  // Handle secondary action buttons
  const extendBreakBtn = document.getElementById('extendBreakBtn');
  const stopTimerBtn = document.getElementById('stopTimerBtn');
  
  if (extendBreakBtn) {
    extendBreakBtn.addEventListener('click', () => {
      console.log('🔴 Extending break by 5 minutes');
      chrome.runtime.sendMessage({
        action: 'breakNotificationAction',
        breakAction: 'extend'
      }, (response) => {
        console.log('🔴 Extend break response:', response);
        window.close();
      });
    });
  }
  
  if (stopTimerBtn) {
    stopTimerBtn.addEventListener('click', () => {
      console.log('🔴 Stopping timer');
      chrome.runtime.sendMessage({
        action: 'breakNotificationAction',
        breakAction: 'done'
      }, (response) => {
        console.log('🔴 Stop timer response:', response);
        window.close();
      });
    });
  }
});