import React, { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import GeneralSettings from './sections/GeneralSettings';
import FocusSettings from './sections/FocusSettings';
import AISettings from './sections/AISettings';
import BlockingSettings from './sections/BlockingSettings';
import PrivacySettings from './sections/PrivacySettings';
import AccessibilitySettings from './sections/AccessibilitySettings';
import BackupSettings from './sections/BackupSettings';
import AppIcon, { AppIconName } from '@/components/common/AppIcon';

type SettingsTab = 'general' | 'focus' | 'ai' | 'blocking' | 'privacy' | 'accessibility' | 'backup';

interface TabInfo {
  id: SettingsTab;
  label: string;
  icon: AppIconName;
  description: string;
}

const SETTINGS_TABS: TabInfo[] = [
  {
    id: 'general',
    label: 'General',
    icon: 'settings',
    description: 'Basic app preferences and appearance',
  },
  {
    id: 'focus',
    label: 'Focus & Timer',
    icon: 'timer',
    description: 'Pomodoro timer and focus session settings',
  },
  {
    id: 'ai',
    label: 'AI Assist',
    icon: 'message',
    description: 'Local context helpers and parked AI routing',
  },
  {
    id: 'blocking',
    label: 'Website Blocking',
    icon: 'alert',
    description: 'Block distracting websites during focus time',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: 'check-circle',
    description: 'Data collection and privacy controls',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: 'wind',
    description: 'Accessibility and ADHD-friendly options',
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: 'save',
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
          <div className="settings-title-lockup">
            <span className="settings-title-icon" aria-hidden="true">
              <AppIcon name="zap" size={20} />
            </span>
            <div>
              <p className="settings-eyebrow">Extension Settings</p>
              <h1 className="settings-title">Smart Bookmarks</h1>
              <p className="settings-subtitle">
                Tune the local-first context recovery workspace.
              </p>
            </div>
          </div>
          <div className="settings-header-status" aria-label="Current checkpoint">
            <span className="settings-status-dot" aria-hidden="true" />
            Local-first checkpoint
          </div>
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
              <span className="settings-nav-icon" aria-hidden="true">
                <AppIcon name={tab.icon} size={17} />
              </span>
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
            Smart Bookmarks local-first MVP
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
