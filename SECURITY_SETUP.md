# 🔒 SECURITY SETUP - URGENT ACTION REQUIRED

## ⚠️ Security Incident Response

Your Supabase API keys were exposed in the public GitHub repository. Follow these steps IMMEDIATELY:

## 1. 🚨 Rotate Your Supabase Keys NOW

1. **Go to your Supabase Dashboard**
   - Navigate to: https://app.supabase.com/
   - Select your project

2. **Generate New API Keys**
   - Go to Settings → API
   - Click "Generate new JWT secret"
   - Confirm the action
   - Your anon/public key will be regenerated

3. **Update All Applications**
   - Update any other apps using these keys
   - Update environment variables
   - Restart services

## 2. 🔧 Configure the Extension Securely

1. **Edit config.local.js** (already created for you):
   ```javascript
   // Replace with your NEW keys from Supabase
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-new-anon-key...';
   ```

2. **Load the configuration**:
   - The extension checks for config.local.js automatically
   - You'll see a notification if configuration is missing
   - Check browser console for "✅ Focusly: Configuration loaded successfully"

## 3. 📋 Security Checklist

- [ ] Old Supabase keys have been rotated
- [ ] New keys are in config.local.js
- [ ] config.local.js is NOT committed to git (check .gitignore)
- [ ] Extension loads without errors
- [ ] No keys appear in `git status` output

## 4. 🛡️ Best Practices Going Forward

### Never Commit Secrets
- Always use config.local.js for sensitive data
- Check files before committing: `git diff`
- Use `git status` to verify what will be committed

### Use Environment Variables
- For server-side code, use .env files
- For client-side, use build-time injection
- Never hardcode keys in source files

### Regular Key Rotation
- Rotate keys every 90 days
- Immediately rotate if exposed
- Use different keys for dev/staging/prod

### Monitor for Exposures
- Enable GitHub secret scanning
- Use tools like GitGuardian
- Set up alerts for suspicious activity

## 5. 🔍 Verify Security Status

Run these commands to ensure no secrets remain:

```bash
# Search for any Supabase keys
grep -r "eyJ" . --exclude-dir=node_modules --exclude="*.local.js"

# Search for Stripe keys
grep -r "sk_test" . --exclude-dir=node_modules --exclude="*.local.js"

# Check git history (if needed to clean)
git log --oneline | head -20
```

## 6. 📱 Loading the Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory
5. Check for configuration notification

## 7. 🆘 Troubleshooting

### "Missing configuration" notification
- Ensure config.local.js exists in root directory
- Check that keys are properly formatted
- Look for syntax errors in config.local.js

### Extension not working
- Open DevTools → Console for errors
- Verify Supabase project is active
- Check network tab for failed requests

### Keys still exposed
- Force push to overwrite history if needed
- Consider making repo private temporarily
- Contact GitHub support for help

## 8. 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)

---

**Remember**: The exposed keys can no longer be used after rotation. Anyone who copied them will not be able to access your database once you complete step 1.

**Need help?** Check the browser console for detailed error messages or create an issue (without including any keys!).