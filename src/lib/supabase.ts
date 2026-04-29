import type { Session, User } from '@supabase/supabase-js';

type DisabledResult<TData> = {
  data: TData;
  error: Error;
};

type DisabledSession = Session | null;
type DisabledUser = User | null;

const disabledCloudError = new Error(
  'Supabase is disabled for the local-first MVP.'
);

const disabledResult = <TData>(data: TData): DisabledResult<TData> => ({
  data,
  error: disabledCloudError,
});

const createDisabledQuery = () => ({
  select: () => createDisabledQuery(),
  insert: () => createDisabledQuery(),
  eq: () => createDisabledQuery(),
  order: () => createDisabledQuery(),
  range: () => createDisabledQuery(),
  limit: () => createDisabledQuery(),
  gte: () => createDisabledQuery(),
  lte: () => createDisabledQuery(),
  single: async () => disabledResult(null),
});

export const supabase = {
  auth: {
    getSession: async (): Promise<{
      data: { session: DisabledSession };
      error: null;
    }> => ({
      data: { session: null },
      error: null,
    }),
    getUser: async () => ({
      data: { user: null as DisabledUser },
      error: disabledCloudError,
    }),
    signInWithPassword: async () => disabledResult({ user: null, session: null }),
    signUp: async () => disabledResult({ user: null, session: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (
      _callback: (event: string, session: DisabledSession) => void
    ) => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
  },
  from: () => createDisabledQuery(),
};

export const createSupabaseClient = () => supabase;

export const signIn = async (_email: string, _password: string) => {
  return supabase.auth.signInWithPassword();
};

export const signUp = async (_email: string, _password: string) => {
  return supabase.auth.signUp();
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

export const getUserSubscription = async (_userId: string) => {
  return disabledResult(null);
};

export const isProUser = async (_userId: string) => false;

export const createBookmark = async (_bookmark: {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
}) => {
  return disabledResult(null);
};

export const getBookmarks = async (_limit = 50, _offset = 0) => {
  return disabledResult([]);
};

export const searchBookmarks = async (_query: string) => {
  return disabledResult([]);
};

export const getActiveSessions = async () => {
  return disabledResult([]);
};

export const joinSession = async (_sessionId: string, _goals?: string) => {
  return disabledResult(null);
};
