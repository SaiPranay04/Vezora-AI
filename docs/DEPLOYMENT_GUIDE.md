# 🚀 Vezora AI - Complete Deployment Guide

This guide covers deploying Vezora AI to **Render (Backend + PostgreSQL)** and **Vercel (Frontend)**.

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Render account (free tier available)
- ✅ Vercel account (free tier available)
- ✅ All API keys ready (Groq, Gemini, Google OAuth, etc.)

---

## 🗄️ Part 1: Deploy PostgreSQL Database on Render

### Step 1: Create PostgreSQL Instance

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `vezora-ai-db`
   - **Database**: `vezora_db`
   - **User**: `vezora_user` (auto-generated)
   - **Region**: Choose closest to your target users
   - **Plan**: **Free** (limit: 90 days, then requires upgrade)
4. Click **"Create Database"**

### Step 2: Get Database Connection URL

1. After creation, go to your database's **"Info"** tab
2. Copy the **"External Database URL"**
3. It will look like:
   ```
   postgresql://vezora_user:password@dpg-xyz.oregon-postgres.render.com/vezora_db
   ```
4. **Save this URL** - you'll need it for backend deployment

### Step 3: Run Database Migrations

**Option A: Local Migration (Recommended)**

1. On your local machine, add the Render DATABASE_URL to `backend/.env`:
   ```env
   DATABASE_URL=postgresql://vezora_user:password@dpg-xyz.oregon-postgres.render.com/vezora_db
   ```

2. Run migrations:
   ```bash
   cd backend
   node migrations/runMigrations.js
   ```

3. Verify tables were created successfully

**Option B: Manual Migration via Render Shell**

1. Go to database **"Shell"** tab in Render
2. Manually execute SQL from `backend/migrations/001_create_tables.sql`

---

## 🖥️ Part 2: Deploy Backend to Render

### Step 1: Push Code to GitHub

1. Ensure your code is pushed to a GitHub repository
2. Make sure `.gitignore` excludes `.env`, `node_modules`, etc.

### Step 2: Create Web Service on Render

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vezora-ai-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: **Node**
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `node index.js`
   - **Plan**: **Free**

### Step 3: Add Environment Variables

In the **"Environment"** tab, add all required variables:

```env
# Database
DATABASE_URL=postgresql://vezora_user:password@dpg-xyz.oregon-postgres.render.com/vezora_db

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
ENCRYPTION_KEY=exactly-32-character-key!!!!!

# AI Providers
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
AI_PROVIDER=groq

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://vezora-ai-backend.onrender.com/auth/google/callback

# App Settings
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app

# Optional Features
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=false
ENABLE_FILE_SYSTEM=false
ENABLE_GMAIL=true
ENABLE_GOOGLE_CALENDAR=true
ENABLE_WEB_SEARCH=true
```

### Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI:
   ```
   https://vezora-ai-backend.onrender.com/auth/google/callback
   ```
5. Save changes

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Test health endpoint: `https://vezora-ai-backend.onrender.com/health`

---

## 🌐 Part 3: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

1. Open `src/config/api.ts` (or wherever your API URL is configured)
2. Update to your Render backend URL:
   ```typescript
   export const API_BASE_URL = 'https://vezora-ai-backend.onrender.com';
   ```
3. Commit and push changes

### Step 2: Deploy to Vercel

**Option A: Vercel CLI**

```bash
cd ../  # Go to root directory
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: **Vite**
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables (if any):
   ```env
   VITE_API_URL=https://vezora-ai-backend.onrender.com
   ```
6. Click **"Deploy"**

### Step 3: Update Backend CORS

1. Go back to Render backend environment variables
2. Update `FRONTEND_URL`:
   ```env
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
3. Redeploy backend (automatic after env change)

---

## 🔐 Part 4: Post-Deployment Security Checklist

### ✅ Verify Security Measures

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] `.env` files are in `.gitignore`
- [ ] JWT_SECRET is at least 32 characters
- [ ] ENCRYPTION_KEY is exactly 32 characters
- [ ] PostgreSQL password is strong (auto-generated by Render)
- [ ] HTTPS is enabled (Render + Vercel auto-provide this)
- [ ] Rate limiting is active (check backend logs)
- [ ] Helmet security headers are enabled

### ✅ Test Authentication

1. Visit your Vercel frontend URL
2. Click "Register" and create a test account
3. Verify email/password requirements work
4. Log in and test token-based authentication
5. Try accessing protected routes

### ✅ Test Multi-User Isolation

1. Create 2 different user accounts
2. Log in as User A, create some tasks/memories
3. Log out, log in as User B
4. Verify User B **cannot see** User A's data
5. Create tasks/memories as User B
6. Verify both users have completely isolated data

---

## 📊 Part 5: Monitoring & Maintenance

### Render Free Tier Limits

- **PostgreSQL Free**: 90 days, then $7/month
- **Web Service Free**: 750 hours/month, spins down after 15min inactivity
- **Cold Start**: ~30-60 seconds on first request after spin-down

### Vercel Free Tier Limits

- **Bandwidth**: 100 GB/month
- **Serverless Functions**: 100 GB-hours compute
- **Builds**: 100 hours/month

### Monitoring

**Backend (Render)**
- View logs: Dashboard → Web Service → Logs
- Check metrics: CPU, Memory, Response Time
- Set up email alerts for crashes

**Frontend (Vercel)**
- View deployment logs: Dashboard → Project → Deployments
- Check analytics: Dashboard → Project → Analytics
- Monitor Core Web Vitals

### Database Backups

**Render PostgreSQL**
- Free tier: No automatic backups
- Paid tier: Daily backups included
- Manual backup: Use `pg_dump` from your local machine:
  ```bash
  pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql
  ```

---

## 🚨 Troubleshooting

### Backend Not Starting

1. Check Render logs for errors
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct
4. Test database connection manually

### Database Connection Errors

- Error: "too many connections"
  - Solution: Reduce connection pool size in `backend/config/database.js`
- Error: "password authentication failed"
  - Solution: Regenerate `DATABASE_URL` from Render dashboard

### CORS Errors

- Update `FRONTEND_URL` in backend environment variables
- Verify Vercel deployment URL matches exactly
- Check browser console for specific CORS error

### Authentication Not Working

- Verify JWT_SECRET is set and matches on all backend instances
- Check token expiration (default: 7 days)
- Clear browser cookies/localStorage and try again

### Rate Limiting Too Strict

- Adjust limits in `backend/middleware/rateLimiter.js`
- Redeploy backend after changes

---

## 🎉 Success Checklist

- [ ] Backend deployed and health check returns `200`
- [ ] Frontend deployed and loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Tasks can be created and retrieved
- [ ] Memories can be stored and retrieved
- [ ] Voice chat works (if enabled)
- [ ] Google OAuth works (Gmail/Calendar)
- [ ] Multi-user isolation verified
- [ ] Rate limiting is active
- [ ] Security headers are present (check with browser dev tools)

---

## 📝 Next Steps After Deployment

1. **Set up monitoring**: Use tools like Sentry, LogRocket
2. **Configure custom domain** (Render + Vercel both support this)
3. **Enable automatic deployments** from GitHub
4. **Set up database backups** (manual or paid tier)
5. **Add more API keys** as needed (Elevenlabs, etc.)
6. **Scale up** if free tier limits are reached

---

## 💰 Cost Estimation

| Service | Free Tier | Paid Tier (if needed) |
|---------|-----------|----------------------|
| Render Backend | 750hrs/month | $7/month (Basic) |
| Render PostgreSQL | 90 days free | $7/month (Starter) |
| Vercel Frontend | 100GB bandwidth | $20/month (Pro) |
| **Total** | **~3 months free** | **~$14-34/month** |

---

## 🆘 Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Vezora AI Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

1. **Push to `main` branch** → Automatic production deploy
2. **Push to `dev` branch** → Create preview deployment
3. **Pull requests** → Automatic preview URLs for testing

Configure branch-based deployments in Render/Vercel dashboards.

---

**🎊 Congratulations!** Your Vezora AI is now live and accessible worldwide!
