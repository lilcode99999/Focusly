/**
 * QUICK CHART TEST - Run this in the extension console
 * This will force the chart to render immediately
 */

console.log('🔥 FORCING CHART RENDER...');

// Method 1: Direct DOM manipulation
const container = document.getElementById('focusChartInsight');
if (container) {
    console.log('✅ Container found!');
    
    // Show immediate visual feedback
    container.style.border = '3px solid red';
    container.style.background = 'yellow';
    container.innerHTML = '<h1 style="color: black; text-align: center;">CHART LOADING...</h1>';
    
    // Wait a moment then render chart
    setTimeout(() => {
        container.style.background = 'white';
        container.innerHTML = `
            <div style="padding: 10px;">
                <h4 style="margin: 0 0 10px 0;">Weekly Focus Progress</h4>
                <div style="display: flex; align-items: flex-end; height: 100px; gap: 4px;">
                    <div style="flex: 1; height: 50%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 33%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 67%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 20%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 100%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 83%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
                    <div style="flex: 1; height: 15%; background: #2563eb; border-radius: 4px 4px 0 0;"></div>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 5px; font-size: 11px;">
                    <div style="flex: 1; text-align: center;">Mon</div>
                    <div style="flex: 1; text-align: center;">Tue</div>
                    <div style="flex: 1; text-align: center;">Wed</div>
                    <div style="flex: 1; text-align: center;">Thu</div>
                    <div style="flex: 1; text-align: center;">Fri</div>
                    <div style="flex: 1; text-align: center;">Sat</div>
                    <div style="flex: 1; text-align: center; color: #2563eb; font-weight: bold;">Sun</div>
                </div>
            </div>
        `;
        console.log('✅ Chart rendered!');
    }, 500);
} else {
    console.error('❌ Container not found! Make sure you are on the Focus tab.');
}

// Method 2: Try calling the app method
if (window.smartBookmarksApp && typeof window.smartBookmarksApp.updateFocusChart === 'function') {
    console.log('🎯 Calling app.updateFocusChart()...');
    try {
        window.smartBookmarksApp.updateFocusChart();
        console.log('✅ Method called successfully!');
    } catch (error) {
        console.error('❌ Error calling method:', error);
    }
} else {
    console.log('⚠️ App method not available');
}

console.log('🔥 TEST COMPLETE - Check the Focus tab for results!');