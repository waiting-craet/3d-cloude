# Console Errors Fix - Developer Guide

This document explains the console errors that may appear during development and how to resolve them.

## Overview

During development, you may encounter several types of console errors. This guide explains each error type, its root cause, and how to resolve it.

## Error Types and Solutions

### 1. 404 Error: "main.7ee886d8.js" (Stale Build Cache)

**Error Message:**
```
GET http://localhost:3000/_next/static/chunks/main.7ee886d8.js 404 (Not Found)
```

**Root Cause:**
This error occurs when your browser or build cache contains references to old hashed JavaScript files that no longer exist after a rebuild.

**Solution:**
Clear the build cache using the provided npm script (works on all platforms):

```bash
npm run clean
```

This command removes:
- `.next/` directory (Next.js build cache)
- `node_modules/.cache/` directory (webpack/babel cache)

The clean script uses Node.js to ensure cross-platform compatibility (Windows, macOS, Linux).

After running the clean command, restart your development server:

```bash
npm run dev
```

**When to Use:**
- After pulling new code from git
- When you see 404 errors for hashed JavaScript files
- When experiencing strange build behavior
- After switching branches

---

### 2. 404 Error: "hybridaction/zybTrackerStatisticsAction" (External Script)

**Error Message:**
```
GET http://localhost:3000/hybridaction/zybTrackerStatisticsAction 404 (Not Found)
```

**Root Cause:**
This error is **NOT caused by your code**. It's caused by external interference, most commonly:
- Browser extensions (ad blockers, privacy tools, tracking blockers)
- Corporate network proxies
- Antivirus software with web protection

**Solution:**
This is an **environmental issue**, not a code bug. You can safely ignore this error, or:

1. **Test in incognito/private browsing mode** (extensions are usually disabled)
2. **Disable browser extensions** one by one to identify the culprit
3. **Check your browser extensions** for anything related to tracking, analytics, or privacy

**Common Culprits:**
- Privacy Badger
- uBlock Origin
- Ghostery
- Corporate security extensions

**Note:** This error does not affect application functionality and can be safely ignored during development.

---

### 3. HMR Error: "Cannot read properties of null (reading 'removeChild')" (CSS Module Hot Reload)

**Error Message:**
```
Uncaught TypeError: Cannot read properties of null (reading 'removeChild')
```

**Root Cause:**
This error occurs during Hot Module Replacement (HMR) when CSS modules are updated. It's a race condition between React Fast Refresh and CSS hot reload where the HMR system tries to remove a DOM node that has already been removed.

**Solution:**
This error has been mitigated by enhancing the Next.js configuration with:
- Better webpack optimization settings for HMR
- Improved CSS module handling with error boundaries
- React Strict Mode for better error detection

**What We Did:**
1. Added webpack configuration to prevent aggressive module removal
2. Added error handling for style injection
3. Enabled React Strict Mode
4. Configured better HMR settings

**Note:** This is a development-only issue and does not affect production builds.

---

## Next.js Configuration Enhancements

The `next.config.js` file has been enhanced with the following improvements:

### 1. React Strict Mode
```javascript
reactStrictMode: true
```
Enables better error detection and warnings during development.

### 2. Webpack Optimization
```javascript
webpack: (config, { dev, isServer }) => {
  if (dev && !isServer) {
    config.optimization = {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    }
  }
  return config
}
```
Prevents aggressive module removal during HMR, reducing race conditions.

### 3. CSS Module Error Handling
Custom style loader configuration with error handling to prevent removeChild errors.

### 4. Build Optimization
```javascript
swcMinify: true
```
Uses SWC for faster minification in production builds.

### 5. Better Error Reporting
```javascript
onDemandEntries: {
  maxInactiveAge: 25 * 1000,
  pagesBufferLength: 2,
}
```
Improves development experience with better error reporting.

---

## Best Practices

### Regular Cache Clearing

Run the clean command regularly to prevent stale cache issues:

```bash
npm run clean && npm run dev
```

### Browser Extension Management

For the best development experience:
1. Use a separate browser profile for development
2. Disable unnecessary extensions in your development profile
3. Test in incognito mode when debugging strange issues

### HMR Best Practices

To minimize HMR errors:
1. Make small, incremental changes
2. Wait for HMR to complete before making the next change
3. If HMR gets stuck, manually refresh the page
4. Use `npm run clean` if HMR behavior becomes erratic

---

## Troubleshooting

### Still Seeing Errors After Fixes?

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard reload:**
   - Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)

3. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run clean
   npm run dev
   ```

4. **Check for conflicting processes:**
   - Ensure no other Next.js dev servers are running
   - Check that port 3000 is not in use by another application

### Getting Help

If you continue to experience issues:
1. Document the exact error message
2. Note when the error occurs (on load, during HMR, etc.)
3. Check if the error occurs in incognito mode
4. List any browser extensions you have enabled
5. Share your findings with the team

---

## Summary

- **Stale cache errors** → Run `npm run clean`
- **"hybridaction" errors** → Ignore (browser extension issue)
- **HMR removeChild errors** → Fixed by Next.js config enhancements
- **General issues** → Clear browser cache and hard reload

The fixes implemented in this project address the root causes of these errors and provide tools for developers to maintain a clean development environment.
