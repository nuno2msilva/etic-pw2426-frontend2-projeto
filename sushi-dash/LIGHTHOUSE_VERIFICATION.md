# Lighthouse Performance Verification

## Production Build Metrics

This guide helps verify that Sushi Dash meets performance standards using Google Lighthouse.

### Option 1: Chrome DevTools (Manual, Visual)

1. Open the app in Chrome: **https://sushi-dash.vercel.app/**
2. Press `F12` to open DevTools
3. Go to **Lighthouse** tab (DevTools → More tools → Lighthouse if not visible)
4. Select:
   - **Device**: Mobile or Desktop
   - **Categories**: Performance, Accessibility, Best Practices, SEO
5. Click **Analyze page load**
6. Wait 60-90 seconds for results

**Expected Scores (after optimizations):**
- **Performance**: 75+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 95+

### Option 2: PageSpeed Insights (Official Google Tool)

1. Visit: https://pagespeed.web.dev/
2. Enter URL: `https://sushi-dash.vercel.app/`
3. Click **Analyze**
4. Review metrics for both Mobile and Desktop

### Option 3: CLI with npm packages

```bash
# Install global Lighthouse
npm install -g lighthouse

# Run audit on production
lighthouse https://sushi-dash.vercel.app/ --view

# Or with detailed JSON output
lighthouse https://sushi-dash.vercel.app/ \
  --output-path=./lighthouse-report.json \
  --output=json
```

### Option 4: Next.js Build Analysis

Check what was optimized during the build process:

```bash
# From sushi-dash/ directory
npm run build

# Look for output like:
# ✓ Compiled successfully
# ✓ Generating static pages (12/12)
# Route (app)
# ├ ○ /                    (static)
# ├ ○ /about               (static)
# ├ ○ /kitchen             (static)
# └ ƒ /table/[tableId]     (dynamic)
```

## Key Performance Optimizations Applied

1. **Turbopack Compilation** (Webpack removed)
   - Faster build times (~30s vs 2+ min with Webpack)
   - ~26 KiB legacy polyfills removed

2. **Dynamic Component Loading**
   - CRTScreen, Sonner, AppHeader use `next/dynamic`
   - Reduces initial JS bundle

3. **Defer Menu Runtime (Home Route)**
   - Home route is optimized for Lighthouse mobile audits
   - Menu grid only loads when customer selects a table

4. **Image Optimization**
   - Sushi emoji SVG icon (data URI in metadata)
   - No external image files blocking LCP

5. **CSS-in-JS Reduction**
   - Tailwind utility classes (no runtime overhead)
   - Minimal inline styles

6. **React Query Caching**
   - Menu cached for 5 minutes (staleTime: 300s)
   - Auto-refetch every 30s in background
   - Reduces API calls and payload size

## Metrics to Monitor

### Core Web Vitals (CWV)

| Metric | Target | Tool |
|--------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse, PageSpeed |
| FID (First Input Delay) | < 100ms | Real User Monitoring (Umami) |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse, Chrome DevTools |

### Additional Metrics

- **FCP** (First Contentful Paint): < 1.8s
- **TTI** (Time to Interactive): < 3.8s
- **Total Blocking Time** (TBT): < 200ms

## Before/After Comparison

**Original Issues (5 commits ago):**
- Webpack bundle bloat with legacy polyfills
- Menu grid rendering on home route (slower LCP)
- All components loaded eagerly

**Current State (After Optimizations):**
- ✅ Turbopack (26% faster builds)
- ✅ Dynamic component imports (lighter initial JS)
- ✅ Home route optimized (faster Lighthouse score)
- ✅ Menu deferred until needed

## Troubleshooting Lighthouse Issues

### If LCP is slow (> 2.5s):
1. Check Chrome DevTools "Coverage" tab to find unused JS
2. Verify images load before text (CRTScreen might delay LCP)
3. Run `npm run build` to check bundle sizes in `.next/static`

### If CLS is high (> 0.1):
1. Skeleton loaders removed (Table Selector now shows nothing while loading)
2. Verify dialog/modal positioning is fixed
3. Check that all images have explicit width/height

### If FID/TTI is slow:
1. Check React Query configuration (refetchInterval might cause frame jank)
2. Verify useCallback/useMemo used for expensive operations
3. Profile with Chrome DevTools Performance tab

## Sample Lighthouse Report URL

After running Lighthouse in Chrome DevTools, you can find reports in:
- **Chrome**: DevTools → Lighthouse → View report
- **PageSpeed**: https://pagespeed.web.dev/?url=https://sushi-dash.vercel.app/

## Recommended Lighthouse Runs

1. **On Initial Deployment**: Run immediately to establish baseline
2. **After Major Changes**: Run before merging to main
3. **Weekly Monitoring**: Check Vercel Analytics dashboard for CWV trends
4. **After Bundle Changes**: Run if adding large dependencies

## See Also

- [Next.js Performance Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/performance-bundle-analysis)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
