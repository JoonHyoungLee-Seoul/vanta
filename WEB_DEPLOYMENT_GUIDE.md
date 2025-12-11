# Web Deployment Guide - vanta.lautrec.kr

This guide explains how to deploy the Vanta Party web app to **vanta.lautrec.kr**.

---

## 🚀 Quick Start Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest and most popular option for React/Vite apps with excellent performance.

#### Step 1: Prepare Repository

Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

#### Step 2: Deploy to Vercel

**Method A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `myapp-frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
5. **Environment Variables**:
   - Add: `VITE_API_URL` = `https://vanta-production-9f79.up.railway.app`
6. Click **"Deploy"**

**Method B: Via Vercel CLI**

```bash
cd myapp-frontend
npm install -g vercel
vercel login
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? (select your account)
- Link to existing project? **No**
- Project name: `vanta-party` (or any name)
- Directory: `./`
- Override settings? **No**

#### Step 3: Configure Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `vanta.lautrec.kr`
4. Vercel will show DNS configuration:
   - **Type**: `CNAME`
   - **Name**: `vanta`
   - **Value**: `cname.vercel-dns.com` (or similar)

#### Step 4: Update DNS

Go to your domain registrar (where you manage lautrec.kr):

1. Add a **CNAME** record:
   - **Name/Host**: `vanta`
   - **Value/Target**: `cname.vercel-dns.com` (use the exact value from Vercel)
   - **TTL**: 3600 (or default)

2. Wait for DNS propagation (5-60 minutes)

3. Vercel will automatically provision SSL certificate (HTTPS)

#### Step 5: Verify

Visit `https://vanta.lautrec.kr` - your app should be live!

---

### Option 2: Netlify

Netlify is another excellent option with similar features.

#### Step 1: Deploy to Netlify

**Method A: Via Netlify Dashboard**

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository
4. Configure build:
   - **Base directory**: `myapp-frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `myapp-frontend/dist`
5. **Environment Variables**:
   - Add: `VITE_API_URL` = `https://vanta-production-9f79.up.railway.app`
6. Click **"Deploy site"**

**Method B: Via Netlify CLI**

```bash
cd myapp-frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

#### Step 2: Configure Custom Domain

1. In Netlify Dashboard → Your Site → **Domain settings**
2. Click **"Add custom domain"**
3. Enter: `vanta.lautrec.kr`
4. Netlify will show DNS configuration:
   - **Type**: `CNAME` or `A` record
   - Follow Netlify's instructions

#### Step 3: Update DNS

Add the DNS record as shown in Netlify dashboard.

---

### Option 3: Cloudflare Pages

Cloudflare Pages offers excellent performance and is free.

#### Step 1: Deploy to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages**
2. Click **"Create a project"**
3. Connect your Git repository
4. Configure build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `myapp-frontend`
5. **Environment Variables**:
   - Add: `VITE_API_URL` = `https://vanta-production-9f79.up.railway.app`
6. Click **"Save and Deploy"**

#### Step 2: Configure Custom Domain

1. In Cloudflare Pages → Your Project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter: `vanta.lautrec.kr`
4. Cloudflare will automatically configure DNS if your domain is on Cloudflare

---

## 🔧 Manual Deployment (VPS/Server)

If you have your own server or VPS:

### Step 1: Build the App

```bash
cd myapp-frontend
npm install
npm run build
```

### Step 2: Upload to Server

Upload the `dist/` folder to your server (via SCP, FTP, etc.)

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/vanta.lautrec.kr`:

```nginx
server {
    listen 80;
    server_name vanta.lautrec.kr;

    root /path/to/myapp-frontend/dist;
    index index.html;

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Step 4: Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/vanta.lautrec.kr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vanta.lautrec.kr
```

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] Backend is deployed and accessible at `https://vanta-production-9f79.up.railway.app`
- [ ] Environment variable `VITE_API_URL` is set correctly
- [ ] App builds successfully: `npm run build`
- [ ] Test the build locally: `npm run preview`
- [ ] All API endpoints are working
- [ ] CORS is configured on backend to allow `vanta.lautrec.kr`

---

## 🔐 Backend CORS Configuration

Make sure your backend allows requests from your domain. Update backend `.env`:

```bash
ALLOWED_ORIGINS=https://vanta.lautrec.kr,https://vanta-production-9f79.up.railway.app
```

Or if using Railway, add this environment variable in Railway dashboard.

---

## 🌐 DNS Configuration Summary

For **vanta.lautrec.kr**, you need to add:

### Vercel:
```
Type: CNAME
Name: vanta
Value: cname.vercel-dns.com (or value shown in Vercel)
```

### Netlify:
```
Type: CNAME
Name: vanta
Value: your-site.netlify.app (or value shown in Netlify)
```

### Cloudflare Pages:
```
Type: CNAME
Name: vanta
Value: your-project.pages.dev (or value shown in Cloudflare)
```

### Manual Server:
```
Type: A
Name: vanta
Value: YOUR_SERVER_IP
```

---

## ✅ Post-Deployment Verification

After deployment:

1. **Check HTTPS**: Visit `https://vanta.lautrec.kr` (should redirect from HTTP)
2. **Test API Connection**: Open browser console, check for API errors
3. **Test Login**: Try logging in to verify backend connection
4. **Check Routes**: Navigate through different pages to ensure routing works
5. **Mobile Test**: Test on mobile device to ensure responsive design works

---

## 🔄 Continuous Deployment

All platforms (Vercel, Netlify, Cloudflare) support automatic deployments:

- **Push to main/master branch** → Automatic production deployment
- **Push to other branches** → Preview deployment

No manual deployment needed after initial setup!

---

## 🆘 Troubleshooting

### DNS Not Working

- Wait 24-48 hours for DNS propagation
- Use [dnschecker.org](https://dnschecker.org) to check DNS propagation globally
- Verify DNS record is correct in your domain registrar

### SSL Certificate Issues

- Vercel/Netlify/Cloudflare automatically provision SSL - wait a few minutes
- For manual setup, ensure certbot ran successfully

### App Shows Blank Page

- Check browser console for errors
- Verify `VITE_API_URL` environment variable is set
- Check that `dist/index.html` exists and has content
- Verify routing configuration (SPA routing)

### API Connection Errors

- Verify backend CORS allows `vanta.lautrec.kr`
- Check backend is running and accessible
- Verify `VITE_API_URL` is correct in deployment platform

### 404 on Routes

- Ensure SPA routing is configured (all routes → index.html)
- Check `vercel.json` or `netlify.toml` has redirects configured

---

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Cloudflare Pages**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)

---

## 🎯 Recommended: Vercel

For this project, **Vercel is recommended** because:
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier is generous
- ✅ Easy custom domain setup
- ✅ Automatic deployments from Git

**Estimated setup time: 10-15 minutes**

