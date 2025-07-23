/**
 * EMERGENCY CHART FIX
 * If the chart is still not showing, run this code in the extension console
 */

// Step 1: Check if we're on the Focus tab
const focusTab = document.getElementById('focusTab');
if (!focusTab || !focusTab.classList.contains('active')) {
  console.error('❌ You must be on the Focus tab first!');
  console.log('Click the Focus tab, then run this script again.');
} else {
  console.log('✅ Focus tab is active');
  
  // Step 2: Find the chart container
  const container = document.getElementById('focusChartInsight');
  if (!container) {
    console.error('❌ Chart container not found!');
  } else {
    console.log('✅ Chart container found:', container);
    
    // Step 3: Clear and style the container
    container.innerHTML = '';
    container.style.display = 'block';
    container.style.width = '100%';
    container.style.height = '140px';
    container.style.backgroundColor = '#f8f9fa';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.boxSizing = 'border-box';
    
    // Step 4: Inject a working chart
    const testData = [45, 30, 60, 15, 90, 75, 6];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...testData);
    
    const chartHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div style="flex: 1; display: flex; align-items: flex-end; gap: 4px;">
          ${testData.map((value, i) => {
            const height = (value / maxValue) * 100;
            const isToday = i === 6;
            return `
              <div style="flex: 1; 
                          height: ${height}%; 
                          background: ${isToday ? '#2563eb' : '#93bbfc'};
                          border-radius: 4px 4px 0 0;
                          position: relative;
                          transition: all 0.3s ease;">
                <div style="position: absolute; 
                            top: -20px; 
                            left: 0; 
                            right: 0; 
                            text-align: center;
                            font-size: 11px;
                            font-weight: ${isToday ? 'bold' : 'normal'};
                            color: #333;">
                  ${value}m
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; gap: 4px; margin-top: 8px;">
          ${dayLabels.map((label, i) => `
            <div style="flex: 1; 
                        text-align: center; 
                        font-size: 11px;
                        color: ${i === 6 ? '#2563eb' : '#666'};
                        font-weight: ${i === 6 ? 'bold' : 'normal'};">
              ${label}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = chartHTML;
    console.log('✅ Chart injected successfully!');
    
    // Step 5: Update the app's chart method to use real data
    if (window.smartBookmarksApp) {
      console.log('🔧 Updating app chart method...');
      
      // Get real user data
      const userData = window.smartBookmarksApp.userData;
      console.log('📊 User data:', userData);
      
      // Force update with real data
      setTimeout(() => {
        window.smartBookmarksApp.updateFocusChart();
        console.log('✅ Chart updated with real data');
      }, 100);
    }
  }
}

// Additional debugging info
console.log('\n📋 DEBUGGING INFO:');
console.log('1. App exists:', !!window.smartBookmarksApp);
console.log('2. Focus tab active:', document.querySelector('.tab-content#focusTab.active') !== null);
console.log('3. Chart container exists:', document.getElementById('focusChartInsight') !== null);
console.log('4. User data available:', window.smartBookmarksApp ? window.smartBookmarksApp.userData : 'N/A');

console.log('\n💡 If the chart still doesn\'t appear:');
console.log('1. Close and reopen the extension');
console.log('2. Make sure you\'re on the Focus tab');
console.log('3. Run this script again');
console.log('4. Check for any CSP errors in the console');