import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSelect,
  SettingsButtonGroup,
} from '@/components/Settings/SettingsComponents';

const GeneralSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '🖥️' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' },
  ];

  return (
    <div className="general-settings">
      <SettingsSection
        title="Appearance"
        description="Customize how Smart Bookmarks looks and feels"
      >
        <SettingsCard>
          <SettingsButtonGroup
            label="Theme"
            description="Choose your preferred color scheme"
            options={themeOptions}
            value={settings.general.theme}
            onChange={(value) => updateSetting('general', 'theme', value as any)}
          />

          <SettingsSelect
            label="Language"
            description="Select your preferred language for the interface"
            value={settings.general.language}
            options={languageOptions}
            onChange={(value) => updateSetting('general', 'language', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Control when and how you receive notifications"
      >
        <SettingsCard>
          <SettingsToggle
            label="Show notifications"
            description="Display desktop notifications for important events"
            checked={settings.general.showNotifications}
            onChange={(checked) => updateSetting('general', 'showNotifications', checked)}
          />

          <SettingsToggle
            label="Sound effects"
            description="Play sound effects for timer and notification events"
            checked={settings.general.soundEnabled}
            onChange={(checked) => updateSetting('general', 'soundEnabled', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Quick Actions"
        description="Customize your experience for faster workflows"
      >
        <SettingsCard>
          <div className="settings-info-card">
            <h4>💡 Pro Tip</h4>
            <p>
              Use keyboard shortcuts to quickly access Smart Bookmarks:
            </p>
            <ul>
              <li><kbd>Alt+Shift+S</kbd> - Open Smart Bookmarks</li>
              <li><kbd>Alt+Shift+F</kbd> - Start focus timer</li>
              <li><kbd>Alt+Shift+B</kbd> - Quick bookmark current page</li>
            </ul>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Performance"
        description="Optimize Smart Bookmarks for your system"
      >
        <SettingsCard>
          <div className="settings-info-card">
            <h4>📊 Current Status</h4>
            <div className="performance-stats">
              <div className="stat-item">
                <span className="stat-label">Memory Usage:</span>
                <span className="stat-value">~12 MB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Background Tasks:</span>
                <span className="stat-value">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sync Status:</span>
                <span className="stat-value">Connected</span>
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .settings-info-card {
          padding: var(--settings-space-lg);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: var(--settings-radius);
          margin: var(--settings-space-md) 0;
        }

        .settings-info-card h4 {
          margin: 0 0 var(--settings-space-sm) 0;
          color: var(--settings-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .settings-info-card p {
          margin: 0 0 var(--settings-space-sm) 0;
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.5;
        }

        .settings-info-card ul {
          margin: 0;
          padding-left: var(--settings-space-lg);
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
        }

        .settings-info-card li {
          margin-bottom: var(--settings-space-xs);
        }

        kbd {
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: 3px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--settings-text-primary);
        }

        .performance-stats {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-xs);
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }

        .stat-label {
          color: var(--settings-text-secondary);
        }

        .stat-value {
          font-weight: 500;
          color: var(--settings-text-primary);
        }
      `}</style>
    </div>
  );
};

export default GeneralSettings;