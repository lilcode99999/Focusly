import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSlider,
} from '@/components/Settings/SettingsComponents';

const AISettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="ai-settings">
      <SettingsSection
        title="AI Workflows"
        description="The MVP keeps context recovery local-first while cloud AI routing is parked."
      >
        <SettingsCard className="settings-card--highlight">
          <div className="parked-workflows">
            <div className="parked-status">
              <span className="parked-status-label">Current mode</span>
              <strong>Local heuristics only</strong>
            </div>
            <p>
              Smart Bookmarks can still save why a page mattered, search that
              context, and start focus sessions without contacting MCP, Gemini,
              Supabase, Stripe, or any hosted AI provider.
            </p>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Local Context"
        description="Tune the lightweight, on-device context helpers used by the popup."
      >
        <SettingsCard>
          <SettingsToggle
            label="Context memory"
            description="Use locally stored patterns to suggest return-to-context cards."
            checked={settings.ai.enableContextMemory}
            onChange={(checked) => updateSetting('ai', 'enableContextMemory', checked)}
          />

          <SettingsSlider
            label="Context window"
            description="How many recent local items to consider when building suggestions."
            value={settings.ai.contextWindow}
            min={3}
            max={20}
            step={1}
            unit="items"
            onChange={(value) => updateSetting('ai', 'contextWindow', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Later"
        description="Cloud AI can be adapterized after the local-first workflow earns its keep."
      >
        <SettingsCard>
          <ul className="parked-list">
            <li>MCP routing is disabled by default.</li>
            <li>Provider API keys are not requested in the MVP UI.</li>
            <li>No network connection is required at startup.</li>
          </ul>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .parked-workflows {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-md);
        }

        .parked-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--settings-space-md);
        }

        .parked-status-label {
          color: var(--settings-text-secondary);
          font-size: 0.8125rem;
        }

        .parked-workflows p,
        .parked-list {
          margin: 0;
          color: var(--settings-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .parked-list {
          padding-left: var(--settings-space-lg);
        }
      `}</style>
    </div>
  );
};

export default AISettings;
