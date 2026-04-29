import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsSlider,
  SettingsTextInput,
} from '@/components/Settings/SettingsComponents';

const BlockingSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const [newWebsite, setNewWebsite] = useState('');
  const [newScheduleName, setNewScheduleName] = useState('');

  const commonCategories = [
    { id: 'social-media', name: 'Social Media', sites: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com'] },
    { id: 'entertainment', name: 'Entertainment', sites: ['youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com', 'disney.com'] },
    { id: 'news', name: 'News & Media', sites: ['reddit.com', 'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com'] },
    { id: 'shopping', name: 'Shopping', sites: ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com'] },
    { id: 'gaming', name: 'Gaming', sites: ['steam.com', 'twitch.tv', 'ign.com', 'gamespot.com', 'polygon.com'] },
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const addWebsite = () => {
    if (newWebsite.trim() && !settings.blocking.websites.includes(newWebsite.trim())) {
      const updatedWebsites = [...settings.blocking.websites, newWebsite.trim()];
      updateSetting('blocking', 'websites', updatedWebsites);
      setNewWebsite('');
    }
  };

  const removeWebsite = (website: string) => {
    const updatedWebsites = settings.blocking.websites.filter(w => w !== website);
    updateSetting('blocking', 'websites', updatedWebsites);
  };

  const toggleCategory = (categoryId: string) => {
    const isEnabled = settings.blocking.categories.includes(categoryId);
    let updatedCategories;

    if (isEnabled) {
      updatedCategories = settings.blocking.categories.filter(c => c !== categoryId);
    } else {
      updatedCategories = [...settings.blocking.categories, categoryId];
    }

    updateSetting('blocking', 'categories', updatedCategories);
  };

  const addSchedule = () => {
    if (newScheduleName.trim()) {
      const newSchedule = {
        name: newScheduleName.trim(),
        days: [1, 2, 3, 4, 5], // Monday to Friday by default
        startTime: '09:00',
        endTime: '17:00',
        enabled: true,
      };

      const updatedSchedules = [...settings.blocking.schedules, newSchedule];
      updateSetting('blocking', 'schedules', updatedSchedules);
      setNewScheduleName('');
    }
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    const updatedSchedules = [...settings.blocking.schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    updateSetting('blocking', 'schedules', updatedSchedules);
  };

  const removeSchedule = (index: number) => {
    const updatedSchedules = settings.blocking.schedules.filter((_, i) => i !== index);
    updateSetting('blocking', 'schedules', updatedSchedules);
  };

  const toggleScheduleDay = (scheduleIndex: number, dayIndex: number) => {
    const schedule = settings.blocking.schedules[scheduleIndex];
    const updatedDays = schedule.days.includes(dayIndex)
      ? schedule.days.filter(d => d !== dayIndex)
      : [...schedule.days, dayIndex].sort();

    updateSchedule(scheduleIndex, 'days', updatedDays);
  };

  return (
    <div className="blocking-settings">
      <SettingsSection
        title="Website Blocking"
        description="Block distracting websites to maintain focus and productivity"
      >
        <SettingsCard>
          <SettingsToggle
            label="Enable website blocking"
            description="Activate the website blocking system"
            checked={settings.blocking.enabled}
            onChange={(checked) => updateSetting('blocking', 'enabled', checked)}
          />

          <SettingsToggle
            label="Strict mode"
            description="Make it harder to bypass blocks (requires extension restart)"
            checked={settings.blocking.strictMode}
            disabled={!settings.blocking.enabled}
            onChange={(checked) => updateSetting('blocking', 'strictMode', checked)}
          />

          <SettingsToggle
            label="Allow breakthrough"
            description="Permit temporary access to blocked sites with a delay"
            checked={settings.blocking.allowBreakthrough}
            disabled={!settings.blocking.enabled}
            onChange={(checked) => updateSetting('blocking', 'allowBreakthrough', checked)}
          />

          <SettingsSlider
            label="Daily breakthrough limit"
            description="Maximum number of breakthroughs allowed per day"
            value={settings.blocking.breakthroughLimit}
            min={0}
            max={10}
            step={1}
            unit="times"
            disabled={!settings.blocking.enabled || !settings.blocking.allowBreakthrough}
            onChange={(value) => updateSetting('blocking', 'breakthroughLimit', value)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Focus Integration"
        description="Coordinate website blocking with your focus timer sessions"
      >
        <SettingsCard>
          <SettingsToggle
            label="Block during focus sessions"
            description="Automatically block websites when the focus timer is running"
            checked={settings.blocking.blockDuringFocus}
            disabled={!settings.blocking.enabled}
            onChange={(checked) => updateSetting('blocking', 'blockDuringFocus', checked)}
          />

          <SettingsToggle
            label="Block during breaks"
            description="Keep blocks active during break periods (helps avoid getting distracted)"
            checked={settings.blocking.blockDuringBreaks}
            disabled={!settings.blocking.enabled}
            onChange={(checked) => updateSetting('blocking', 'blockDuringBreaks', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Website Categories"
        description="Quickly block common types of distracting websites"
      >
        <SettingsCard>
          <div className="category-grid">
            {commonCategories.map((category) => (
              <div key={category.id} className="category-item">
                <div className="category-header">
                  <label className="category-label">
                    <input
                      type="checkbox"
                      checked={settings.blocking.categories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      disabled={!settings.blocking.enabled}
                    />
                    <span className="category-name">{category.name}</span>
                  </label>
                </div>
                <div className="category-sites">
                  {category.sites.slice(0, 3).map(site => (
                    <span key={site} className="site-tag">{site}</span>
                  ))}
                  {category.sites.length > 3 && (
                    <span className="site-tag">+{category.sites.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Custom Websites"
        description="Add specific websites to block"
      >
        <SettingsCard>
          <div className="add-website">
            <SettingsTextInput
              label="Add website"
              description="Enter a domain to block (e.g., example.com)"
              value={newWebsite}
              placeholder="Enter website domain..."
              disabled={!settings.blocking.enabled}
              onChange={setNewWebsite}
            />
            <button
              className="add-button"
              onClick={addWebsite}
              disabled={!settings.blocking.enabled || !newWebsite.trim()}
            >
              Add
            </button>
          </div>

          <div className="website-list">
            {settings.blocking.websites.map((website) => (
              <div key={website} className="website-item">
                <span className="website-domain">{website}</span>
                <button
                  className="remove-button"
                  onClick={() => removeWebsite(website)}
                  disabled={!settings.blocking.enabled}
                  aria-label={`Remove ${website}`}
                >
                  ×
                </button>
              </div>
            ))}
            {settings.blocking.websites.length === 0 && (
              <div className="empty-state">
                No custom websites added yet. Add domains above to block them.
              </div>
            )}
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Blocking Schedules"
        description="Set up time-based blocking rules for different parts of your day"
      >
        <SettingsCard>
          <div className="add-schedule">
            <SettingsTextInput
              label="Create schedule"
              description="Name for this blocking schedule"
              value={newScheduleName}
              placeholder="e.g., Work Hours, Study Time..."
              disabled={!settings.blocking.enabled}
              onChange={setNewScheduleName}
            />
            <button
              className="add-button"
              onClick={addSchedule}
              disabled={!settings.blocking.enabled || !newScheduleName.trim()}
            >
              Create
            </button>
          </div>

          <div className="schedule-list">
            {settings.blocking.schedules.map((schedule, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(e) => updateSchedule(index, 'enabled', e.target.checked)}
                      disabled={!settings.blocking.enabled}
                    />
                    <span className="schedule-name">{schedule.name}</span>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeSchedule(index)}
                    disabled={!settings.blocking.enabled}
                    aria-label={`Remove ${schedule.name} schedule`}
                  >
                    ×
                  </button>
                </div>

                <div className="schedule-days">
                  {dayNames.map((day, dayIndex) => (
                    <button
                      key={dayIndex}
                      className={`day-button ${schedule.days.includes(dayIndex) ? 'day-button--active' : ''}`}
                      onClick={() => toggleScheduleDay(index, dayIndex)}
                      disabled={!settings.blocking.enabled || !schedule.enabled}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="schedule-time">
                  <div className="time-input">
                    <label>Start:</label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                      disabled={!settings.blocking.enabled || !schedule.enabled}
                    />
                  </div>
                  <div className="time-input">
                    <label>End:</label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                      disabled={!settings.blocking.enabled || !schedule.enabled}
                    />
                  </div>
                </div>
              </div>
            ))}

            {settings.blocking.schedules.length === 0 && (
              <div className="empty-state">
                No schedules created yet. Add a schedule above to block websites at specific times.
              </div>
            )}
          </div>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--settings-space-md);
          margin: var(--settings-space-md) 0;
        }

        .category-item {
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius-sm);
          padding: var(--settings-space-md);
          transition: var(--settings-transition);
        }

        .category-item:hover {
          border-color: var(--settings-primary);
        }

        .category-header {
          margin-bottom: var(--settings-space-sm);
        }

        .category-label {
          display: flex;
          align-items: center;
          gap: var(--settings-space-sm);
          cursor: pointer;
          font-weight: 500;
        }

        .category-label input[type="checkbox"] {
          margin: 0;
        }

        .category-sites {
          display: flex;
          flex-wrap: wrap;
          gap: var(--settings-space-xs);
        }

        .site-tag {
          font-size: 0.75rem;
          padding: 2px 6px;
          background: var(--settings-surface);
          border: 1px solid var(--settings-border);
          border-radius: 3px;
          color: var(--settings-text-secondary);
        }

        .add-website,
        .add-schedule {
          display: flex;
          gap: var(--settings-space-md);
          align-items: end;
          margin-bottom: var(--settings-space-lg);
        }

        .add-button {
          padding: var(--settings-space-xs) var(--settings-space-md);
          background: var(--settings-primary);
          color: white;
          border: none;
          border-radius: var(--settings-radius-sm);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: var(--settings-transition);
          flex-shrink: 0;
        }

        .add-button:hover:not(:disabled) {
          background: var(--settings-primary-hover);
        }

        .add-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .website-list,
        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-sm);
        }

        .website-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--settings-space-sm) var(--settings-space-md);
          background: var(--settings-surface);
          border-radius: var(--settings-radius-sm);
          border: 1px solid var(--settings-border);
        }

        .website-domain {
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--settings-text-primary);
        }

        .remove-button {
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: var(--settings-text-muted);
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          transition: var(--settings-transition);
        }

        .remove-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .remove-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .schedule-item {
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius);
          padding: var(--settings-space-lg);
          background: var(--settings-surface);
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--settings-space-md);
        }

        .schedule-title {
          display: flex;
          align-items: center;
          gap: var(--settings-space-sm);
        }

        .schedule-name {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .schedule-days {
          display: flex;
          gap: var(--settings-space-xs);
          margin-bottom: var(--settings-space-md);
        }

        .day-button {
          width: 36px;
          height: 36px;
          border: 1px solid var(--settings-border);
          background: var(--settings-bg);
          border-radius: var(--settings-radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--settings-transition);
        }

        .day-button:hover:not(:disabled) {
          border-color: var(--settings-primary);
        }

        .day-button--active {
          background: var(--settings-primary);
          color: white;
          border-color: var(--settings-primary);
        }

        .day-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .schedule-time {
          display: flex;
          gap: var(--settings-space-lg);
        }

        .time-input {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-xs);
        }

        .time-input label {
          font-size: 0.8125rem;
          color: var(--settings-text-secondary);
          font-weight: 500;
        }

        .time-input input[type="time"] {
          padding: var(--settings-space-xs) var(--settings-space-sm);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius-sm);
          background: var(--settings-bg);
          color: var(--settings-text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: var(--settings-transition);
        }

        .time-input input[type="time"]:focus {
          border-color: var(--settings-primary);
          box-shadow: 0 0 0 1px var(--settings-primary);
        }

        .empty-state {
          padding: var(--settings-space-xl);
          text-align: center;
          color: var(--settings-text-muted);
          font-size: 0.875rem;
          border: 2px dashed var(--settings-border);
          border-radius: var(--settings-radius);
        }
      `}</style>
    </div>
  );
};

export default BlockingSettings;