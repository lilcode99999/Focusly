# CLAUDE.md — Memory Context for Smart Bookmarks Extension

## 🧠 Project Overview

Smart Bookmarks is an AI-powered Chrome extension built for neurodivergent users (especially those with ADHD). It helps users save, search, and revisit web content using AI-enhanced context, productivity patterns, and behavioral signals.

This extension prioritizes simplicity, clarity, and task follow-through. The MVP emphasizes fast performance, calm UX, and deep semantic utility without visual overload.

---

## 🔧 Stack + Tooling

- **Frontend**: React (TypeScript), Chrome Extension (Manifest V3)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Row Level Security)
- **Auth**: Supabase Auth (email/password + magic links)
- **Payments**: Stripe Checkout + Webhooks (Pro / Teams tiers)
- **AI Stack**:
  - Claude Code — for planning, reasoning, and all code writing
  - Gemini CLI — for research, summarization, and memory logging
- **AI Control Layer**: Model Context Protocol (MCP) for routing AI requests
- **Build Tooling**: Vite, TailwindCSS, Prettier, ESLint
- **Deployment**: Chrome Web Store (MVP)

---

## 🤖 Claude Code Usage Guidelines

Claude Code is responsible for **all code generation and refactoring**, including:

- Supabase DB schema evolution
- Stripe integration (including webhooks, portal, and metered usage)
- React frontend (hooks, component logic, state management)
- AI routing backend (MCP-based)
- Productivity scoring engine
- All glue code and edge-case handling

Do not hallucinate alternate stacks (e.g., Firebase, Pinecone, LangChain, etc.)  
Do not use Next.js, Express, or Node servers — **all backend is Supabase**.

---

## 📚 Gemini CLI Role (Complementary to Claude)

Gemini is used to:
- Summarize best practices (e.g. billing flows, pgvector)
- Log feature research
- Feed Claude memory by appending structured insights to this file

Always treat `claude.md` as the **single source of truth** for project intent and system design. Claude should reason from this file.

---

## 🧩 Feature Modules

### 1. 🧠 Semantic Bookmarking
- Save URL, title, summary, and user notes
- AI-enhanced tagging using Claude/MCP
- Stored as `bookmarks` in Supabase
- Embeddings via `pgvector`
- Filter by time-of-day, mood, or tag

### 2. 📈 Productivity Insights
- Time tracking based on site interaction
- Focus score = (time on task - tab switching events)
- Body-doubling timer with optional lock mode
- Weekly reflection reports

### 3. ⚙️ MCP Integration
- Claude handles reasoning-heavy prompts
- Gemini handles summarization, research
- MCP API decides which agent to call

### 4. 💳 Stripe Billing
- Stripe Checkout for Pro/Teams
- Stripe Webhooks -> Supabase Edge Functions
- Auth middleware restricts features by tier
- Dashboard fetches plan tier on load

---

## 👤 User Personas

### Primary:
- Adults with ADHD or executive dysfunction
- Students needing context-based recall
- Burnt-out knowledge workers

### Secondary:
- Neurodivergent developers
- Coaches and therapists using structured AI recall

Design UX and copy to feel:
- Encouraging
- Non-judgmental
- Calm but energizing

---

## 🚧 Current Status

- ✅ Supabase project created with users/bookmarks tables
- ✅ Stripe products created
- ✅ Chrome extension scaffolded with Vite + React
- 🔄 In progress: clean backend ↔ frontend wiring
- 🔜 Next: enable AI workflows via MCP, start onboarding flow

---

## 🧱 Code Architecture Guidelines

Claude must follow these principles:

- 🧼 Keep component logic clean and split by function
- 🧠 Reuse Supabase client logic — avoid repetition
- 🚫 No external backend — only Supabase Edge Functions
- ✅ Use Stripe customer ID mapping on Supabase user ID
- 🔐 Auth-guard dashboard, /pro routes, and settings
- 🪪 Store user plan tier in JWT claims (or `user_metadata`)
- ✅ Claude should write TypeScript only (never JavaScript)

---

## ✅ Claude Prompts Allowed

Claude Code is allowed to:
- Create and modify `.ts`/`.tsx` files in the project
- Write backend Supabase Edge Functions
- Create utility files (e.g., `supabaseClient.ts`, `stripeUtils.ts`)
- Generate testing code (e.g., `__tests__/`)
- Update manifest and Chrome config safely

---

## 🛡️ Claude Guardrails

- DO NOT invent services (e.g., LangChain, Firebase)
- DO NOT scaffold unused folders
- DO NOT generate speculative features without explicit request
- DO keep all project structure clean, readable, and minimal

---

## 📅 Roadmap (MVP Goals)

### Must-Have
- Bookmark save, tag, and search
- Stripe subscription with gated access
- Body-doubling focus timer
- MCP-based AI calls
- Extension install + onboarding

### Nice-to-Have
- Reflection dashboard
- Focus score heatmap
- AI-powered summaries of saved content
- Whisper transcription of voice notes

---

## 🧠 Gemini-Generated Research Log

*Use `gemini -p "Summarize topic X" >> claude.md` to append structured memory here*

```md
### [2025-07-13] Supabase Auth + Stripe Best Practices
- Use Supabase Edge Functions to validate webhooks
- Store `stripe_customer_id` on user sign-up or after first checkout
- For tier-based access, sync Stripe metadata to Supabase `user_metadata`
- Recommended Stripe products: Pro (monthly), Teams (5-user bundle)
Of course. Here is a comprehensive guide on how to sync Supabase authentication state with a React application using the Context API.

This approach creates a centralized, accessible, and reactive authentication system for your entire app.

### Core Concept

The strategy is to create a global "Auth Provider" component. This component will:
1.  Use a React Context to hold the authentication state (like the user and session).
2.  Subscribe to Supabase's `onAuthStateChange` event.
3.  Update its own state whenever a user logs in, logs out, or their session is refreshed.
4.  Make this state available to any component in the application tree via a custom hook (`useAuth`).

---

### Step-by-Step Implementation

#### 1. Set up Supabase Client

First, ensure you have a dedicated file to initialize and export your Supabase client. This prevents re-initialization on every render.

**`src/lib/supabase.ts`** (or `.js`)
```typescript
import { createClient } from '@supabase/supabase-js';

// It's recommended to use environment variables for these
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 2. Create the Auth Context and Provider

This is the core of the solution. Create a new file for your `AuthProvider`.

**`src/context/AuthContext.tsx`** (or `.jsx`)
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Adjust path as needed

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start with loading set to true
    setLoading(true);

    // 1. Get the current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 3. Unsubscribe on cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
  };

  // Don't render children until loading is false
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 3. Wrap Your App with the Provider

To make the auth context available globally, wrap your root component (`App.tsx`) with the `AuthProvider`.

**`src/index.tsx`** (or your app's entry point)
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Adjust path

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

#### 4. Use the `useAuth` Hook in Your Components

Now, any component within the `AuthProvider` can easily access the authentication state.

**Example: A `UserProfile` component**
```typescript
import { useAuth } from './context/AuthContext'; // Adjust path
import { supabase } from './lib/supabase'; // Adjust path

const UserProfile = () => {
  // Use the custom hook to get auth state
  const { user, session } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    // You can redirect to a login page or show a login button
    return <div>Please log in.</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <p>User ID: {user.id}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default UserProfile;
```

### Summary of Benefits

*   **Centralized Logic:** All authentication logic is contained within `AuthContext.tsx`.
*   **Clean Components:** Components don't need to know about Supabase directly. They just use the `useAuth` hook.
*   **Reactivity:** The UI automatically re-renders when the auth state changes (login/logout).
*   **No Prop Drilling:** You avoid passing `user` and `session` objects down through many layers of components.
*   **Initial Load Handling:** The `loading` state prevents UI flicker by ensuring the app waits for the initial session to be fetched before rendering protected content.
