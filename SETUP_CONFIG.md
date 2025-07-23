# Setting Up Focusly Configuration

## Important Security Notice
This extension requires API keys to function. Never commit your actual keys to version control!

## Setup Instructions

1. **Copy the template file:**
   ```bash
   cp config.template.js config.local.js
   ```

2. **Edit config.local.js** with your actual values:
   - Replace `YOUR_SUPABASE_PROJECT_URL` with your Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon/public key
   - Optionally add your Stripe publishable key if using payments

3. **Load the extension:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this directory
   - The extension will show a notification if configuration is missing

4. **Verify configuration:**
   - Click the Focusly extension icon
   - Check the browser console for configuration status messages
   - You should see "✅ Focusly: Configuration loaded successfully"

## Where to find your keys:

### Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - Project URL (e.g., `https://abc123.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

### Stripe (optional):
1. Go to Stripe Dashboard → Developers → API keys
2. Copy the Publishable key (starts with `pk_test_...`)

## Troubleshooting:
- If you see "Missing configuration" notification, check that config.local.js exists
- Make sure config.local.js is never committed to git (.gitignore already configured)
- Check browser console for detailed error messages

## Security Best Practices:
- Never share your API keys
- Use test keys for development
- Rotate keys regularly
- Use environment-specific keys (dev/staging/prod)