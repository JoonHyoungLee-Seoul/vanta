# Deploy to vanta.lautrec.kr - Quick Start

**Fastest way to get your app live at vanta.lautrec.kr**

---

## ⚡ 5-Minute Deployment (Vercel)

### Step 1: Update Backend CORS (2 minutes)

1. Go to [Railway Dashboard](https://railway.app) → Your Backend Project
2. **Variables** tab → Find `ALLOWED_ORIGINS`
3. Update to:
   ```
   https://vanta.lautrec.kr,https://vanta-production-9f79.up.railway.app
   ```
4. Save (backend auto-restarts)

### Step 2: Deploy Frontend (3 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign up/Login
2. **Add New Project** → Import your Git repository
3. Configure:
   - **Root Directory**: `myapp-frontend`
   - **Framework**: Vite (auto-detected)
   - **Environment Variable**: 
     - Key: `VITE_API_URL`
     - Value: `https://vanta-production-9f79.up.railway.app`
4. Click **Deploy**

### Step 3: Add Custom Domain (2 minutes)

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `vanta.lautrec.kr`
4. Copy the CNAME value shown (e.g., `cname.vercel-dns.com`)

### Step 4: Update DNS (5-60 minutes)

1. Go to your domain registrar (where you manage lautrec.kr)
2. Add CNAME record:
   - **Name**: `vanta`
   - **Value**: `cname.vercel-dns.com` (use exact value from Vercel)
   - **TTL**: 3600
3. Wait for DNS propagation (5-60 minutes)
4. Vercel automatically provisions SSL certificate

### Step 5: Done! 🎉

Visit `https://vanta.lautrec.kr` - your app is live!

---

## 📋 Files Created

✅ `myapp-frontend/vercel.json` - Vercel configuration
✅ `myapp-frontend/netlify.toml` - Netlify configuration (alternative)
✅ `WEB_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
✅ `BACKEND_CORS_UPDATE.md` - CORS update instructions

---

## 🔄 Alternative Platforms

### Netlify
```bash
cd myapp-frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
- Dashboard → Pages → Create Project
- Connect Git repository
- Build settings: Root = `myapp-frontend`, Output = `dist`

---

## ✅ Verification Checklist

After deployment:

- [ ] Visit `https://vanta.lautrec.kr` - app loads
- [ ] HTTPS is working (green lock icon)
- [ ] Try logging in - API connection works
- [ ] Navigate between pages - routing works
- [ ] Check browser console - no CORS errors
- [ ] Test on mobile device

---

## 🆘 Quick Troubleshooting

**App shows blank page?**
- Check browser console for errors
- Verify `VITE_API_URL` is set in deployment platform

**CORS errors?**
- Update `ALLOWED_ORIGINS` in Railway to include `https://vanta.lautrec.kr`
- Restart backend

**DNS not working?**
- Wait up to 24 hours for propagation
- Check DNS record is correct
- Use [dnschecker.org](https://dnschecker.org) to verify globally

---

## 📚 Full Documentation

- **Detailed Guide**: See `WEB_DEPLOYMENT_GUIDE.md`
- **CORS Setup**: See `BACKEND_CORS_UPDATE.md`
- **Mobile Apps**: See `APP_DISTRIBUTION_GUIDE.md`

---

## 🎯 Recommended: Vercel

**Why Vercel?**
- ✅ Zero configuration
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier
- ✅ Auto-deployments from Git
- ✅ 5-minute setup

**Total time: ~10 minutes** (including DNS propagation wait)

