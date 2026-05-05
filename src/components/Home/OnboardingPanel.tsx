import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY } from '@/lib/storageKeys';
import {
  OnboardingState,
  dismissOnboarding,
  getOnboardingState,
  restoreOnboarding,
} from '@/services/localOnboarding';
import './OnboardingPanel.css';

type OnboardingDestination = 'focus' | 'library' | 'insights';

interface OnboardingPanelProps {
  onSaveCurrentTab: () => void;
  onNavigate: (destination: OnboardingDestination) => void;
}

const checklist: {
  key: keyof Omit<OnboardingState, 'dismissed' | 'completed'>;
  label: string;
}[] = [
  {
    key: 'savedFirstContext',
    label: 'Save a page with why it matters and one next action.',
  },
  {
    key: 'searchedLibrary',
    label: 'Open Library and search for that next action.',
  },
  {
    key: 'startedFocus',
    label: 'Start focus from the saved context.',
  },
  {
    key: 'completedFocus',
    label: 'Finish one focus session.',
  },
  {
    key: 'viewedInsights',
    label: 'Check your local progress in Insights.',
  },
];

const getPrimaryAction = (state: OnboardingState) => {
  if (!state.savedFirstContext) {
    return {
      label: 'Save current tab',
      destination: 'save' as const,
    };
  }

  if (!state.searchedLibrary || !state.startedFocus) {
    return {
      label: 'Open Library',
      destination: 'library' as const,
    };
  }

  if (!state.completedFocus) {
    return {
      label: 'Open Focus',
      destination: 'focus' as const,
    };
  }

  return {
    label: 'View Insights',
    destination: 'insights' as const,
  };
};

const OnboardingPanel: React.FC<OnboardingPanelProps> = ({
  onSaveCurrentTab,
  onNavigate,
}) => {
  const [state, setState] = useState<OnboardingState | null>(null);

  const loadState = useCallback(async () => {
    setState(await getOnboardingState());
  }, []);

  useEffect(() => {
    loadState();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY];
      if (change?.newValue) {
        setState(change.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadState]);

  const progress = useMemo(() => {
    if (!state) {
      return 0;
    }

    return checklist.filter((item) => state[item.key]).length;
  }, [state]);

  const handleDismiss = async () => {
    setState(await dismissOnboarding());
  };

  const handleRestore = async () => {
    setState(await restoreOnboarding());
  };

  if (!state) {
    return null;
  }

  const primaryAction = getPrimaryAction(state);
  const copy = state.completed
    ? 'You completed the loop once. Keep this nearby when you want to rehearse it again.'
    : 'Save the reason, find it again, then start with the next action already waiting.';

  if (state.dismissed) {
    return (
      <section className="onboarding-panel onboarding-panel-collapsed">
        <div className="onboarding-header">
          <div>
            <p className="onboarding-kicker">
              {state.completed ? 'Loop complete' : 'Checklist hidden'}
            </p>
            <h3>Recovery loop</h3>
          </div>
          <span className="onboarding-progress">{progress}/{checklist.length}</span>
        </div>
        <div className="onboarding-collapsed-row">
          <p className="onboarding-copy">
            {state.completed
              ? 'Your first context recovery loop is complete.'
              : 'The checklist is tucked away. You can bring it back anytime.'}
          </p>
          <button type="button" className="onboarding-restore" onClick={handleRestore}>
            Show checklist
          </button>
        </div>
      </section>
    );
  }

  const handlePrimaryAction = () => {
    if (primaryAction.destination === 'save') {
      onSaveCurrentTab();
      return;
    }

    onNavigate(primaryAction.destination);
  };

  return (
    <section className={`onboarding-panel ${state.completed ? 'complete' : ''}`}>
      <div className="onboarding-header">
        <div>
          <p className="onboarding-kicker">
            {state.completed ? 'First loop complete' : 'Local first run'}
          </p>
          <h3>Recover this context later</h3>
        </div>
        <span className="onboarding-progress">{progress}/{checklist.length}</span>
      </div>

      <p className="onboarding-copy">
        {copy}
      </p>

      <ol className="onboarding-checklist">
        {checklist.map((item) => (
          <li key={item.key} className={state[item.key] ? 'done' : ''}>
            <span className="onboarding-check" aria-hidden="true">
              {state[item.key] ? <AppIcon name="check" size={12} /> : null}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>

      <div className="onboarding-actions">
        <button type="button" className="onboarding-primary" onClick={handlePrimaryAction}>
          {primaryAction.label}
        </button>
        <button type="button" className="onboarding-dismiss" onClick={handleDismiss}>
          {state.completed ? 'Done for now' : 'Hide for now'}
        </button>
      </div>
    </section>
  );
};

export default OnboardingPanel;
