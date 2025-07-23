# 🚨 URGENT: Create Your Stripe Payment Link

## ⚠️ Current Status
The extension is using a **placeholder URL** which causes "Access Denied" errors. You need to create a real Stripe Payment Link.

## 🚀 Quick Fix (3 minutes)

### 1️⃣ Create Stripe Payment Link

1. **Open Stripe Dashboard**
   👉 [https://dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links)

2. **Click "Create payment link"**

3. **Fill in these exact details:**
   - **Product name:** `Smart Bookmarks Pro`
   - **Price:** `9.99` USD
   - **Billing:** `Recurring` → `Monthly`
   - **Description:** `Website blocking, extended focus sessions, advanced analytics`

4. **Click "Create link"**

5. **Copy your link** (looks like: `https://buy.stripe.com/test_abc123xyz`)

### 2️⃣ Update Your Code

1. **Open** `popup-prod.js`
2. **Find line 3989:**
   ```javascript
   const stripePaymentLink = 'PASTE_YOUR_REAL_STRIPE_LINK_HERE';
   ```
3. **Replace with your actual link:**
   ```javascript
   const stripePaymentLink = 'https://buy.stripe.com/test_abc123xyz';
   ```

### 3️⃣ Test It Works

1. **Reload extension** in Chrome
2. **Click** "Website Blocking" card
3. **Click** "Upgrade to Pro"
4. **Verify** Stripe checkout opens (no more Access Denied!)

## ✅ What You'll See

**Before (Current):**
- Click "Upgrade to Pro" → "Setting Up Secure Payment" message
- Temporary fallback shows Pro features

**After (With Real Link):**
- Click "Upgrade to Pro" → Real Stripe checkout opens
- Users can actually pay $9.99/month
- Professional payment experience

## 🎯 Example Working Links

**Test mode:**
```javascript
const stripePaymentLink = 'https://buy.stripe.com/test_28o29a5nY5nY6t2288';
```

**Live mode:**
```javascript
const stripePaymentLink = 'https://buy.stripe.com/28o29a5nY5nY6t2288';
```

## 📝 Important Notes

1. **Test Mode First** - Create a test Payment Link to verify everything works
2. **Success URL** - Can be set to `chrome-extension://YOUR_EXTENSION_ID/success.html`
3. **Cancel URL** - Can be left as default or same as success

## 🚨 Common Mistakes

- ❌ Using placeholder URL → Causes "Access Denied"
- ❌ Using wrong URL format → Must be `buy.stripe.com` format
- ❌ Not saving file after update → Remember to save!

## 🆘 Need Help?

The temporary fallback message will show until you add a real Stripe link. This is intentional to prevent broken payment flows.

**Action Required:** Create your Stripe Payment Link now to enable real payments!