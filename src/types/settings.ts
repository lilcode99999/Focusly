// Settings type definitions
export interface AppSettings {
  // General Settings
  general: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    showNotifications: boolean;
    soundEnabled: boolean;
  };

  // Focus & Timer Settings
  focus: {
    defaultFocusDuration: number; // minutes
    defaultBreakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    strictMode: boolean; // prevents pausing
    notificationSound: string;
    breakReminders: boolean;
    longBreakEnabled: boolean;
  };

  // AI & MCP Settings
  ai: {
    providers: {
      openai: {
        enabled: boolean;
        apiKey: string;
        model: string;
        endpoint: string;
      };
      anthropic: {
        enabled: boolean;
        apiKey: string;
        model: string;
        endpoint: string;
      };
      gemini: {
        enabled: boolean;
        apiKey: string;
        model: string;
        endpoint: string;
      };
      ollama: {
        enabled: boolean;
        endpoint: string;
        model: string;
      };
    };
    defaultProvider: string;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
    enableContextMemory: boolean;
    contextWindow: number;
  };

  // Website Blocking
  blocking: {
    enabled: boolean;
    strictMode: boolean;
    allowBreakthrough: boolean;
    breakthroughLimit: number;
    blockDuringFocus: boolean;
    blockDuringBreaks: boolean;
    websites: string[];
    categories: string[];
    schedules: Array<{
      name: string;
      days: number[];
      startTime: string;
      endTime: string;
      enabled: boolean;
    }>;
  };

  // Privacy Settings
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReports: boolean;
    shareUsageData: boolean;
    localDataOnly: boolean;
    encryptSensitiveData: boolean;
    autoDeleteHistory: boolean;
    historyRetentionDays: number;
    exportableData: boolean;
  };

  // Accessibility Settings
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    largeFonts: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    simplifiedUI: boolean;
    adhdFriendlyMode: boolean;
    focusIndicators: boolean;
    colorBlindSupport: boolean;
    readingMode: boolean;
    colorScheme?: string;
    readingStyle?: string;
  };

  // Backup & Sync Settings
  backup: {
    enableSync: boolean;
    syncProvider: string;
    autoBackup: boolean;
    backupFrequency: string;
    includeSettings: boolean;
    includeBookmarks: boolean;
    includeNotes: boolean;
    includeFocusData: boolean;
    cloudStorage: {
      provider: string;
      apiKey: string;
      endpoint: string;
    };
    lastBackup: string;
    nextBackup: string;
  };
}

export const defaultSettings: AppSettings = {
  general: {
    theme: 'system',
    language: 'en',
    showNotifications: true,
    soundEnabled: true,
  },
  focus: {
    defaultFocusDuration: 25,
    defaultBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    strictMode: false,
    notificationSound: 'chime',
    breakReminders: true,
    longBreakEnabled: true,
  },
  ai: {
    providers: {
      openai: {
        enabled: false,
        apiKey: '',
        model: '',
        endpoint: '',
      },
      anthropic: {
        enabled: false,
        apiKey: '',
        model: '',
        endpoint: '',
      },
      gemini: {
        enabled: false,
        apiKey: '',
        model: '',
        endpoint: '',
      },
      ollama: {
        enabled: false,
        endpoint: '',
        model: '',
      },
    },
    defaultProvider: '',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: 'You are a helpful AI assistant for Smart Bookmarks, designed to help users with ADHD and neurodivergent needs.',
    enableContextMemory: true,
    contextWindow: 10,
  },
  blocking: {
    enabled: false,
    strictMode: false,
    allowBreakthrough: true,
    breakthroughLimit: 3,
    blockDuringFocus: true,
    blockDuringBreaks: false,
    websites: [],
    categories: [],
    schedules: [],
  },
  privacy: {
    dataCollection: false,
    analytics: false,
    crashReports: false,
    shareUsageData: false,
    localDataOnly: true,
    encryptSensitiveData: true,
    autoDeleteHistory: false,
    historyRetentionDays: 90,
    exportableData: true,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeFonts: false,
    screenReader: false,
    keyboardNavigation: true,
    simplifiedUI: false,
    adhdFriendlyMode: false,
    focusIndicators: true,
    colorBlindSupport: false,
    readingMode: false,
    colorScheme: 'default',
    readingStyle: 'standard',
  },
  backup: {
    enableSync: false,
    syncProvider: 'local',
    autoBackup: false,
    backupFrequency: 'manual',
    includeSettings: true,
    includeBookmarks: true,
    includeNotes: true,
    includeFocusData: true,
    cloudStorage: {
      provider: '',
      apiKey: '',
      endpoint: '',
    },
    lastBackup: '',
    nextBackup: '',
  },
};
