import { SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY } from '@/lib/storageKeys';

export type OnboardingStep =
  | 'savedFirstContext'
  | 'searchedLibrary'
  | 'startedFocus'
  | 'completedFocus'
  | 'viewedInsights';

export interface OnboardingChecklistState {
  savedFirstContext: boolean;
  searchedLibrary: boolean;
  startedFocus: boolean;
  completedFocus: boolean;
  viewedInsights: boolean;
}

export interface OnboardingState extends OnboardingChecklistState {
  dismissed: boolean;
  completed: boolean;
}

export const onboardingSteps: OnboardingStep[] = [
  'savedFirstContext',
  'searchedLibrary',
  'startedFocus',
  'completedFocus',
  'viewedInsights',
];

export const defaultOnboardingState: OnboardingState = {
  savedFirstContext: false,
  searchedLibrary: false,
  startedFocus: false,
  completedFocus: false,
  viewedInsights: false,
  dismissed: false,
  completed: false,
};

const isOnboardingComplete = (state: OnboardingChecklistState) => (
  onboardingSteps.every((step) => state[step])
);

export const normalizeOnboardingState = (state?: Partial<OnboardingState>): OnboardingState => {
  const normalized = {
    ...defaultOnboardingState,
    ...state,
  };

  return {
    ...normalized,
    completed: normalized.completed || isOnboardingComplete(normalized),
  };
};

export const getOnboardingState = async (): Promise<OnboardingState> => {
  const result = await chrome.storage.local.get([SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY]);
  return normalizeOnboardingState(result[SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY]);
};

export const saveOnboardingState = async (state: OnboardingState): Promise<OnboardingState> => {
  const normalized = normalizeOnboardingState(state);
  await chrome.storage.local.set({
    [SMART_BOOKMARKS_ONBOARDING_STORAGE_KEY]: normalized,
  });
  return normalized;
};

export const updateOnboardingState = async (
  updates: Partial<OnboardingState>
): Promise<OnboardingState> => {
  const current = await getOnboardingState();
  return saveOnboardingState({
    ...current,
    ...updates,
  });
};

export const markOnboardingStep = async (step: OnboardingStep): Promise<OnboardingState> => (
  updateOnboardingState({ [step]: true })
);

export const dismissOnboarding = async (): Promise<OnboardingState> => (
  updateOnboardingState({ dismissed: true })
);

export const restoreOnboarding = async (): Promise<OnboardingState> => (
  updateOnboardingState({ dismissed: false })
);
