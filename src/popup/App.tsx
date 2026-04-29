import React, { useCallback, useState, useEffect } from 'react';
import TabBar from '@/components/Layout/TabBar';
import TabPanel from '@/components/Layout/TabPanel';
import HomeTab from '@/components/Home/HomeTab';
import FocusTab from '@/components/Focus/FocusTab';
import LibraryTab from '@/components/Library/LibraryTab';
import InsightsTab from '@/components/Insights/InsightsTab';
import NotesTab from '@/components/Notes/NotesTab';
import { markOnboardingStep } from '@/services/localOnboarding';

export type Tab = 'home' | 'focus' | 'library' | 'notes' | 'insights';

const isPopupTab = (tab: unknown): tab is Tab => (
  tab === 'home' ||
  tab === 'focus' ||
  tab === 'library' ||
  tab === 'notes' ||
  tab === 'insights'
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'insights') {
      void markOnboardingStep('viewedInsights');
    }
  }, []);

  useEffect(() => {
    const handleRuntimeMessage = (message: { type?: string; tab?: unknown }) => {
      if (message.type === 'SWITCH_TAB' && isPopupTab(message.tab)) {
        handleTabChange(message.tab);
      }

      if (message.type === 'START_FOCUS' || message.type === 'START_FOCUS_SESSION') {
        handleTabChange('focus');
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
  }, [handleTabChange]);

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="app">
      <div className="app-header">
        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <button
          className="settings-button"
          onClick={openSettings}
          title="Open Settings"
        >
          ⚙️
        </button>
      </div>

      <div className="tab-content">
        <TabPanel isActive={activeTab === 'home'}>
          <HomeTab onNavigate={handleTabChange} />
        </TabPanel>

        <TabPanel isActive={activeTab === 'focus'}>
          <FocusTab />
        </TabPanel>

        <TabPanel isActive={activeTab === 'library'}>
          <LibraryTab />
        </TabPanel>

        <TabPanel isActive={activeTab === 'notes'}>
          <NotesTab />
        </TabPanel>

        <TabPanel isActive={activeTab === 'insights'}>
          <InsightsTab />
        </TabPanel>
      </div>
    </div>
  );
};

export default App;
