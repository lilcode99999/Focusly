import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables from mcp-server/.env
dotenv.config({ path: './mcp-server/.env' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySchema() {
  console.log('🚀 Starting schema application to Supabase...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql')
    console.log('\n📄 Reading schema from:', schemaPath)
    const schema = readFileSync(schemaPath, 'utf8')
    
    // Split the schema into individual statements
    // This is a simple split - in production you might need more sophisticated parsing
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`\n📊 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip if it's just a comment
      if (statement.trim().startsWith('--')) continue
      
      // Get a preview of the statement
      const preview = statement.substring(0, 50).replace(/\n/g, ' ') + '...'
      process.stdout.write(`\n[${i + 1}/${statements.length}] Executing: ${preview}`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).single()
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .eq('query', statement)
            .single()
          
          if (directError) {
            throw error || directError
          }
        }
        
        process.stdout.write(' ✅')
        successCount++
      } catch (error) {
        process.stdout.write(' ❌')
        errorCount++
        errors.push({
          statement: preview,
          error: error.message
        })
        
        // Continue with next statement
        console.error(`\n  Error: ${error.message}`)
      }
    }
    
    console.log('\n\n📊 Schema Application Summary:')
    console.log(`✅ Successful statements: ${successCount}`)
    console.log(`❌ Failed statements: ${errorCount}`)
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach((e, i) => {
        console.log(`\n${i + 1}. Statement: ${e.statement}`)
        console.log(`   Error: ${e.error}`)
      })
      
      console.log('\n💡 Note: Some errors might be expected (e.g., "already exists" errors)')
      console.log('   Please review the errors above and verify your schema in Supabase dashboard')
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying created tables...')
    const tables = [
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
    
    let tableCount = 0
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`✅ Table '${table}' exists`)
          tableCount++
        } else {
          console.log(`❌ Table '${table}' not found: ${error.message}`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed: ${err.message}`)
      }
    }
    
    console.log(`\n✅ Successfully verified ${tableCount}/${tables.length} tables`)
    
    if (tableCount === tables.length) {
      console.log('\n🎉 Schema application completed successfully!')
      console.log('   All tables are ready for use.')
    } else {
      console.log('\n⚠️  Some tables might be missing.')
      console.log('   Please check the Supabase dashboard and apply any missing parts manually.')
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Note about manual steps
console.log('⚠️  IMPORTANT: This script attempts to apply the schema programmatically.')
console.log('   However, due to Supabase security restrictions, you may need to:')
console.log('   1. Go to your Supabase dashboard')
console.log('   2. Navigate to SQL Editor')
console.log('   3. Copy and paste the contents of schema.sql')
console.log('   4. Run it manually')
console.log('\n   This script will attempt automatic application first...\n')

// Run the schema application
applySchema()