import React, { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { SettingsSection, SettingsCard } from '@/components/Settings/SettingsComponents';
import GeneralSettings from './sections/GeneralSettings';
import FocusSettings from './sections/FocusSettings';
import AISettings from './sections/AISettings';
import BlockingSettings from './sections/BlockingSettings';
import PrivacySettings from './sections/PrivacySettings';
import AccessibilitySettings from './sections/AccessibilitySettings';
import BackupSettings from './sections/BackupSettings';

type SettingsTab = 'general' | 'focus' | 'ai' | 'blocking' | 'privacy' | 'accessibility' | 'backup';

interface TabInfo {
  id: SettingsTab;
  label: string;
  icon: string;
  description: string;
}

const SETTINGS_TABS: TabInfo[] = [
  {
    id: 'general',
    label: 'General',
    icon: '⚙️',
    description: 'Basic app preferences and appearance',
  },
  {
    id: 'focus',
    label: 'Focus & Timer',
    icon: '⏱️',
    description: 'Pomodoro timer and focus session settings',
  },
  {
    id: 'ai',
    label: 'AI Assist',
    icon: '🤖',
    description: 'Local context helpers and parked AI routing',
  },
  {
    id: 'blocking',
    label: 'Website Blocking',
    icon: '🚫',
    description: 'Block distracting websites during focus time',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: '🔒',
    description: 'Data collection and privacy controls',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: '♿',
    description: 'Accessibility and ADHD-friendly options',
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: '☁️',
    description: 'Local export and restore settings',
  },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { settings, isLoading } = useSettings();

  // Handle URL hash navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1) as SettingsTab;
    if (hash && SETTINGS_TABS.some(tab => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const handleKeyDown = (event: React.KeyboardEvent, tabId: SettingsTab) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tabId);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'focus':
        return <FocusSettings />;
      case 'ai':
        return <AISettings />;
      case 'blocking':
        return <BlockingSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'accessibility':
        return <AccessibilitySettings />;
      case 'backup':
        return <BackupSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  if (isLoading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-header-content">
          <h1 className="settings-title">
            <span className="settings-title-icon">⚡</span>
            Smart Bookmarks Settings
          </h1>
          <p className="settings-subtitle">
            Tune your local-first context recovery workspace
          </p>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" role="tablist" aria-label="Settings categories">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`settings-nav-item ${activeTab === tab.id ? 'settings-nav-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
            >
              <span className="settings-nav-icon">{tab.icon}</span>
              <div className="settings-nav-content">
                <span className="settings-nav-label">{tab.label}</span>
                <span className="settings-nav-description">{tab.description}</span>
              </div>
            </button>
          ))}
        </nav>

        <main className="settings-main">
          <div
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            className="settings-content"
          >
            {renderTabContent()}
          </div>
        </main>
      </div>

      <footer className="settings-footer">
        <div className="settings-footer-content">
          <p className="settings-footer-text">
            Smart Bookmarks v2.0.0 • Made with ❤️ for neurodivergent minds
          </p>
          <div className="settings-footer-links">
            <span>Local-first MVP checkpoint</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;
