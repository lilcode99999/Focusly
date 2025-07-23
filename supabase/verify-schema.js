import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from mcp-server/.env
dotenv.config({ path: './mcp-server/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifySchema() {
  console.log('🔍 Verifying Supabase Schema...')
  console.log('URL:', supabaseUrl)
  console.log('=' .repeat(60))
  
  const results = {
    extensions: [],
    types: [],
    tables: [],
    achievements: 0,
    errors: []
  }
  
  try {
    // Check tables
    console.log('\n📊 Checking Tables:')
    const expectedTables = [
      'user_profiles',
      'teams',
      'team_members',
      'bookmarks',
      'bookmark_folders',
      'coworking_sessions',
      'session_participants',
      'ai_connections',
      'calendar_integrations',
      'tasks',
      'habits',
      'habit_check_ins',
      'productivity_sessions',
      'achievements',
      'user_achievements',
      'integrations',
      'user_settings'
    ]
    
    for (const table of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table} - ${error.message}`)
          results.errors.push(`Table ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table} (${count || 0} rows)`)
          results.tables.push(table)
        }
      } catch (err) {
        console.log(`❌ ${table} - ${err.message}`)
        results.errors.push(`Table ${table}: ${err.message}`)
      }
    }
    
    // Check achievements were seeded
    console.log('\n🏆 Checking Achievement Seeds:')
    try {
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('name, category')
        .order('name')
      
      if (error) {
        console.log('❌ Could not fetch achievements:', error.message)
      } else if (achievements && achievements.length > 0) {
        console.log(`✅ Found ${achievements.length} achievements:`)
        achievements.forEach(a => {
          console.log(`   - ${a.name} (${a.category})`)
        })
        results.achievements = achievements.length
      } else {
        console.log('⚠️  No achievements found - seed data may not have been inserted')
      }
    } catch (err) {
      console.log('❌ Achievement check failed:', err.message)
    }
    
    // Summary
    console.log('\n📋 Summary:')
    console.log('=' .repeat(60))
    console.log(`✅ Tables created: ${results.tables.length}/${expectedTables.length}`)
    console.log(`🏆 Achievements seeded: ${results.achievements}`)
    console.log(`❌ Errors encountered: ${results.errors.length}`)
    
    if (results.tables.length === expectedTables.length) {
      console.log('\n🎉 Schema verification complete! All tables exist.')
      console.log('   Your database is ready for use.')
      
      // Test creating a user profile
      console.log('\n🧪 Testing RLS policies...')
      try {
        // This should fail with RLS
        const { error: rlsError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)
        
        if (rlsError && rlsError.message.includes('RLS')) {
          console.log('✅ Row Level Security is properly configured')
        } else {
          console.log('⚠️  RLS might not be properly configured')
        }
      } catch (err) {
        console.log('✅ RLS test completed')
      }
      
    } else {
      console.log('\n⚠️  Some tables are missing!')
      console.log('   Missing tables:', expectedTables.filter(t => !results.tables.includes(t)))
      console.log('\n   Please ensure you copied and ran the ENTIRE schema.sql file')
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:')
      results.errors.forEach(e => console.log(`   - ${e}`))
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
  }
}

// Run verification
verifySchema()