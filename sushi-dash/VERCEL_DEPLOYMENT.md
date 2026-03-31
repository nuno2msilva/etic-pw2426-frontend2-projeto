# 🚀 Deploying to Vercel with Umami Analytics

This guide explains how to deploy Sushi Dash to Vercel with analytics tracking enabled.

## Prerequisites

- Umami tracking ID (get from https://app.umami.is)
- Vercel account
- GitHub repository with your code

## Step 1: Prepare Your Repository

Ensure `.env.local` is in your `.gitignore`:

```bash
# In .gitignore
.env.local
.env.*.local
```

This is **required** - environment variables should never be committed to git.

Instead, use `.env.example` to document what variables are needed:

```bash
# This IS committed to git
NEXT_PUBLIC_UMAMI_ID=your_tracking_id_here
NEXT_PUBLIC_UMAMI_ENDPOINT=https://analytics.umami.is
NEXT_PUBLIC_UMAMI_EXCLUDE_DOMAINS=localhost,127.0.0.1
```

✅ **Check:** Run `git status` and confirm `.env.local` is NOT listed.

## Step 2: Get Your Umami Tracking ID

1. Go to https://app.umami.is
2. Sign up for free account (if not already done)
3. Add new website:
   - Website name: "Sushi Dash"
   - Website URL: `https://your-sushi-dash-domain.vercel.app`
4. Copy your **Tracking ID** (looks like: `a1b2c3d4-e5f6-g7h8-i9j0`)

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js ✅
   - **Root Directory**: `sushi-dash/` (if monorepo)
   - Leave other settings as default

5. **Before clicking Deploy**, click **"Environment Variables"**

6. Add your environment variables:

   | Name | Value | Scope |
   |------|-------|-------|
   | `NEXT_PUBLIC_UMAMI_ID` | `your_tracking_id_from_umami` | Production, Preview, Development |
   | `NEXT_PUBLIC_UMAMI_ENDPOINT` | `https://analytics.umami.is` | Production, Preview, Development |

   💡 **Note**: `NEXT_PUBLIC_*` prefix means these are accessible in the browser - OK for public analytics.

7. Click **"Deploy"**

⏳ Vercel will build and deploy your app. Check the logs if anything fails.

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Deploy with environment setup
vercel env add NEXT_PUBLIC_UMAMI_ID
# Paste your tracking ID when prompted

vercel env add NEXT_PUBLIC_UMAMI_ENDPOINT
# Enter: https://analytics.umami.is

# Deploy to production
vercel --prod
```

### Option C: Using vercel.json (Automated)

Add to `sushi-dash/vercel.json`:

```json
{
  "env": {
    "NEXT_PUBLIC_UMAMI_ID": "@umami_id",
    "NEXT_PUBLIC_UMAMI_ENDPOINT": "@umami_endpoint"
  }
}
```

Then create Vercel secrets:
```bash
vercel secrets set umami_id your_tracking_id
vercel secrets set umami_endpoint https://analytics.umami.is
```

## Step 4: Verify Analytics Is Working

1. **Wait 5-10 minutes** for deployment to complete
2. Visit your live deployment: `https://your-app.vercel.app`
3. Open browser DevTools (F12)
4. Check **Console** for:
   ```javascript
   window.umami  // Should exist
   ```
5. Check **Network** tab:
   - Look for requests to `analytics.umami.is/script.js`
   - Look for POST requests to `analytics.umami.is/api/...`

6. **Visit Umami Dashboard**:
   - Go to https://app.umami.is
   - Select your website
   - Click **"Realtime"**
   - You should see visitor activity appearing

## Step 5: Update Analytics Across Your App

Now that analytics is deployed, add tracking calls to key user flows.

See [ANALYTICS_EXAMPLES.md](ANALYTICS_EXAMPLES.md) for complete code samples.

**Quick example:**

```typescript
import { customerEvents } from '@/features/shared';

const handleTableSelect = (tableId: string) => {
  customerEvents.tableSelected(tableId);  // 1-liner!
  // ... existing code
};
```

## Troubleshooting

### Analytics not appearing in dashboard?

**Check 1: Environment variables set in Vercel?**
```bash
vercel env ls
# Should show NEXT_PUBLIC_UMAMI_ID and NEXT_PUBLIC_UMAMI_ENDPOINT
```

**Check 2: Redeploy after setting env vars**
```bash
vercel --prod --skip-build
# Or just trigger a redeployment from Vercel dashboard
```

**Check 3: Browser console**
```javascript
// In deployed app's browser console:
console.log(window.umami)  // Should be object, not undefined
```

**Check 4: Check network requests**
- Open DevTools → Network tab
- Reload page
- Look for `script.js` request to analytics.umami.is
- Look for POST requests with event data

### Script fails to load?

**Problem**: "Failed to load script.js"

**Solutions**:
1. Verify `NEXT_PUBLIC_UMAMI_ENDPOINT` is correct
2. For self-hosted: ensure your Umami server is running
3. Check CORS settings if using self-hosted Umami

### Wrong tracking ID?

**Update in Vercel dashboard:**
1. Go to your project on vercel.com
2. Click **"Settings"** → **"Environment Variables"**
3. Edit `NEXT_PUBLIC_UMAMI_ID`
4. Value updated immediately for future deployments
5. Trigger redeploy: Click your latest deployment → **"Redeploy"**

### Events not saving?

1. Check Umami dashboard → "Events" tab
2. Verify event names match your implementation
3. Wait up to 1 minute for data to appear
4. Check browser console for JS errors

## Deployment Checklist

- [ ] `.env.local` is in `.gitignore` ✅
- [ ] `.env.example` exists and documents all variables
- [ ] Repository pushed to GitHub
- [ ] Umami account created and tracking ID obtained
- [ ] Vercel project created and linked to GitHub
- [ ] Environment variables set in Vercel:
  - [ ] `NEXT_PUBLIC_UMAMI_ID`
  - [ ] `NEXT_PUBLIC_UMAMI_ENDPOINT`
- [ ] Initial deployment completed
- [ ] Analytics script loads (check browser console)
- [ ] Umami dashboard showing visitor activity
- [ ] Tracking calls added to components (see ANALYTICS_EXAMPLES.md)
- [ ] Production analytics data verified

## Environment Variables Scope

| Variable | Type | Required | Scope | Notes |
|----------|------|----------|-------|-------|
| `NEXT_PUBLIC_UMAMI_ID` | Public | ✅ Yes | Browser | Your tracking ID from Umami |
| `NEXT_PUBLIC_UMAMI_ENDPOINT` | Public | ❌ Optional | Browser | Defaults to cloud if not set |
| `NEXT_PUBLIC_UMAMI_EXCLUDE_DOMAINS` | Public | ❌ Optional | Browser | Comma-separated domains to exclude |

## Security Best Practices

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Use environment variables in Vercel for all secrets
- Use Preview/Production/Development scopes appropriately
- Rotate keys regularly (if applicable)

❌ **DON'T:**
- Commit `.env.local` to git
- Share Vercel environment variable values in chat/code
- Use hardcoded API keys in source code
- Mix production and development credentials

## Self-Hosted Umami (Advanced)

If you're self-hosting Umami instead of using the cloud:

1. **Deploy Umami** (Docker):
   ```bash
   docker run -d \
     --name umami \
     -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@db:5432/umami" \
     ghcr.io/umami-software/umami:latest
   ```

2. **Set Vercel environment variable**:
   - `NEXT_PUBLIC_UMAMI_ENDPOINT=https://your-umami-domain.com`

3. **Ensure CORS is enabled** in your Umami deployment

## Next Steps

1. Deploy to Vercel using the steps above
2. Add tracking calls using [ANALYTICS_EXAMPLES.md](ANALYTICS_EXAMPLES.md)
3. Monitor analytics in Umami dashboard
4. Create custom reports based on business metrics

---

**Questions?** See [UMAMI_SETUP.md](UMAMI_SETUP.md) or [ANALYTICS_EXAMPLES.md](ANALYTICS_EXAMPLES.md)
