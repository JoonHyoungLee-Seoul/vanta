# Fixing Vercel Deployment - Root Directory Issue

## Problem

Vercel is trying to build from the repository root, but your frontend is in the `myapp-frontend/` subdirectory. This causes build failures because:
- Vercel can't find `package.json` at the root
- Build commands fail
- Output directory is incorrect

## Solution

I've created a root-level `vercel.json` that tells Vercel to:
1. Use `myapp-frontend` as the root directory
2. Run build commands from that directory
3. Output to `myapp-frontend/dist`

## Steps to Fix in Vercel Dashboard

### Option 1: Update Project Settings (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`vantawj` or similar)
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Click **Edit**
6. Select **Other** and enter: `myapp-frontend`
7. Click **Save**

### Option 2: Use Root vercel.json (Already Created)

The root-level `vercel.json` I created should automatically configure this, but you may need to:

1. **Redeploy** the project:
   - Go to Vercel Dashboard → Your Project
   - Click **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

2. **Or push the new vercel.json**:
   ```bash
   git add vercel.json
   git commit -m "Add root vercel.json to configure frontend directory"
   git push origin main
   ```
   Vercel will automatically redeploy.

## Verify Configuration

After updating, check:

1. **Build Logs** in Vercel Dashboard:
   - Should show: `cd myapp-frontend && npm install`
   - Should show: `cd myapp-frontend && npm run build`
   - Should find `package.json` in `myapp-frontend/`

2. **Environment Variables**:
   - Make sure `VITE_API_URL` is set to: `https://vanta-production-9f79.up.railway.app`
   - Go to **Settings** → **Environment Variables**

3. **Build Output**:
   - Should output to `myapp-frontend/dist`
   - Check **Deployments** → **Build Logs** for confirmation

## Common Issues After Fix

### Still Getting Build Errors?

1. **Check Root Directory Setting**:
   - Vercel Dashboard → Settings → General → Root Directory
   - Should be: `myapp-frontend`

2. **Check Environment Variables**:
   - Make sure `VITE_API_URL` is set correctly
   - Should be: `https://vanta-production-9f79.up.railway.app`

3. **Check Build Command**:
   - Should be: `npm run build` (runs from `myapp-frontend/`)

4. **Check Output Directory**:
   - Should be: `dist` (relative to `myapp-frontend/`)

### Build Succeeds But App Shows Blank Page?

1. **Check Browser Console** for errors
2. **Verify API URL** is correct in environment variables
3. **Check CORS** - backend must allow `https://vantawj.vercel.app`
4. **Check Network Tab** - see if API requests are failing

## Quick Fix Checklist

- [ ] Root Directory set to `myapp-frontend` in Vercel Dashboard
- [ ] Environment Variable `VITE_API_URL` set to production backend URL
- [ ] Root `vercel.json` file exists (already created)
- [ ] Redeployed after changes
- [ ] Build logs show correct directory
- [ ] Backend CORS includes Vercel domain

## After Fixing

Once fixed, your deployment should:
- ✅ Build successfully
- ✅ Show the app at `https://vantawj.vercel.app`
- ✅ Connect to backend API
- ✅ Work without errors

If issues persist, check the **Build Logs** in Vercel Dashboard for specific error messages.

