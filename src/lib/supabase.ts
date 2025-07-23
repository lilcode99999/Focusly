import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// These will be replaced with actual values from environment/config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper function for Chrome extension context
export const createSupabaseClient = (url: string, key: string) => {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: {
        getItem: (key: string) => {
          return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
              resolve(result[key] || null)
            })
          })
        },
        setItem: (key: string, value: string) => {
          return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
              resolve()
            })
          })
        },
        removeItem: (key: string) => {
          return new Promise((resolve) => {
            chrome.storage.local.remove([key], () => {
              resolve()
            })
          })
        },
      },
    },
  })
}

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Subscription helpers
export const getUserSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_status, subscription_expires_at')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const isProUser = async (userId: string) => {
  const { data } = await getUserSubscription(userId)
  return data?.subscription_tier === 'pro' || data?.subscription_tier === 'teams' || data?.subscription_tier === 'enterprise'
}

// Bookmark helpers
export const createBookmark = async (bookmark: {
  url: string
  title: string
  description?: string
  tags?: string[]
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      ...bookmark,
      user_id: user.id,
    })
    .select()
    .single()
  
  return { data, error }
}

export const getBookmarks = async (limit = 50, offset = 0) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  return { data, error }
}

export const searchBookmarks = async (query: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .textSearch('title', query, {
      type: 'websearch',
      config: 'english',
    })
    .order('created_at', { ascending: false })
    .limit(20)
  
  return { data, error }
}

// Session helpers for body doubling
export const getActiveSessions = async () => {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('coworking_sessions')
    .select(`
      *,
      host:user_profiles!host_id(full_name, avatar_url),
      participants:session_participants(count)
    `)
    .gte('scheduled_end_at', now)
    .lte('scheduled_start_at', now)
    .eq('is_private', false)
    .order('scheduled_start_at', { ascending: true })
  
  return { data, error }
}

export const joinSession = async (sessionId: string, goals?: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('session_participants')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      goals,
    })
    .select()
    .single()
  
  return { data, error }
}