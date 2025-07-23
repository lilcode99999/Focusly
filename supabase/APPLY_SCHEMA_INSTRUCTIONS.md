# Instructions to Apply Schema to Your Supabase Database

Your Supabase connection is working! Now we need to apply the schema. Due to security restrictions, this must be done through the Supabase dashboard.

## Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Your project URL: https://txairbygkxuaqwfcospq.supabase.co

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New query" button

3. **Apply the Schema**
   - Copy the ENTIRE contents of `supabase/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" button (or press Cmd/Ctrl + Enter)

4. **Expected Results**
   - The script will create:
     - Extensions: uuid-ossp, vector, pg_trgm
     - Custom types for subscriptions, sessions, etc.
     - 18 main tables
     - Indexes for performance
     - Row Level Security policies
     - Triggers for automatic timestamps
     - Initial achievement data

5. **Verify Success**
   - You should see "Success" messages in the result panel
   - Some warnings about "IF NOT EXISTS" are normal
   - Check the "Tables" section in the sidebar to see all created tables

## What to Look For

After running the schema, you should see these tables in your database:
- user_profiles
- teams
- team_members
- bookmarks
- bookmark_folders
- coworking_sessions
- session_participants
- ai_connections
- calendar_integrations
- tasks
- habits
- habit_check_ins
- productivity_sessions
- achievements
- user_achievements
- integrations
- user_settings

## If You Get Errors

1. **"extension already exists"** - This is fine, ignore it
2. **"type already exists"** - This is fine, ignore it
3. **"permission denied"** - Contact Supabase support
4. **Other errors** - Copy the error and we'll troubleshoot

## After Schema is Applied

Run the test again to verify:
```bash
npm run test:db
```

You should see all tables verified successfully!