# StoreFlow POS — Free Cloud Deployment Guide

A step-by-step, click-by-click guide to deploy the entire StoreFlow Point of Sale system on 100% free cloud tiers:
- **Database**: MongoDB Atlas (Free M0 Sandbox)
- **Backend**: Render (Free Web Service)
- **Frontend**: Vercel (Free Hobby Plan for SPAs)

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Vercel (Frontend SPA)       │
│  https://your-storeflow.vercel.app │
└────────────────┬────────────────┘
                 │ API calls (VITE_API_URL)
                 ▼
┌─────────────────────────────────┐
│     Render (Node.js API)        │
│  https://storeflow-api.onrender.com│
└────────────────┬────────────────┘
                 │ MONGODB_URI (mongodb+srv://)
                 ▼
┌─────────────────────────────────┐
│     MongoDB Atlas (Cluster0)    │
│  Database: storeflow (Free M0)  │
└─────────────────────────────────┘
```

---

## Step 1: Set Up Free MongoDB Atlas Database

1. **Sign Up / Log In**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. **Create a Free Cluster**:
   - Click **Create Deployment** → Select **M0 Free** (Shared).
   - Provider: **AWS**, Region: closest to you (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
   - Cluster Name: `Cluster0`.
   - Click **Create**.
3. **Create Database User**:
   - Go to **Security** → **Database Access** → Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: e.g. `storeflow_admin`.
   - Password: Click **Autogenerate Secure Password** (or choose a strong password without `@`, `:`, or `/`). Save this password!
   - Built-in Role: **Read and write to any database** (`readWriteAnyDatabase`).
   - Click **Add User**.
4. **Configure Network Access (Whitelist IP)**:
   - Go to **Security** → **Network Access** → Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm** (Render free dynos use dynamic outgoing IP addresses).
5. **Get Connection String**:
   - Go to **Deployment** → **Database** → Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the SRV connection string:
     ```
     mongodb+srv://storeflow_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **Crucial**: Insert `/storeflow` right before the `?` query parameter:
     ```
     mongodb+srv://storeflow_admin:<password>@cluster0.xxxxx.mongodb.net/storeflow?retryWrites=true&w=majority
     ```

---

## Step 2: Deploy Backend Web Service on Render

1. **Create Render Account**:
   - Go to [Render.com](https://render.com) and sign in using your GitHub account.
2. **Option A — Using Blueprint (`render.yaml`) (Fastest)**:
   - In Render Dashboard, click **New +** → **Blueprint**.
   - Connect your `pos-system` GitHub repository.
   - Render automatically detects `render.yaml`.
   - Fill in the prompted environment variables (see table below).
   - Click **Apply**.

3. **Option B — Manual Setup**:
   - Click **New +** → **Web Service**.
   - Connect your `pos-system` repository.
   - Configure the settings:
     | Field | Value |
     |---|---|
     | **Name** | `storeflow-api` |
     | **Region** | `Singapore` |
     | **Branch** | `main` |
     | **Root Directory** | `server` |
     | **Runtime** | `Node` |
     | **Build Command** | `npm install` |
     | **Start Command** | `npm start` |
     | **Plan Type** | `Free` |
     | **Health Check Path**| `/api/health` |

4. **Add Backend Environment Variables** (under **Environment** tab):
   | Variable Name | Required | Example / Description |
   |---|---|---|
   | `NODE_ENV` | Yes | `production` |
   | `NODE_VERSION` | Yes | `20` |
   | `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/storeflow?retryWrites=true&w=majority` |
   | `JWT_SECRET` | Yes | A random 32+ character string (or let Render generate it) |
   | `JWT_EXPIRES_IN` | Yes | `7d` |
   | `CLIENT_URL` | Yes | Your Vercel frontend URL (e.g. `https://your-storeflow.vercel.app`) |
   | `CORS_ORIGINS` | Yes | Comma-separated allowed origins (e.g. `https://your-storeflow.vercel.app`) |
   | `ALLOW_VERCEL_PREVIEWS` | Yes | `true` |
   | `SEED_PLATFORM_ADMIN_PASSWORD` | Yes | Min 8 chars (e.g. `Admin@12345`) |
   | `SEED_STORE_ADMIN_PASSWORD` | Yes | Min 8 chars (e.g. `Store@12345`) |
   | `SEED_CASHIER_PASSWORD` | Yes | Min 8 chars (e.g. `Cashier@12345`) |

5. **Deploy & Verify**:
   - Click **Create Web Service** (or **Deploy Latest Commit**).
   - Wait 1-2 minutes for the build to finish.
   - Once live, visit: `https://storeflow-api.onrender.com/api/health` in your browser.
   - You should see:
     ```json
     {"status":"ok","database":"connected","reason":null}
     ```
   - Copy your Render backend URL (e.g. `https://storeflow-api.onrender.com`).

---

## Step 3: Deploy Frontend SPA on Vercel

1. **Sign Up / Log In**:
   - Go to [Vercel.com](https://vercel.com) and log in with your GitHub account.
2. **Import Repository**:
   - Click **Add New...** → **Project**.
   - Select your `pos-system` GitHub repository.
3. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `client`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variable**:
   - Under **Environment Variables**, add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://storeflow-api.onrender.com/api` (use your actual Render backend URL followed by `/api`).
5. **Deploy**:
   - Click **Deploy**.
   - Vercel builds the SPA in ~20 seconds and gives you a live production URL (e.g. `https://storeflow-pos.vercel.app`).

---

## Step 4: Finalize CORS on Render

Now that you have your final Vercel URL:
1. In the **Render Dashboard**, open your `storeflow-api` service → **Environment**.
2. Set:
   - `CLIENT_URL` = `https://your-actual-app.vercel.app`
   - `CORS_ORIGINS` = `https://your-actual-app.vercel.app`
3. Click **Save Changes** (Render will auto-redeploy with the new CORS settings in 30 seconds).

---

## Demo Accounts Ready on First Deploy

When the database is first initialized, StoreFlow automatically seeds the initial supermarket ecosystem:

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Platform Super Admin** | `sharmila0774@gmail.com` | Value in `SEED_PLATFORM_ADMIN_PASSWORD` (e.g. `Admin@12345`) | `/platform-admin` (KPIs, Store Approvals, Audits) |
| **Store Admin / Owner** | `ramstore@gmail.com` | Value in `SEED_STORE_ADMIN_PASSWORD` (e.g. `Store@12345`) | `/dashboard`, `/inventory`, `/products` |
| **Cashier Staff** | `User2@gmail.com` | Value in `SEED_CASHIER_PASSWORD` (e.g. `Cashier@12345`) | `/pos` (Barcode billing, live checkout) |

*(Quick demo login chips are conveniently clickable on the `/login` page).*

---

## Optional: Keep Render Server Awake for Free (UptimeRobot)

Render's free tier spins down after 15 minutes of inactivity. To keep your server instantly responsive 24/7 without delays:
1. Create a free account at [UptimeRobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `StoreFlow API Keep-Alive`
   - **URL / IP**: `https://storeflow-api.onrender.com/api/health`
   - **Monitoring Interval**: Every `5 minutes`
3. Click **Create Monitor**.
4. UptimeRobot will ping your health endpoint every 5 minutes, preventing Render from ever falling asleep!

---

## Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **CORS Error in Browser Console** | `CLIENT_URL` on Render doesn't match your Vercel URL | In Render Settings → Environment, ensure `CLIENT_URL` is set to your exact `https://*.vercel.app` domain (no trailing slash). |
| **Atlas Database Disconnected (IP Not Allowed)** | MongoDB Atlas Network Access is not `0.0.0.0/0` | In Atlas → Security → Network Access, add `0.0.0.0/0` (Allow access from anywhere). |
| **502 Bad Gateway on Render** | Server crash on startup (e.g. missing `JWT_SECRET` or `MONGODB_URI`) | Open Render → **Logs**. Check the printed message. Ensure `JWT_SECRET` has at least 32 characters and `MONGODB_URI` starts with `mongodb+srv://`. |
| **Blank Page on Refreshing `/pos` or `/products` on Vercel** | Missing SPA rewrite rule | Ensure `client/vercel.json` exists in git with the SPA rewrite to `/index.html` (already included). |
| **Uploaded Product Images Missing After Restart** | Images stored on ephemeral disk | StoreFlow now stores uploaded image buffers directly inside MongoDB (`ProductImage` collection) and serves them via `/api/images/:id`. Images persist permanently across dyno restarts. |
| **"Server is waking up..." notice on login** | Render free tier was sleeping | Normal on the first visit after inactivity. The built-in cold start monitor will automatically retry and log you in once ready (~45s), or use UptimeRobot above to prevent sleeping. |
