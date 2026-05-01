import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSlider,
  SettingsSelect,
} from '@/components/Settings/SettingsComponents';

const FocusSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const soundOptions = [
    { value: 'chime', label: 'Soft Chime' },
    { value: 'bell', label: 'Bell' },
    { value: 'notification', label: 'System Notification' },
    { value: 'none', label: 'Silent' },
  ];

  // Helper to format duration display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="focus-settings">
      <SettingsSection
        title="Timer Configuration"
        description="Customize your Pomodoro timer for optimal focus sessions"
      >
        <SettingsCard>
          <SettingsSlider
            label="Focus session duration"
            description="Length of each focused work session"
            value={settings.focus.defaultFocusDuration}
            min={5}
            max={120}
            step={5}
            unit="minutes"
            formatValue={formatDuration}
            onChange={(value) => updateSetting('focus', 'defaultFocusDuration', value)}
          />

          <SettingsSlider
            label="Short break duration"
            description="Length of regular breaks between focus sessions"
            value={settings.focus.defaultBreakDuration}
            min={2}
            max={30}
            step={1}
            unit="minutes"
            formatValue={formatDuration}
            onChange={(value) => updateSetting('focus', 'defaultBreakDuration', value)}
          />

          <SettingsSlider
            label="Long break duration"
            description="Extended break after completing multiple sessions"
            value={settings.focus.longBreakDuration}
            min={10}
            max={60}
            step={5}
            unit="minutes"
            formatValue={formatDuration}
            disabled={!settings.focus.longBreakEnabled}
            onChange={(value) => updateSetting('focus', 'longBreakDuration', value)}
          />

          <SettingsSlider
            label="Sessions until long break"
            description="Number of focus sessions before taking a long break"
            value={settings.focus.sessionsUntilLongBreak}
            min={2}
            max={8}
            step={1}
            unit="sessions"
            disabled={!settings.focus.longBreakEnabled}
            onChange={(value) => updateSetting('focus', 'sessionsUntilLongBreak', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Session Behavior"
        description="Control how timer sessions start, end, and transition"
      >
        <SettingsCard>
          <SettingsToggle
            label="Auto-start breaks"
            description="Automatically begin break timers when focus sessions end"
            checked={settings.focus.autoStartBreaks}
            onChange={(checked) => updateSetting('focus', 'autoStartBreaks', checked)}
          />

          <SettingsToggle
            label="Enable long breaks"
            description="Take longer breaks after completing several focus sessions"
            checked={settings.focus.longBreakEnabled}
            onChange={(checked) => updateSetting('focus', 'longBreakEnabled', checked)}
          />

          <SettingsToggle
            label="Strict mode"
            description="Prevent pausing or stopping timer sessions once started"
            checked={settings.focus.strictMode}
            onChange={(checked) => updateSetting('focus', 'strictMode', checked)}
          />

          <SettingsToggle
            label="Break reminders"
            description="Show notifications encouraging you to take breaks"
            checked={settings.focus.breakReminders}
            onChange={(checked) => updateSetting('focus', 'breakReminders', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Notifications & Sounds"
        description="Customize timer alerts and audio feedback"
      >
        <SettingsCard>
          <SettingsSelect
            label="Notification sound"
            description="Audio played when timers start, pause, or complete"
            value={settings.focus.notificationSound}
            options={soundOptions}
            onChange={(value) => updateSetting('focus', 'notificationSound', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Quick Presets"
        description="Common timer configurations for different work styles"
      >
        <SettingsCard>
          <div className="timer-presets">
            <div className="preset-grid">
              <button
                className="preset-button"
                onClick={() => {
                  updateSetting('focus', 'defaultFocusDuration', 25);
                  updateSetting('focus', 'defaultBreakDuration', 5);
                  updateSetting('focus', 'longBreakDuration', 15);
                  updateSetting('focus', 'sessionsUntilLongBreak', 4);
                }}
              >
                <div className="preset-title">🍅 Classic Pomodoro</div>
                <div className="preset-description">25min focus • 5min break • 15min long break</div>
              </button>

              <button
                className="preset-button"
                onClick={() => {
                  updateSetting('focus', 'defaultFocusDuration', 45);
                  updateSetting('focus', 'defaultBreakDuration', 10);
                  updateSetting('focus', 'longBreakDuration', 30);
                  updateSetting('focus', 'sessionsUntilLongBreak', 3);
                }}
              >
                <div className="preset-title">🧠 ADHD Friendly</div>
                <div className="preset-description">45min focus • 10min break • 30min long break</div>
              </button>

              <button
                className="preset-button"
                onClick={() => {
                  updateSetting('focus', 'defaultFocusDuration', 90);
                  updateSetting('focus', 'defaultBreakDuration', 15);
                  updateSetting('focus', 'longBreakDuration', 45);
                  updateSetting('focus', 'sessionsUntilLongBreak', 2);
                }}
              >
                <div className="preset-title">🎯 Deep Work</div>
                <div className="preset-description">90min focus • 15min break • 45min long break</div>
              </button>

              <button
                className="preset-button"
                onClick={() => {
                  updateSetting('focus', 'defaultFocusDuration', 15);
                  updateSetting('focus', 'defaultBreakDuration', 3);
                  updateSetting('focus', 'longBreakDuration', 10);
                  updateSetting('focus', 'sessionsUntilLongBreak', 6);
                }}
              >
                <div className="preset-title">⚡ Sprint Mode</div>
                <div className="preset-description">15min focus • 3min break • 10min long break</div>
              </button>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Current Configuration"
        description="Preview of your timer settings"
      >
        <SettingsCard className="settings-card--highlight">
          <div className="timer-preview">
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-icon">⏱️</span>
                <div className="stat-content">
                  <div className="stat-value">{formatDuration(settings.focus.defaultFocusDuration)}</div>
                  <div className="stat-label">Focus Time</div>
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-icon">☕</span>
                <div className="stat-content">
                  <div className="stat-value">{formatDuration(settings.focus.defaultBreakDuration)}</div>
                  <div className="stat-label">Break Time</div>
                </div>
              </div>

              {settings.focus.longBreakEnabled && (
                <div className="stat-item">
                  <span className="stat-icon">🌅</span>
                  <div className="stat-content">
                    <div className="stat-value">{formatDuration(settings.focus.longBreakDuration)}</div>
                    <div className="stat-label">Long Break</div>
                  </div>
                </div>
              )}

              <div className="stat-item">
                <span className="stat-icon">🔄</span>
                <div className="stat-content">
                  <div className="stat-value">{settings.focus.sessionsUntilLongBreak}</div>
                  <div className="stat-label">Sessions per Cycle</div>
                </div>
              </div>
            </div>

            <div className="preview-features">
              <div className="feature-tags">
                {settings.focus.autoStartBreaks && (
                  <span className="feature-tag">Auto-start breaks</span>
                )}
                {settings.focus.strictMode && (
                  <span className="feature-tag">Strict mode</span>
                )}
                {settings.focus.breakReminders && (
                  <span className="feature-tag">Break reminders</span>
                )}
                {settings.focus.notificationSound !== 'none' && (
                  <span className="feature-tag">Sound: {soundOptions.find(s => s.value === settings.focus.notificationSound)?.label}</span>
                )}
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .timer-presets {
          margin: var(--settings-space-md) 0;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--settings-space-md);
        }

        .preset-button {
          padding: var(--settings-space-lg);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius);
          background: var(--settings-bg);
          cursor: pointer;
          transition: var(--settings-transition);
          text-align: left;
        }

        .preset-button:hover {
          border-color: var(--settings-primary);
          background: var(--settings-surface);
          transform: translateY(-2px);
          box-shadow: var(--settings-shadow-md);
        }

        .preset-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
          margin-bottom: var(--settings-space-xs);
        }

        .preset-description {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }

        .timer-preview {
          margin: var(--settings-space-md) 0;
        }

        .preview-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--settings-space-lg);
          margin-bottom: var(--settings-space-lg);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--settings-space-sm);
        }

        .stat-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--settings-primary);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.2;
        }

        .preview-features {
          padding-top: var(--settings-space-lg);
          border-top: 1px solid var(--settings-border);
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--settings-space-xs);
        }

        .feature-tag {
          padding: var(--settings-space-xs) var(--settings-space-sm);
          background: var(--settings-primary-light);
          color: var(--settings-primary);
          border-radius: var(--settings-radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default FocusSettings;