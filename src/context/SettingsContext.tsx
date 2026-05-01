import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LEGACY_SETTINGS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/lib/storageKeys';
import { AppSettings, defaultSettings } from '@/types/settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => Promise<void>;
  updateSection: <K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => Promise<void>;
  resetSection: <K extends keyof AppSettings>(section: K) => Promise<void>;
  resetAllSettings: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (data: string) => Promise<boolean>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const loadSettings = async (): Promise<AppSettings> => {
  try {
    const result = await chrome.storage.local.get([SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEY]);
    const stored = result[SETTINGS_STORAGE_KEY] || result[LEGACY_SETTINGS_STORAGE_KEY];

    if (stored) {
      // Merge stored settings with defaults to handle new settings
      const merged = mergeSettings(defaultSettings, stored);
      await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: merged });
      return merged;
    }

    return defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

// Deep merge function to handle nested settings
const mergeSettings = (defaults: AppSettings, stored: any): AppSettings => {
  const merged = { ...defaults };

  for (const sectionKey in stored) {
    if (sectionKey in merged) {
      const section = sectionKey as keyof AppSettings;
      merged[section] = {
        ...merged[section],
        ...stored[sectionKey],
      };
    }
  }

  return merged;
};

// Validation function
const validateSettings = (settings: any): settings is AppSettings => {
  // Basic validation - ensure all required sections exist
  const requiredSections = ['general', 'focus', 'ai', 'blocking', 'privacy', 'accessibility', 'backup'];

  for (const section of requiredSections) {
    if (!(section in settings)) {
      return false;
    }
  }

  return true;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      setIsLoading(true);
      try {
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to initialize settings:', error);
        // Fall back to defaults
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  // Listen for settings changes from other extension contexts
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const settingsChange = changes[SETTINGS_STORAGE_KEY] || changes[LEGACY_SETTINGS_STORAGE_KEY];
      if (settingsChange) {
        const newSettings = settingsChange.newValue;
        if (newSettings && validateSettings(newSettings)) {
          setSettings(newSettings);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => {
    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value,
        },
      };

      await saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }, [settings]);

  const updateSection = useCallback(async <K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => {
    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          ...values,
        },
      };

      await saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update section:', error);
      throw error;
    }
  }, [settings]);

  const resetSection = useCallback(async <K extends keyof AppSettings>(section: K) => {
    try {
      const newSettings = {
        ...settings,
        [section]: defaultSettings[section],
      };

      await saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to reset section:', error);
      throw error;
    }
  }, [settings]);

  const resetAllSettings = useCallback(async () => {
    try {
      await saveSettings(defaultSettings);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset all settings:', error);
      throw error;
    }
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback(async (data: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(data);

      if (!validateSettings(parsed)) {
        throw new Error('Invalid settings format');
      }

      await saveSettings(parsed);
      setSettings(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    updateSection,
    resetSection,
    resetAllSettings,
    exportSettings,
    importSettings,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
