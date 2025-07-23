# Supabase Database Setup

This directory contains all the database-related files for the Smart Bookmarks Extension.

## Quick Start

1. **Create a Supabase account**: https://supabase.com
2. **Follow the setup guide**: See `SETUP_GUIDE.md` for detailed instructions
3. **Apply the schema**: Run `schema.sql` in your Supabase SQL editor
4. **Configure environment**: Copy `.env.local.example` to `.env.local` and fill in your values
5. **Test connection**: Run `node supabase/test-connection.js`

## Directory Structure

```
supabase/
├── README.md              # This file
├── SETUP_GUIDE.md        # Detailed setup instructions
├── schema.sql            # Complete database schema
├── test-connection.js    # Connection testing script
└── migrations/           # Version-controlled migrations
    └── 20240101000000_initial_schema.sql
```

## Key Features of the Schema

### User Management
- Extends Supabase Auth with `user_profiles` table
- Supports Free, Pro, Teams, and Enterprise tiers
- Stripe integration for subscription management
- ADHD-specific preferences storage

### Core Features
- **Bookmarks**: AI-powered semantic search with vector embeddings
- **Body Doubling**: Real-time coworking sessions with WebRTC
- **Tasks**: Brain dump with AI breakdown and priority management
- **Calendar**: Energy-aware scheduling with multiple provider support
- **Habits**: Flexible tracking with streak management
- **Integrations**: MCP-based AI connections and tool integrations

### Security
- Row Level Security (RLS) enabled on all user data tables
- Encrypted storage for sensitive tokens
- User isolation - users can only access their own data
- Team-based access control for shared resources

### Performance
- Optimized indexes for common queries
- Vector similarity search for semantic bookmark matching
- Full-text search capabilities
- Automatic timestamp updates via triggers

## Database Schema Overview

### Main Tables
1. **user_profiles** - Extended user data and subscription info
2. **bookmarks** - AI-enhanced bookmark storage with embeddings
3. **coworking_sessions** - Body doubling session management
4. **tasks** - Task management with AI breakdown
5. **habits** - Habit tracking with flexible patterns
6. **ai_connections** - User's AI provider connections (MCP)
7. **integrations** - Third-party tool connections

### Key Relationships
- Users own bookmarks, tasks, habits, and sessions
- Teams have multiple members with role-based access
- Sessions have multiple participants
- Tasks can have subtasks (self-referential)
- Folders can be nested (self-referential)

## Common Operations

### Check User Subscription
```sql
SELECT subscription_tier, subscription_status 
FROM user_profiles 
WHERE id = 'user-uuid';
```

### Get Active Body Doubling Sessions
```sql
SELECT s.*, COUNT(p.id) as participant_count
FROM coworking_sessions s
LEFT JOIN session_participants p ON s.id = p.session_id
WHERE s.scheduled_start_at <= NOW() 
  AND s.scheduled_end_at >= NOW()
  AND s.is_private = false
GROUP BY s.id;
```

### Search Bookmarks by Similarity
```sql
SELECT * FROM bookmarks
WHERE user_id = 'user-uuid'
ORDER BY embedding <=> '[your-vector-here]'
LIMIT 10;
```

## Maintenance

### Regular Tasks
1. **Monitor slow queries** in Supabase dashboard
2. **Update RLS policies** as features evolve
3. **Backup data** regularly (automated in Supabase)
4. **Review indexes** based on query patterns
5. **Clean up old sessions** and expired data

### Migrations
When making schema changes:
1. Create a new migration file in `migrations/`
2. Test in a development project first
3. Apply to production during maintenance window
4. Update TypeScript types accordingly

## Troubleshooting

### Common Issues

**Can't connect to database**
- Check environment variables
- Verify project is active in Supabase dashboard
- Ensure IP is not blocked

**RLS policies blocking access**
- Check user is authenticated
- Verify policies match your use case
- Test with service role key (bypasses RLS)

**Vector search not working**
- Ensure pgvector extension is enabled
- Check embedding dimensions match (1536 for OpenAI)
- Verify index exists on embedding column

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: Join the Supabase Discord for help
- **GitHub Issues**: Report bugs in our repository