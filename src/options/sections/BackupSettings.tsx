import React, { useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  BOOKMARKS_STORAGE_KEY,
  DAILY_STATS_STORAGE_KEY,
  FOCUS_SESSIONS_STORAGE_KEY,
  FOCUS_SESSION_SUMMARIES_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from '@/lib/storageKeys';
import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
} from '@/components/Settings/SettingsComponents';

interface LocalBackupPayload {
  app: 'smart-bookmarks';
  version: 1;
  createdAt: string;
  data: Record<string, unknown>;
}

const NOTE_STORAGE_KEY = 'notes';
const CALENDAR_STORAGE_KEY = 'calendarEvents';

const BackupSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing-up' | 'success' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateBackupSetting = (key: keyof typeof settings.backup, value: any) => {
    updateSetting('backup', key, value);
  };

  const getSelectedStorageKeys = () => {
    const keys: string[] = [];

    if (settings.backup.includeSettings) {
      keys.push(SETTINGS_STORAGE_KEY);
    }
    if (settings.backup.includeBookmarks) {
      keys.push(BOOKMARKS_STORAGE_KEY);
    }
    if (settings.backup.includeNotes) {
      keys.push(NOTE_STORAGE_KEY, CALENDAR_STORAGE_KEY);
    }
    if (settings.backup.includeFocusData) {
      keys.push(
        DAILY_STATS_STORAGE_KEY,
        FOCUS_SESSIONS_STORAGE_KEY,
        FOCUS_SESSION_SUMMARIES_STORAGE_KEY
      );
    }

    return keys;
  };

  const triggerBackup = async () => {
    setBackupStatus('backing-up');

    try {
      const data = await chrome.storage.local.get(getSelectedStorageKeys());
      const payload: LocalBackupPayload = {
        app: 'smart-bookmarks',
        version: 1,
        createdAt: new Date().toISOString(),
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-bookmarks-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      await updateBackupSetting('lastBackup', payload.createdAt);
      setBackupStatus('success');
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to export local backup:', error);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus('idle'), 3000);
    }
  };

  const triggerRestore = () => {
    fileInputRef.current?.click();
  };

  const restoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setRestoreStatus('restoring');

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as LocalBackupPayload;

      if (
        payload.app !== 'smart-bookmarks' ||
        payload.version !== 1 ||
        typeof payload.data !== 'object' ||
        payload.data === null
      ) {
        throw new Error('Invalid Smart Bookmarks backup file');
      }

      await chrome.storage.local.set(payload.data);
      setRestoreStatus('success');
      setTimeout(() => setRestoreStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to restore local backup:', error);
      setRestoreStatus('error');
      setTimeout(() => setRestoreStatus('idle'), 3000);
    } finally {
      event.target.value = '';
    }
  };

  const formatLastBackup = (lastBackup: string) => {
    if (!lastBackup) return 'Never';
    const date = new Date(lastBackup);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="backup-settings">
      <SettingsSection
        title="Local Backup"
        description="Export or restore a local JSON backup. Cloud sync is parked for this MVP."
      >
        <SettingsCard className="settings-card--highlight">
          <div className="backup-overview">
            <div className="backup-stat">
              <span className="backup-stat-label">Last backup</span>
              <strong>{formatLastBackup(settings.backup.lastBackup)}</strong>
            </div>
            <div className="backup-actions">
              <button
                className={`backup-button ${backupStatus === 'backing-up' ? 'backup-button--loading' : ''}`}
                onClick={triggerBackup}
                disabled={backupStatus === 'backing-up'}
              >
                {backupStatus === 'backing-up' && 'Exporting...'}
                {backupStatus === 'success' && 'Backup exported'}
                {backupStatus === 'error' && 'Export failed'}
                {backupStatus === 'idle' && 'Export JSON'}
              </button>

              <button
                className={`restore-button ${restoreStatus === 'restoring' ? 'restore-button--loading' : ''}`}
                onClick={triggerRestore}
                disabled={restoreStatus === 'restoring'}
              >
                {restoreStatus === 'restoring' && 'Restoring...'}
                {restoreStatus === 'success' && 'Restore complete'}
                {restoreStatus === 'error' && 'Restore failed'}
                {restoreStatus === 'idle' && 'Restore JSON'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={restoreFromFile}
              />
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Data Included"
        description="Choose what local data goes into the export file."
      >
        <SettingsCard>
          <SettingsToggle
            label="Settings and preferences"
            description="Include the current extension settings."
            checked={settings.backup.includeSettings}
            onChange={(checked) => updateBackupSetting('includeSettings', checked)}
          />

          <SettingsToggle
            label="Bookmarks and context"
            description="Include saved pages, notes, why-saved context, tags, and next actions."
            checked={settings.backup.includeBookmarks}
            onChange={(checked) => updateBackupSetting('includeBookmarks', checked)}
          />

          <SettingsToggle
            label="Notes"
            description="Include quick notes and calendar notes stored by the MVP."
            checked={settings.backup.includeNotes}
            onChange={(checked) => updateBackupSetting('includeNotes', checked)}
          />

          <SettingsToggle
            label="Focus history"
            description="Include focus sessions, completion summaries, and daily stats."
            checked={settings.backup.includeFocusData}
            onChange={(checked) => updateBackupSetting('includeFocusData', checked)}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Cloud Sync"
        description="Supabase sync, billing-aware plans, and team backup flows are outside this checkpoint."
      >
        <SettingsCard>
          <p className="backup-note">
            This screen intentionally avoids API keys, hosted storage providers,
            and background sync. The reviewable MVP boundary is a predictable
            local export and restore path.
          </p>
        </SettingsCard>
      </SettingsSection>

      <style>{`
        .backup-overview {
          display: flex;
          flex-direction: column;
          gap: var(--settings-space-lg);
        }

        .backup-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--settings-space-md);
        }

        .backup-stat-label,
        .backup-note {
          color: var(--settings-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .backup-note {
          margin: 0;
        }

        .backup-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--settings-space-md);
        }

        .backup-button,
        .restore-button {
          min-width: 132px;
          padding: var(--settings-space-sm) var(--settings-space-lg);
          border: 1px solid var(--settings-border);
          border-radius: var(--settings-radius-sm);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: var(--settings-transition);
        }

        .backup-button {
          background: var(--settings-primary);
          color: white;
          border-color: var(--settings-primary);
        }

        .restore-button {
          background: var(--settings-surface);
          color: var(--settings-text-primary);
        }

        .backup-button:hover:not(:disabled),
        .restore-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .backup-button:disabled,
        .restore-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default BackupSettings;
