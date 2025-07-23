-- Smart Bookmarks Extension - Supabase Database Schema
-- Based on PRD requirements for complete platform functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For performance monitoring

-- Custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'teams', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'paused');
CREATE TYPE session_type AS ENUM ('focus', 'deep_work', 'creative', 'silent', 'custom');
CREATE TYPE user_energy_level AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low', 'someday');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived', 'deleted');
CREATE TYPE integration_provider AS ENUM ('notion', 'gmail', 'google_drive', 'slack', 'google_calendar', 'outlook', 'apple_calendar');
CREATE TYPE ai_provider AS ENUM ('claude', 'openai', 'local', 'custom');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    subscription_status subscription_status DEFAULT 'active' NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_expires_at TIMESTAMPTZ,
    adhd_preferences JSONB DEFAULT '{}' NOT NULL, -- Stores ADHD-specific settings
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    onboarding_completed_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table for team subscriptions
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.user_profiles(id),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_status subscription_status DEFAULT 'active' NOT NULL,
    max_members INTEGER DEFAULT 5 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Team members
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Bookmarks table with vector embeddings for semantic search
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Extracted page content for search
    favicon_url TEXT,
    screenshot_url TEXT,
    tags TEXT[] DEFAULT '{}' NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    folder_id UUID REFERENCES public.bookmark_folders(id) ON DELETE SET NULL,
    embedding vector(1536), -- OpenAI embeddings dimension
    ai_summary TEXT, -- AI-generated summary
    ai_categories TEXT[] DEFAULT '{}' NOT NULL, -- AI-suggested categories
    visit_count INTEGER DEFAULT 0 NOT NULL,
    last_visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookmark folders for organization
CREATE TABLE public.bookmark_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.bookmark_folders(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Body doubling sessions
CREATE TABLE public.coworking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.user_profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    session_type session_type DEFAULT 'focus' NOT NULL,
    scheduled_start_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NOT NULL,
    actual_start_at TIMESTAMPTZ,
    actual_end_at TIMESTAMPTZ,
    max_participants INTEGER DEFAULT 50 NOT NULL,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    access_code TEXT, -- For private sessions
    meeting_url TEXT, -- WebRTC room URL
    background_music TEXT, -- Selected background music option
    tags TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Session participants
CREATE TABLE public.session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.coworking_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    left_at TIMESTAMPTZ,
    goals TEXT, -- What they plan to work on
    accomplishments TEXT, -- What they actually completed
    energy_level user_energy_level,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    UNIQUE(session_id, user_id)
);

-- User AI provider connections (MCP)
CREATE TABLE public.ai_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    provider ai_provider NOT NULL,
    connection_config JSONB NOT NULL, -- Encrypted MCP connection details
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ,
    UNIQUE(user_id, provider, display_name)
);

-- Calendar integrations
CREATE TABLE public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    provider integration_provider NOT NULL,
    access_token TEXT, -- Encrypted OAuth token
    refresh_token TEXT, -- Encrypted refresh token
    calendar_id TEXT NOT NULL,
    calendar_name TEXT,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    sync_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, provider, calendar_id)
);

-- Tasks and brain dump entries
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium' NOT NULL,
    status task_status DEFAULT 'pending' NOT NULL,
    due_date TIMESTAMPTZ,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    energy_required user_energy_level DEFAULT 'medium',
    context_tags TEXT[] DEFAULT '{}' NOT NULL, -- @home, @office, etc.
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    ai_breakdown JSONB, -- AI-generated subtasks
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habit tracking
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency_pattern JSONB NOT NULL, -- Flexible pattern storage
    target_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habit check-ins
CREATE TABLE public.habit_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    mood user_energy_level,
    UNIQUE(habit_id, user_id, DATE(checked_at))
);

-- Productivity analytics
CREATE TABLE public.productivity_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
    tasks_completed INTEGER DEFAULT 0 NOT NULL,
    deep_work_minutes INTEGER DEFAULT 0 NOT NULL,
    break_minutes INTEGER DEFAULT 0 NOT NULL,
    energy_pattern JSONB, -- Track energy levels throughout session
    distractions JSONB, -- Track what broke focus
    session_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Achievements and gamification
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT,
    points INTEGER DEFAULT 10 NOT NULL,
    criteria JSONB NOT NULL, -- Conditions to unlock
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    progress JSONB, -- Track progress towards achievement
    UNIQUE(user_id, achievement_id)
);

-- Integration connections (Notion, Gmail, etc.)
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    provider integration_provider NOT NULL,
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    connection_metadata JSONB, -- Provider-specific data
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, provider)
);

-- User preferences and settings
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' NOT NULL,
    notification_preferences JSONB DEFAULT '{}' NOT NULL,
    privacy_settings JSONB DEFAULT '{}' NOT NULL,
    adhd_tools_config JSONB DEFAULT '{}' NOT NULL, -- Hyperfocus alerts, time blindness helpers, etc.
    default_session_duration_minutes INTEGER DEFAULT 50 NOT NULL,
    default_break_duration_minutes INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_embedding ON public.bookmarks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_bookmarks_tags ON public.bookmarks USING GIN(tags);
CREATE INDEX idx_bookmarks_search ON public.bookmarks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')));

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX idx_sessions_scheduled_start ON public.coworking_sessions(scheduled_start_at);
CREATE INDEX idx_sessions_host_id ON public.coworking_sessions(host_id);

CREATE INDEX idx_productivity_sessions_user_id ON public.productivity_sessions(user_id);
CREATE INDEX idx_productivity_sessions_started_at ON public.productivity_sessions(started_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only access their own profile
CREATE POLICY user_profiles_select ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_profiles_update ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Bookmarks: Users can only access their own bookmarks
CREATE POLICY bookmarks_select ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bookmarks_insert ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bookmarks_update ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY bookmarks_delete ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Bookmark folders: Users can only access their own folders
CREATE POLICY bookmark_folders_select ON public.bookmark_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bookmark_folders_insert ON public.bookmark_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bookmark_folders_update ON public.bookmark_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY bookmark_folders_delete ON public.bookmark_folders FOR DELETE USING (auth.uid() = user_id);

-- Tasks: Users can only access their own tasks
CREATE POLICY tasks_select ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tasks_insert ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tasks_update ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Abbreviated for brevity, but each table would have appropriate RLS policies)

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables with updated_at column
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookmark_folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coworking_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.habits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_connections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data for achievements
INSERT INTO public.achievements (name, description, icon_url, points, criteria, category) VALUES
('First Bookmark', 'Save your first bookmark', NULL, 10, '{"bookmarks_count": 1}', 'getting_started'),
('Bookmark Collector', 'Save 100 bookmarks', NULL, 50, '{"bookmarks_count": 100}', 'collecting'),
('First Focus Session', 'Complete your first body doubling session', NULL, 20, '{"sessions_completed": 1}', 'focus'),
('Focus Warrior', 'Complete 50 body doubling sessions', NULL, 100, '{"sessions_completed": 50}', 'focus'),
('Habit Builder', 'Check in on a habit for 7 days straight', NULL, 30, '{"habit_streak": 7}', 'habits'),
('Task Master', 'Complete 100 tasks', NULL, 75, '{"tasks_completed": 100}', 'productivity'),
('Early Bird', 'Start a focus session before 7 AM', NULL, 15, '{"early_session": true}', 'special'),
('Night Owl', 'Start a focus session after 10 PM', NULL, 15, '{"late_session": true}', 'special'),
('Team Player', 'Join a team', NULL, 25, '{"team_member": true}', 'social'),
('Helper', 'Help 5 people in body doubling sessions', NULL, 40, '{"people_helped": 5}', 'social');