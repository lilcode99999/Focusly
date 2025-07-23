/**
 * EMERGENCY CHART TEST SCRIPT
 * Run this in the extension console to force chart rendering
 */

console.log('🚨 EMERGENCY CHART TEST STARTING...');

// Step 1: Check if we're on the Focus tab
const focusTab = document.getElementById('focusTab');
const isActive = focusTab && focusTab.classList.contains('active');
console.log('1. Focus tab element:', focusTab);
console.log('2. Focus tab is active:', isActive);

// Step 2: Find the chart container
const container = document.getElementById('focusChartInsight');
console.log('3. Chart container found:', container);
console.log('4. Container dimensions:', container ? `${container.offsetWidth}x${container.offsetHeight}` : 'N/A');

// Step 3: If container exists, force render a simple chart
if (container) {
  console.log('5. Forcing chart render...');
  
  // Clear any existing content
  container.innerHTML = '';
  
  // Add a bright yellow test box first
  const testBox = document.createElement('div');
  testBox.style.cssText = 'background: yellow; color: black; padding: 20px; margin-bottom: 10px; font-weight: bold; text-align: center;';
  testBox.textContent = '⚡ CHART TEST: JavaScript is running!';
  container.appendChild(testBox);
  
  // Create the chart HTML
  const chartHTML = `
    <div style="width: 100%; padding: 10px; background: white; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; color: #333;">Weekly Focus Progress</h4>
      <div style="display: flex; align-items: flex-end; height: 100px; gap: 4px;">
        <div style="flex: 1; height: 50%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 33%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 67%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 20%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 100%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 83%; background: #93bbfc; border-radius: 4px 4px 0 0;"></div>
        <div style="flex: 1; height: 15%; background: #2563eb; border-radius: 4px 4px 0 0;"></div>
      </div>
      <div style="display: flex; gap: 4px; margin-top: 5px;">
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Mon</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Tue</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Wed</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Thu</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Fri</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #666;">Sat</div>
        <div style="flex: 1; text-align: center; font-size: 11px; color: #2563eb; font-weight: bold;">Sun</div>
      </div>
    </div>
  `;
  
  // Add the chart
  const chartDiv = document.createElement('div');
  chartDiv.innerHTML = chartHTML;
  container.appendChild(chartDiv);
  
  console.log('✅ Chart rendered successfully!');
  console.log('6. Container now contains:', container.innerHTML.substring(0, 100) + '...');
} else {
  console.error('❌ Chart container not found! Are you on the Focus tab?');
  
  // Try to find any element with "chart" in its ID
  const allChartElements = document.querySelectorAll('[id*="chart"]');
  console.log('7. Found elements with "chart" in ID:', allChartElements.length);
  allChartElements.forEach((el, i) => {
    console.log(`   - ${i}: ${el.id} (${el.tagName})`);
  });
}

// Step 4: Check if the app object exists
console.log('8. App object exists:', typeof window.smartBookmarksApp !== 'undefined');
if (window.smartBookmarksApp) {
  console.log('9. App userData:', window.smartBookmarksApp.userData);
  console.log('10. Calling app.updateFocusChart()...');
  try {
    window.smartBookmarksApp.updateFocusChart();
    console.log('✅ updateFocusChart() called successfully');
  } catch (error) {
    console.error('❌ Error calling updateFocusChart():', error);
  }
}

console.log('🚨 EMERGENCY CHART TEST COMPLETE');
console.log('If you see the yellow box and chart above, JavaScript execution works!');
console.log('If not, check that you are on the Focus tab.');