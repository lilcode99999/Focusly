import Stripe from 'stripe'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './mcp-server/.env' })

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error('❌ Missing STRIPE_SECRET_KEY in environment variables!')
  console.error('Please add your Stripe secret key to mcp-server/.env')
  console.error('Get your key from: https://dashboard.stripe.com/test/apikeys')
  process.exit(1)
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n')
  
  try {
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 })
    const productNames = existingProducts.data.map(p => p.name)
    
    console.log('📦 Checking existing products...')
    if (productNames.length > 0) {
      console.log('Found existing products:', productNames.join(', '))
    }
    
    // Create or get Pro product
    let proProduct = existingProducts.data.find(p => p.name === 'Smart Bookmarks Pro')
    if (!proProduct) {
      console.log('\n✨ Creating Pro product...')
      proProduct = await stripe.products.create({
        name: 'Smart Bookmarks Pro',
        description: 'Unlimited bookmarks, AI search, unlimited body doubling sessions, all integrations',
        metadata: {
          tier: 'pro',
          features: JSON.stringify([
            'Unlimited bookmarks',
            'AI-powered semantic search',
            'Unlimited body doubling sessions',
            'All MCP integrations',
            'Calendar optimization',
            'Priority support'
          ])
        }
      })
      console.log('✅ Pro product created:', proProduct.id)
    } else {
      console.log('✅ Pro product exists:', proProduct.id)
    }
    
    // Create or get Pro price
    const proPrices = await stripe.prices.list({ product: proProduct.id, limit: 10 })
    let proPrice = proPrices.data.find(p => p.unit_amount === 999 && p.recurring?.interval === 'month')
    
    if (!proPrice) {
      console.log('💰 Creating Pro price ($9.99/month)...')
      proPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 999, // $9.99 in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tier: 'pro'
        }
      })
      console.log('✅ Pro price created:', proPrice.id)
    } else {
      console.log('✅ Pro price exists:', proPrice.id)
    }
    
    // Create or get Teams product
    let teamsProduct = existingProducts.data.find(p => p.name === 'Smart Bookmarks Teams')
    if (!teamsProduct) {
      console.log('\n✨ Creating Teams product...')
      teamsProduct = await stripe.products.create({
        name: 'Smart Bookmarks Teams',
        description: 'Everything in Pro + 5 team members, private sessions, team analytics',
        metadata: {
          tier: 'teams',
          max_members: '5',
          features: JSON.stringify([
            'Everything in Pro',
            '5 team members',
            'Private team coworking rooms',
            'Team productivity dashboard',
            'Admin controls',
            'Dedicated support'
          ])
        }
      })
      console.log('✅ Teams product created:', teamsProduct.id)
    } else {
      console.log('✅ Teams product exists:', teamsProduct.id)
    }
    
    // Create or get Teams price
    const teamsPrices = await stripe.prices.list({ product: teamsProduct.id, limit: 10 })
    let teamsPrice = teamsPrices.data.find(p => p.unit_amount === 1999 && p.recurring?.interval === 'month')
    
    if (!teamsPrice) {
      console.log('💰 Creating Teams price ($19.99/month)...')
      teamsPrice = await stripe.prices.create({
        product: teamsProduct.id,
        unit_amount: 1999, // $19.99 in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tier: 'teams'
        }
      })
      console.log('✅ Teams price created:', teamsPrice.id)
    } else {
      console.log('✅ Teams price exists:', teamsPrice.id)
    }
    
    // Save price IDs for easy reference
    console.log('\n📋 Summary:')
    console.log('=' .repeat(60))
    console.log('Pro Subscription:')
    console.log(`  Product ID: ${proProduct.id}`)
    console.log(`  Price ID: ${proPrice.id}`)
    console.log(`  Amount: $9.99/month`)
    console.log('\nTeams Subscription:')
    console.log(`  Product ID: ${teamsProduct.id}`)
    console.log(`  Price ID: ${teamsPrice.id}`)
    console.log(`  Amount: $19.99/month`)
    
    // Create a config file with the IDs
    const config = {
      products: {
        pro: {
          productId: proProduct.id,
          priceId: proPrice.id,
          amount: 999,
          interval: 'month'
        },
        teams: {
          productId: teamsProduct.id,
          priceId: teamsPrice.id,
          amount: 1999,
          interval: 'month'
        }
      }
    }
    
    console.log('\n💾 Saving configuration...')
    await import('fs').then(fs => {
      fs.writeFileSync(
        './stripe/stripe-config.json',
        JSON.stringify(config, null, 2)
      )
    })
    console.log('✅ Configuration saved to stripe/stripe-config.json')
    
    console.log('\n🎉 Stripe setup complete!')
    console.log('\nNext steps:')
    console.log('1. Deploy the webhook handler: npm run deploy:webhook')
    console.log('2. Configure webhook endpoint in Stripe dashboard')
    console.log('3. Test the payment flow: npm run stripe:test')
    
  } catch (error) {
    console.error('\n❌ Error setting up Stripe:', error.message)
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n🔑 Authentication failed. Please check your STRIPE_SECRET_KEY')
      console.error('Make sure you\'re using the correct key from:')
      console.error('https://dashboard.stripe.com/test/apikeys')
    }
    process.exit(1)
  }
}

// Run setup
setupStripeProducts()