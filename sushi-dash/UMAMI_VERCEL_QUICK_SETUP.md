# 🚀 Setting Up Umami Analytics on Vercel - Quick Guide

## Step 1: Get Your Umami Tracking ID (5 minutes)

### 1.1 Sign Up for Umami Cloud (Free)

1. Go to **https://app.umami.is**
2. Click **"Get Started"** or **"Sign Up"**
3. Create account with email/password
4. Verify your email

### 1.2 Add Your Website

1. After login, click **"Add website"**
2. Fill in:
   - **Website name**: `Sushi Dash` (or whatever you prefer)
   - **Website domain**: `sushi-dash.vercel.app` (replace with your actual domain)
3. Click **"Create"**
4. You'll see your **Tracking ID** (looks like: `a1b2c3d4-e5f6-g7h8-i9j0`)
5. **Copy this ID** - you'll need it in Vercel

**Screenshot hint**: The tracking ID appears on your dashboard right after creating the website.

---

## Step 2: Set Environment Variables in Vercel (5 minutes)

### 2.1 Go to Your Vercel Project

1. Visit **https://vercel.com/dashboard**
2. Find your **Sushi Dash** project (frontend)
3. Click to open it

### 2.2 Add Environment Variables

1. Click **"Settings"** (top navigation)
2. Click **"Environment Variables"** (left sidebar)
3. You should see an input field to add a new variable

### 2.3 Add First Variable: Tracking ID

1. In the **"Name"** field, type exactly:
   ```
   NEXT_PUBLIC_UMAMI_ID
   ```

2. In the **"Value"** field, paste your tracking ID from Umami:
   ```
   a1b2c3d4-e5f6-g7h8-i9j0
   ```
   (Replace with YOUR actual tracking ID)

3. For **"Environments"**, select:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click **"Save"**

### 2.4 Add Second Variable: Endpoint (Optional)

1. Click **"Add another"** or the **"+"** button
2. Name: 
   ```
   NEXT_PUBLIC_UMAMI_ENDPOINT
   ```
3. Value:
   ```
   https://analytics.umami.is
   ```
4. Environments: All three (Production, Preview, Development)
5. Click **"Save"**

### Result

You should now see both variables listed:
```
✓ NEXT_PUBLIC_UMAMI_ID = a1b2c3d4-***
✓ NEXT_PUBLIC_UMAMI_ENDPOINT = https://analytics.umami.is
```

---

## Step 3: Deploy to Vercel (2 minutes)

### Option A: Automatic Deployment (Easiest)

1. Push code to GitHub:
   ```bash
   cd /workspaces/etic-pw2426-frontend2-projeto
   git add .
   git commit -m "Add analytics tracking"
   git push
   ```

2. Vercel will **automatically redeploy** when you push
3. Wait 2-3 minutes for deployment to complete
4. You'll see a checkmark ✓ when done

### Option B: Manual Redeploy

1. In Vercel dashboard, find your **latest deployment**
2. Click the **3 dots** (...) menu
3. Select **"Redeploy"**
4. Confirm
5. Wait 2-3 minutes

---

## Step 4: Verify Analytics Is Working (5 minutes)

### 4.1 Check Browser Console

1. Visit your deployed app: `https://sushi-dash.vercel.app` (replace with your domain)
2. Open browser **DevTools** (Press F12)
3. Go to **Console** tab
4. Look for messages like:
   ```
   [Analytics] Page view: Home (/)
   [Umami] Analytics script loaded successfully
   ```

### 4.2 Check Network Requests

1. Still in DevTools, go to **Network** tab
2. Reload the page
3. Look for requests to `analytics.umami.is`:
   ```
   ✓ script.js → Status 200 (the tracking script)
   ✓ POST requests with event data → Status 200
   ```

### 4.3 Check Umami Dashboard

1. Go back to https://app.umami.is
2. Click on your **Sushi Dash** website
3. You should see:
   - **Realtime** showing live visitors
   - **Statistics** showing page views
   - Page paths like `/`, `/table/1`, `/kitchen`, etc.

**If you see data arriving** ✅ = Analytics is working!

---

## Troubleshooting

### " I don't see analytics in Umami dashboard"

**Check 1: Did you set the env vars?**
```bash
# In Vercel dashboard Settings → Environment Variables
# You should see both NEXT_PUBLIC_UMAMI_ID and NEXT_PUBLIC_UMAMI_ENDPOINT
```

**Check 2: Did you redeploy after adding env vars?**
- Vercel doesn't use env vars from old deployments
- Either: Push to GitHub (auto-redeploy) OR click "Redeploy" manually

**Check 3: Is the script actually loading?**
```javascript
// Open browser console and type:
window.umami  // Should be an object, not undefined
```

**Check 4: Is the tracking ID correct?**
- Go to Umami dashboard
- Click your website
- Check the tracking ID matches what you set in Vercel

### "I see errors in console"

**Error: "Umami tracking ID not configured"**
- The env var isn't set or the deployment hasn't picked it up
- Solution: Redeploy in Vercel after setting env vars

**Error: "Failed to load script from analytics.umami.is"**
- Your endpoint URL is wrong
- Solution: Verify `NEXT_PUBLIC_UMAMI_ENDPOINT` is exactly `https://analytics.umami.is`

---

## Quick Reference: What Should Happen

| Step | What You Do | What You Should See |
|------|------------|---------------------|
| 1 | Create Umami account | Tracking ID displayed |
| 2 | Add env vars in Vercel | Variables listed in Settings |
| 3 | Redeploy or push to GitHub | Deployment succeeds (green checkmark) |
| 4 | Visit app in browser | Console shows `[Analytics]` messages |
| 5 | Check Umami dashboard | Real-time visitors + page views showing |

---

## What Gets Tracked Automatically

Once deployed, you'll automatically see:

✅ **Every page visit**
- `/` (home)
- `/table/[tableId]` (customer ordering)
- `/kitchen` (kitchen dashboard)  
- `/manager` (manager panel)

✅ **Customer interactions**
- Table selection
- PIN entry (success/fail)
- Order placement
- Menu browsing
- Item views

✅ **Staff actions**
- Login attempts and successes
- Password changes
- Logout events

✅ **System events**
- Errors
- API latency
- Connection issues

---

## Next Steps After Verification

1. **Monitor analytics** in Umami dashboard daily
2. **Create reports** for key metrics (orders per hour, popular items, etc.)
3. **Set up alerts** if needed (in Umami Settings)
4. **Review insights** weekly to optimize:
   - Popular menu items
   - Peak ordering times
   - Conversion funnel (table selection → PIN → order)

---

## Still Having Issues?

Check these in order:

1. ✅ Umami account created? https://app.umami.is
2. ✅ Website added to Umami? (tracking ID visible)
3. ✅ Env vars set in Vercel? (Settings → Environment Variables)
4. ✅ Env vars have all three environments selected?
5. ✅ Redeploy triggered? (either via git push or manual redeploy)
6. ✅ Waiting 5+ minutes after redeploy?
7. ✅ Analytics module imported? (should be in app/providers.tsx)

If still stuck, check:
```bash
# Locally, verify the environment variable is being read:
echo $NEXT_PUBLIC_UMAMI_ID  # Should show your tracking ID (if set in .env.local)

# In Vercel build logs:
# Look for: "[Umami] Analytics script loaded successfully"
```

---

## Summary

| Task | Time | Status |
|------|------|--------|
| Get Umami tracking ID | 5 min | ⏳ Do this first |
| Set Vercel env vars | 5 min | ⏳ Then this |
| Redeploy | 2 min | ⏳ Then this |
| Verify in browser | 5 min | ⏳ Then validate |
| **Total** | **~17 min** | **Done!** |

**You're ready to go! Follow the steps above in order.** 🎉
