# Supabase Database Setup Guide

This guide will walk you through setting up the Supabase database for the Smart Bookmarks Extension.

## Prerequisites

- Supabase account (create one at https://supabase.com)
- Access to the Supabase dashboard

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New project"
3. Fill in the project details:
   - **Organization**: Select your organization or create a new one
   - **Project name**: `smart-bookmarks-prod`
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Start with Free tier, upgrade as needed

4. Click "Create new project" and wait for provisioning (~2 minutes)

## Step 2: Execute Database Schema

1. Once the project is created, go to the SQL Editor in the Supabase dashboard
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

**Note**: The schema includes:
- All required extensions (uuid-ossp, vector, pg_trgm)
- Custom types for subscriptions, sessions, energy levels, etc.
- All tables with proper relationships
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

## Step 3: Configure Authentication

1. Go to Authentication → Providers in the Supabase dashboard
2. Enable Email provider:
   - Toggle "Enable Email provider" ON
   - Configure email templates as needed
3. Go to Authentication → URL Configuration
4. Add your Chrome extension URL to the allowed redirect URLs:
   ```
   chrome-extension://YOUR_EXTENSION_ID/*
   ```

## Step 4: Get Connection Details

1. Go to Settings → API in the Supabase dashboard
2. Copy the following values:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **Anon/Public Key**: For client-side usage
   - **Service Role Key**: For server-side operations (keep secret!)

## Step 5: Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URL (for migrations and direct access)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

## Step 6: Install Supabase CLI (Optional but Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 7: Test Database Connection

Create a simple test script `test-connection.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Test selecting from a table
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .limit(5)
    
    if (error) throw error
    
    console.log('Connection successful! Found achievements:', data)
  } catch (error) {
    console.error('Connection failed:', error.message)
  }
}

testConnection()
```

Run with: `node test-connection.js`

## Step 8: Enable Realtime (for Body Doubling Sessions)

1. Go to Database → Replication in the Supabase dashboard
2. Enable replication for these tables:
   - `coworking_sessions`
   - `session_participants`
   - `bookmarks` (for live sync)

## Step 9: Set Up Storage Buckets

1. Go to Storage in the Supabase dashboard
2. Create the following buckets:
   - `avatars` - For user profile pictures
   - `screenshots` - For bookmark screenshots
   - `exports` - For data exports

3. Set up policies for each bucket to allow authenticated users to upload/read their own files

## Next Steps

1. **Stripe Integration**: Set up Stripe webhooks to update subscription status
2. **Edge Functions**: Deploy edge functions for payment processing
3. **Backups**: Configure automatic backups in Supabase dashboard
4. **Monitoring**: Set up database monitoring and alerts

## Troubleshooting

### Vector Extension Issues
If you get an error about the vector extension:
1. Make sure you're on a Supabase plan that supports pgvector
2. Try enabling it through the Dashboard → Extensions interface

### RLS Policy Issues
If you can't access data:
1. Check that RLS is enabled on the tables
2. Verify the policies are correctly set up
3. Make sure you're authenticated when making requests

### Performance Issues
1. Monitor slow queries in the Supabase dashboard
2. Add additional indexes as needed
3. Consider upgrading your Supabase plan for better performance

## Security Checklist

- [ ] Strong database password stored securely
- [ ] Service role key never exposed client-side
- [ ] RLS policies properly configured
- [ ] API rate limiting enabled
- [ ] Regular security audits scheduled