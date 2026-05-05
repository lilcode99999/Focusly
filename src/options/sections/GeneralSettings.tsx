import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSelect,
  SettingsButtonGroup,
} from '@/components/Settings/SettingsComponents';
import AppIcon from '@/components/common/AppIcon';

const themeOptions = [
  { value: 'light', label: 'Light', icon: <AppIcon name="sun" size={15} /> },
  { value: 'dark', label: 'Dark', icon: <AppIcon name="moon" size={15} /> },
  { value: 'system', label: 'System', icon: <AppIcon name="settings" size={15} /> },
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

const GeneralSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

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
            onChange={(value) => updateSetting('general', 'theme', value as 'light' | 'dark' | 'system')}
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
            <h4 className="settings-info-card-title">
              <AppIcon name="lightbulb" size={16} />
              Shortcuts
            </h4>
            <p>
              Use Chrome command shortcuts to reach the extension quickly after install.
            </p>
            <ul className="settings-shortcut-list">
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
            <h4 className="settings-info-card-title">
              <AppIcon name="bar-chart" size={16} />
              Package Status
            </h4>
            <div className="performance-stats">
              <div className="stat-item">
                <span className="stat-label">Storage:</span>
                <span className="stat-value">~12 MB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Background:</span>
                <span className="stat-value">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sync:</span>
                <span className="stat-value">Local only</span>
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
};

export default GeneralSettings;
