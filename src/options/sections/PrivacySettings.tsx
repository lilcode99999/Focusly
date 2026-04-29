import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSlider,
} from '@/components/Settings/SettingsComponents';

const PrivacySettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const formatRetentionDays = (days: number) => {
    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'}`;
    } else if (days === 30) {
      return '1 month';
    } else if (days === 90) {
      return '3 months';
    } else if (days === 180) {
      return '6 months';
    } else if (days === 365) {
      return '1 year';
    } else {
      return `${Math.round(days / 30)} months`;
    }
  };

  const getPrivacyLevel = () => {
    const privacyFeatures = [
      !settings.privacy.dataCollection,
      !settings.privacy.analytics,
      !settings.privacy.crashReports,
      !settings.privacy.shareUsageData,
      settings.privacy.localDataOnly,
      settings.privacy.encryptSensitiveData,
    ];

    const enabledCount = privacyFeatures.filter(Boolean).length;
    const percentage = Math.round((enabledCount / privacyFeatures.length) * 100);

    if (percentage >= 80) return { level: 'High', color: 'var(--settings-success)', icon: '🔒' };
    if (percentage >= 50) return { level: 'Medium', color: 'var(--settings-warning)', icon: '🔐' };
    return { level: 'Low', color: 'var(--settings-error)', icon: '🔓' };
  };

  const privacyLevel = getPrivacyLevel();

  return (
    <div className="privacy-settings">
      <SettingsSection
        title="Privacy Overview"
        description="Your current privacy configuration and data handling practices"
      >
        <SettingsCard className="settings-card--highlight">
          <div className="privacy-overview">
            <div className="privacy-level">
              <span className="privacy-icon" style={{ color: privacyLevel.color }}>
                {privacyLevel.icon}
              </span>
              <div className="privacy-info">
                <div className="privacy-status" style={{ color: privacyLevel.color }}>
                  {privacyLevel.level} Privacy
                </div>
                <div className="privacy-description">
                  Your data is {privacyLevel.level.toLowerCase()} protected based on current settings
                </div>
              </div>
            </div>

            <div className="privacy-principles">
              <h4>🛡️ Our Privacy Promise</h4>
              <ul>
                <li><strong>Data Minimization:</strong> We collect only what's necessary for functionality</li>
                <li><strong>Local First:</strong> Most data stays on your device when possible</li>
                <li><strong>Transparent Control:</strong> You decide what data to share and when</li>
                <li><strong>ADHD Focused:</strong> Built for neurodivergent privacy needs</li>
              </ul>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Data Collection"
        description="Control what data Smart Bookmarks collects and processes"
      >
        <SettingsCard>
          <SettingsToggle
            label="Enable data collection"
            description="Allow Smart Bookmarks to collect anonymized usage data for improving the extension"
            checked={settings.privacy.dataCollection}
            onChange={(checked) => updateSetting('privacy', 'dataCollection', checked)}
          />

          <SettingsToggle
            label="Analytics and insights"
            description="Share anonymized productivity patterns to help improve ADHD-focused features"
            checked={settings.privacy.analytics}
            disabled={!settings.privacy.dataCollection}
            onChange={(checked) => updateSetting('privacy', 'analytics', checked)}
          />

          <SettingsToggle
            label="Crash reports"
            description="Automatically send crash reports to help fix bugs and improve stability"
            checked={settings.privacy.crashReports}
            disabled={!settings.privacy.dataCollection}
            onChange={(checked) => updateSetting('privacy', 'crashReports', checked)}
          />

          <SettingsToggle
            label="Share usage statistics"
            description="Help improve Smart Bookmarks by sharing how you use different features"
            checked={settings.privacy.shareUsageData}
            disabled={!settings.privacy.dataCollection}
            onChange={(checked) => updateSetting('privacy', 'shareUsageData', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Data Storage & Security"
        description="Configure how your data is stored and protected"
      >
        <SettingsCard>
          <SettingsToggle
            label="Local data only"
            description="Keep all data on your device - no cloud synchronization"
            checked={settings.privacy.localDataOnly}
            onChange={(checked) => updateSetting('privacy', 'localDataOnly', checked)}
          />

          <SettingsToggle
            label="Encrypt sensitive data"
            description="Use encryption for bookmarks, notes, and AI conversation history"
            checked={settings.privacy.encryptSensitiveData}
            onChange={(checked) => updateSetting('privacy', 'encryptSensitiveData', checked)}
          />

          <SettingsToggle
            label="Auto-delete history"
            description="Automatically remove old data after a specified time period"
            checked={settings.privacy.autoDeleteHistory}
            onChange={(checked) => updateSetting('privacy', 'autoDeleteHistory', checked)}
          />

          <SettingsSlider
            label="Data retention period"
            description="How long to keep your browsing and productivity history"
            value={settings.privacy.historyRetentionDays}
            min={7}
            max={365}
            step={7}
            unit="days"
            formatValue={formatRetentionDays}
            disabled={!settings.privacy.autoDeleteHistory}
            onChange={(value) => updateSetting('privacy', 'historyRetentionDays', value)}
          />

          <SettingsToggle
            label="Enable data export"
            description="Allow exporting your data in standard formats (JSON, CSV)"
            checked={settings.privacy.exportableData}
            onChange={(checked) => updateSetting('privacy', 'exportableData', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Data Categories"
        description="Understand what types of data Smart Bookmarks handles"
      >
        <SettingsCard>
          <div className="data-categories">
            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">🔖</span>
                <div className="category-info">
                  <h4>Bookmarks & Notes</h4>
                  <p>URLs, titles, tags, personal notes, and AI-generated summaries</p>
                </div>
              </div>
              <div className="category-status">
                {settings.privacy.encryptSensitiveData ? (
                  <span className="status-encrypted">🔒 Encrypted</span>
                ) : (
                  <span className="status-unencrypted">🔓 Unencrypted</span>
                )}
              </div>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">⏱️</span>
                <div className="category-info">
                  <h4>Focus & Productivity</h4>
                  <p>Timer sessions, focus scores, productivity patterns, and breaks</p>
                </div>
              </div>
              <div className="category-status">
                {settings.privacy.localDataOnly ? (
                  <span className="status-local">📱 Local Only</span>
                ) : (
                  <span className="status-synced">☁️ May Sync</span>
                )}
              </div>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">🤖</span>
                <div className="category-info">
                  <h4>AI Conversations</h4>
                  <p>Chat history, context memory, and AI provider usage statistics</p>
                </div>
              </div>
              <div className="category-status">
                {settings.privacy.encryptSensitiveData ? (
                  <span className="status-encrypted">🔒 Encrypted</span>
                ) : (
                  <span className="status-unencrypted">🔓 Unencrypted</span>
                )}
              </div>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">🚫</span>
                <div className="category-info">
                  <h4>Website Blocking</h4>
                  <p>Blocked sites, schedules, and breakthrough attempts</p>
                </div>
              </div>
              <div className="category-status">
                <span className="status-local">📱 Always Local</span>
              </div>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">⚙️</span>
                <div className="category-info">
                  <h4>Settings & Preferences</h4>
                  <p>App configuration, accessibility settings, and customizations</p>
                </div>
              </div>
              <div className="category-status">
                {settings.privacy.localDataOnly ? (
                  <span className="status-local">📱 Local Only</span>
                ) : (
                  <span className="status-synced">☁️ May Sync</span>
                )}
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Privacy Actions"
        description="Take control of your data with these privacy tools"
      >
        <SettingsCard>
          <div className="privacy-actions">
            <button className="privacy-action-button" disabled={!settings.privacy.exportableData}>
              <span className="action-icon">📦</span>
              <div className="action-info">
                <div className="action-title">Export My Data</div>
                <div className="action-description">Download all your data in JSON format</div>
              </div>
            </button>

            <button className="privacy-action-button privacy-action-button--warning">
              <span className="action-icon">🗑️</span>
              <div className="action-info">
                <div className="action-title">Clear All Data</div>
                <div className="action-description">Permanently delete all stored data (cannot be undone)</div>
              </div>
            </button>

            <button className="privacy-action-button">
              <span className="action-icon">📊</span>
              <div className="action-info">
                <div className="action-title">View Data Report</div>
                <div className="action-description">See exactly what data is stored and where</div>
              </div>
            </button>

            <button className="privacy-action-button">
              <span className="action-icon">🔄</span>
              <div className="action-info">
                <div className="action-title">Reset Privacy Settings</div>
                <div className="action-description">Return all privacy settings to default values</div>
              </div>
            </button>
          </div>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .privacy-overview {
          margin: var(--settings-space-md) 0;
        }

        .privacy-level {
          display: flex;
          align-items: center;
          gap: var(--settings-space-md);
          margin-bottom: var(--settings-space-lg);
          padding: var(--settings-space-lg);
          background: var(--settings-surface);
          border-radius: var(--settings-radius);
        }

        .privacy-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .privacy-info {
          flex: 1;
        }

        .privacy-status {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.2;
        }

        .privacy-description {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }

        .privacy-principles {
          padding: var(--settings-space-lg);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.1);
          border-radius: var(--settings-radius);
        }

        .privacy-principles h4 {
          margin: 0 0 var(--settings-space-sm) 0;
          color: var(--settings-success);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .privacy-principles ul {
          margin: 0;
          padding-left: var(--settings-space-lg);
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
        }

        .privacy-principles li {
          margin-bottom: var(--settings-space-xs);
        }

        .data-categories {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-md);
        }

        .data-category {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--settings-space-md);
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius-sm);
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: var(--settings-space-md);
          flex: 1;
        }

        .category-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .category-info h4 {
          margin: 0 0 var(--settings-space-xs) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
        }

        .category-info p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }

        .category-status {
          flex-shrink: 0;
        }

        .status-encrypted,
        .status-unencrypted,
        .status-local,
        .status-synced {
          font-size: 0.75rem;
          font-weight: 500;
          padding: var(--settings-space-xs) var(--settings-space-sm);
          border-radius: var(--settings-radius-sm);
        }

        .status-encrypted,
        .status-local {
          background: rgba(16, 185, 129, 0.1);
          color: var(--settings-success);
        }

        .status-unencrypted {
          background: rgba(239, 68, 68, 0.1);
          color: var(--settings-error);
        }

        .status-synced {
          background: rgba(59, 130, 246, 0.1);
          color: var(--settings-primary);
        }

        .privacy-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--settings-space-md);
        }

        .privacy-action-button {
          display: flex;
          align-items: center;
          gap: var(--settings-space-md);
          padding: var(--settings-space-lg);
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius);
          cursor: pointer;
          transition: var(--settings-transition);
          text-align: left;
          width: 100%;
        }

        .privacy-action-button:hover:not(:disabled) {
          border-color: var(--settings-primary);
          background: var(--settings-surface-hover);
          transform: translateY(-2px);
          box-shadow: var(--settings-shadow-md);
        }

        .privacy-action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .privacy-action-button--warning:hover:not(:disabled) {
          border-color: var(--settings-error);
          background: rgba(239, 68, 68, 0.05);
        }

        .action-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .action-info {
          flex: 1;
        }

        .action-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
          margin-bottom: var(--settings-space-xs);
        }

        .action-description {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default PrivacySettings;