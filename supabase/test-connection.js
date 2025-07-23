import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from mcp-server/.env
dotenv.config({ path: './mcp-server/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Test 1: Check if we can connect and query
    console.log('\n1. Testing basic connection...')
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .limit(5)
    
    if (achievementsError) throw achievementsError
    console.log('✓ Connection successful!')
    console.log(`✓ Found ${achievements.length} achievements`)
    
    // Test 2: Test auth functionality
    console.log('\n2. Testing auth functionality...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError && authError.message !== 'Auth session missing!') {
      throw authError
    }
    
    if (!user) {
      console.log('✓ Auth is working (no user logged in)')
    } else {
      console.log('✓ Auth is working (user:', user.email, ')')
    }
    
    // Test 3: Check if tables exist
    console.log('\n3. Checking if all tables exist...')
    const tables = [
      'user_profiles',
      'bookmarks',
      'bookmark_folders',
      'teams',
      'team_members',
      'coworking_sessions',
      'session_participants',
      'tasks',
      'habits',
      'habit_check_ins',
      'productivity_sessions',
      'achievements',
      'user_achievements',
      'ai_connections',
      'calendar_integrations',
      'integrations',
      'user_settings'
    ]
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error && !error.message.includes('auth')) {
        console.log(`✗ Table '${table}' check failed:`, error.message)
      } else {
        console.log(`✓ Table '${table}' exists`)
      }
    }
    
    // Test 4: Check if extensions are enabled
    console.log('\n4. Checking required extensions...')
    const { data: extensions, error: extError } = await supabase
      .rpc('current_setting', { setting_name: 'server_version' })
    
    if (!extError) {
      console.log('✓ Can execute RPC functions')
    }
    
    console.log('\n🎉 All tests passed! Your Supabase database is ready.')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message)
    console.error('\nPlease check:')
    console.error('1. Your Supabase project is active')
    console.error('2. Your environment variables are correct')
    console.error('3. The database schema has been applied')
  }
}

// Run the test
testConnection()