import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSelect,
} from '@/components/Settings/SettingsComponents';

const AccessibilitySettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const colorSchemeOptions = [
    { value: 'default', label: 'Default Colors' },
    { value: 'deuteranopia', label: 'Deuteranopia (Red-Green)' },
    { value: 'protanopia', label: 'Protanopia (Red-Green)' },
    { value: 'tritanopia', label: 'Tritanopia (Blue-Yellow)' },
    { value: 'monochrome', label: 'Monochrome (Grayscale)' },
  ];

  const readingModeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'dyslexia', label: 'Dyslexia-Friendly' },
    { value: 'adhd', label: 'ADHD-Optimized' },
    { value: 'minimal', label: 'Minimal Distractions' },
  ];

  // Calculate accessibility score
  const getAccessibilityScore = () => {
    const features = [
      settings.accessibility.reduceMotion,
      settings.accessibility.highContrast,
      settings.accessibility.largeFonts,
      settings.accessibility.screenReader,
      settings.accessibility.keyboardNavigation,
      settings.accessibility.simplifiedUI,
      settings.accessibility.adhdFriendlyMode,
      settings.accessibility.focusIndicators,
      settings.accessibility.colorBlindSupport,
      settings.accessibility.readingMode,
    ];

    const enabledCount = features.filter(Boolean).length;
    const percentage = Math.round((enabledCount / features.length) * 100);

    return { count: enabledCount, total: features.length, percentage };
  };

  const accessibilityScore = getAccessibilityScore();

  return (
    <div className="accessibility-settings">
      <SettingsSection
        title="Accessibility Overview"
        description="Make Smart Bookmarks work better for your specific needs"
      >
        <SettingsCard className="settings-card--highlight">
          <div className="accessibility-overview">
            <div className="accessibility-score">
              <div className="score-visual">
                <div className="score-circle">
                  <span className="score-percentage">{accessibilityScore.percentage}%</span>
                </div>
                <div className="score-info">
                  <div className="score-title">Accessibility Features</div>
                  <div className="score-description">
                    {accessibilityScore.count} of {accessibilityScore.total} features enabled
                  </div>
                </div>
              </div>
            </div>

            <div className="accessibility-mission">
              <h4>♿ Designed for Neurodivergent Minds</h4>
              <p>
                Smart Bookmarks is built specifically for people with ADHD, dyslexia, autism,
                and other neurodivergent conditions. These settings help you customize the
                experience to match your specific needs and preferences.
              </p>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Visual Accessibility"
        description="Adjust visual elements for better readability and comfort"
      >
        <SettingsCard>
          <SettingsToggle
            label="High contrast mode"
            description="Increase contrast between text and backgrounds for better readability"
            checked={settings.accessibility.highContrast}
            onChange={(checked) => updateSetting('accessibility', 'highContrast', checked)}
          />

          <SettingsToggle
            label="Large fonts"
            description="Use larger text sizes throughout the interface"
            checked={settings.accessibility.largeFonts}
            onChange={(checked) => updateSetting('accessibility', 'largeFonts', checked)}
          />

          <SettingsToggle
            label="Reduce motion"
            description="Minimize animations and transitions that might be distracting"
            checked={settings.accessibility.reduceMotion}
            onChange={(checked) => updateSetting('accessibility', 'reduceMotion', checked)}
          />

          <SettingsToggle
            label="Enhanced focus indicators"
            description="Make keyboard navigation more visible with stronger focus outlines"
            checked={settings.accessibility.focusIndicators}
            onChange={(checked) => updateSetting('accessibility', 'focusIndicators', checked)}
          />

          <SettingsToggle
            label="Color blind support"
            description="Adjust colors and add patterns for color accessibility"
            checked={settings.accessibility.colorBlindSupport}
            onChange={(checked) => updateSetting('accessibility', 'colorBlindSupport', checked)}
          />

          <SettingsSelect
            label="Color scheme adaptation"
            description="Optimize colors for specific types of color vision differences"
            value={settings.accessibility.colorScheme || 'default'}
            options={colorSchemeOptions}
            disabled={!settings.accessibility.colorBlindSupport}
            onChange={(value) => updateSetting('accessibility', 'colorScheme', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Neurodivergent Support"
        description="Features specifically designed for ADHD, autism, and other neurodivergent conditions"
      >
        <SettingsCard>
          <SettingsToggle
            label="ADHD-friendly mode"
            description="Optimize the interface for ADHD minds: reduced clutter, clearer priorities, gentle nudges"
            checked={settings.accessibility.adhdFriendlyMode}
            onChange={(checked) => updateSetting('accessibility', 'adhdFriendlyMode', checked)}
          />

          <SettingsToggle
            label="Simplified interface"
            description="Hide advanced features and reduce visual complexity"
            checked={settings.accessibility.simplifiedUI}
            onChange={(checked) => updateSetting('accessibility', 'simplifiedUI', checked)}
          />

          <SettingsToggle
            label="Reading mode optimization"
            description="Enhance text presentation for better reading comprehension"
            checked={settings.accessibility.readingMode}
            onChange={(checked) => updateSetting('accessibility', 'readingMode', checked)}
          />

          <SettingsSelect
            label="Reading style"
            description="Choose text formatting optimized for your reading needs"
            value={settings.accessibility.readingStyle || 'standard'}
            options={readingModeOptions}
            disabled={!settings.accessibility.readingMode}
            onChange={(value) => updateSetting('accessibility', 'readingStyle', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Navigation & Interaction"
        description="Customize how you interact with Smart Bookmarks"
      >
        <SettingsCard>
          <SettingsToggle
            label="Enhanced keyboard navigation"
            description="Improve keyboard-only navigation with better shortcuts and tab order"
            checked={settings.accessibility.keyboardNavigation}
            onChange={(checked) => updateSetting('accessibility', 'keyboardNavigation', checked)}
          />

          <SettingsToggle
            label="Screen reader optimization"
            description="Enhance compatibility with screen readers and assistive technologies"
            checked={settings.accessibility.screenReader}
            onChange={(checked) => updateSetting('accessibility', 'screenReader', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Sensory Considerations"
        description="Reduce sensory overload and create a calmer experience"
      >
        <SettingsCard>
          <div className="sensory-features">
            <div className="feature-group">
              <h4>🔇 Audio & Sound</h4>
              <ul>
                <li>Option to disable all notification sounds</li>
                <li>Visual alternatives to audio cues</li>
                <li>Gentle sound options for timers</li>
              </ul>
            </div>

            <div className="feature-group">
              <h4>👁️ Visual Calm</h4>
              <ul>
                <li>Reduced bright colors and harsh contrasts</li>
                <li>Minimal use of attention-grabbing elements</li>
                <li>Optional dark mode for reduced eye strain</li>
              </ul>
            </div>

            <div className="feature-group">
              <h4>🧠 Cognitive Load</h4>
              <ul>
                <li>Simplified decision points</li>
                <li>Clear, predictable interface patterns</li>
                <li>Progressive disclosure of complex features</li>
              </ul>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="ADHD-Specific Features"
        description="Tools designed specifically for ADHD productivity patterns"
      >
        <SettingsCard>
          <div className="adhd-features">
            <div className="adhd-feature">
              <div className="feature-icon">⏰</div>
              <div className="feature-content">
                <h4>Time Awareness</h4>
                <p>Visual time indicators, gentle reminders, and break prompts to help with time blindness</p>
              </div>
              <div className="feature-status">
                {settings.accessibility.adhdFriendlyMode ? '✅ Active' : '⚪ Available'}
              </div>
            </div>

            <div className="adhd-feature">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h4>Hyperfocus Management</h4>
                <p>Smart break reminders and session limits to prevent hyperfocus burnout</p>
              </div>
              <div className="feature-status">
                {settings.accessibility.adhdFriendlyMode ? '✅ Active' : '⚪ Available'}
              </div>
            </div>

            <div className="adhd-feature">
              <div className="feature-icon">🧩</div>
              <div className="feature-content">
                <h4>Executive Function Support</h4>
                <p>Clear next steps, reduced decision fatigue, and structured workflows</p>
              </div>
              <div className="feature-status">
                {settings.accessibility.adhdFriendlyMode ? '✅ Active' : '⚪ Available'}
              </div>
            </div>

            <div className="adhd-feature">
              <div className="feature-icon">🌟</div>
              <div className="feature-content">
                <h4>Positive Reinforcement</h4>
                <p>Celebration of achievements, progress tracking, and gentle encouragement</p>
              </div>
              <div className="feature-status">
                {settings.accessibility.adhdFriendlyMode ? '✅ Active' : '⚪ Available'}
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Accessibility Resources"
        description="Learn more about accessibility features and get help"
      >
        <SettingsCard>
          <div className="accessibility-resources">
            <div className="resource-item">
              <span className="resource-icon">📚</span>
              <div className="resource-content">
                <h4>Accessibility Guide</h4>
                <p>Learn how to make the most of Smart Bookmarks' accessibility features</p>
                <button className="resource-button">Open Guide</button>
              </div>
            </div>

            <div className="resource-item">
              <span className="resource-icon">⌨️</span>
              <div className="resource-content">
                <h4>Keyboard Shortcuts</h4>
                <p>Complete list of keyboard shortcuts for navigation and productivity</p>
                <button className="resource-button">View Shortcuts</button>
              </div>
            </div>

            <div className="resource-item">
              <span className="resource-icon">🤝</span>
              <div className="resource-content">
                <h4>Accessibility Feedback</h4>
                <p>Help us improve by sharing your accessibility needs and suggestions</p>
                <button className="resource-button">Give Feedback</button>
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .accessibility-overview {
          margin: var(--settings-space-md) 0;
        }

        .accessibility-score {
          margin-bottom: var(--settings-space-lg);
        }

        .score-visual {
          display: flex;
          align-items: center;
          gap: var(--settings-space-lg);
          padding: var(--settings-space-lg);
          background: var(--settings-surface);
          border-radius: var(--settings-radius);
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: conic-gradient(var(--settings-primary) ${accessibilityScore.percentage}%, var(--settings-border) 0%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        .score-circle::before {
          content: '';
          position: absolute;
          width: 60px;
          height: 60px;
          background: var(--settings-surface);
          border-radius: 50%;
        }

        .score-percentage {
          position: relative;
          z-index: 1;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--settings-primary);
        }

        .score-info {
          flex: 1;
        }

        .score-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--settings-text-primary);
          margin-bottom: var(--settings-space-xs);
        }

        .score-description {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
        }

        .accessibility-mission {
          padding: var(--settings-space-lg);
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border: 1px solid rgba(168, 85, 247, 0.1);
          border-radius: var(--settings-radius);
        }

        .accessibility-mission h4 {
          margin: 0 0 var(--settings-space-sm) 0;
          color: #a855f7;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .accessibility-mission p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.5;
        }

        .sensory-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--settings-space-lg);
        }

        .feature-group h4 {
          margin: 0 0 var(--settings-space-sm) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
        }

        .feature-group ul {
          margin: 0;
          padding-left: var(--settings-space-lg);
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
        }

        .feature-group li {
          margin-bottom: var(--settings-space-xs);
          line-height: 1.4;
        }

        .adhd-features {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-md);
        }

        .adhd-feature {
          display: flex;
          align-items: center;
          gap: var(--settings-space-md);
          padding: var(--settings-space-md);
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius-sm);
        }

        .feature-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .feature-content {
          flex: 1;
        }

        .feature-content h4 {
          margin: 0 0 var(--settings-space-xs) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
        }

        .feature-content p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }

        .feature-status {
          font-size: 0.75rem;
          font-weight: 500;
          padding: var(--settings-space-xs) var(--settings-space-sm);
          border-radius: var(--settings-radius-sm);
          background: var(--settings-surface);
          color: var(--settings-text-secondary);
          flex-shrink: 0;
        }

        .accessibility-resources {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-md);
        }

        .resource-item {
          display: flex;
          align-items: center;
          gap: var(--settings-space-md);
          padding: var(--settings-space-lg);
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius);
        }

        .resource-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .resource-content {
          flex: 1;
        }

        .resource-content h4 {
          margin: 0 0 var(--settings-space-xs) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--settings-text-primary);
        }

        .resource-content p {
          margin: 0 0 var(--settings-space-sm) 0;
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          line-height: 1.4;
        }

        .resource-button {
          padding: var(--settings-space-xs) var(--settings-space-md);
          background: var(--settings-primary);
          color: white;
          border: none;
          border-radius: var(--settings-radius-sm);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--settings-transition);
        }

        .resource-button:hover {
          background: var(--settings-primary-hover);
        }
      `}</style>
    </div>
  );
};

export default AccessibilitySettings;