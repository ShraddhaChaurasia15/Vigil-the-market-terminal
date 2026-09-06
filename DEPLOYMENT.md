# Live Online Deployment Guide: Vigil (NSE / BSE Edition)

This guide walks you through deploying **Vigil** to the cloud so you can share a live public URL (e.g. `https://vigil-nse.onrender.com`) with evaluators and judges.

Because Vigil utilizes a **Single-Service Architecture** (the Node.js Express backend directly serves both the REST API and the production React frontend), **you only need to deploy ONE web service**.

---

## Option 1: Deploy on Render.com (Free, Recommended)

Render provides free cloud hosting with automatic SSL (`https://`), continuous deployment from GitHub, and zero configuration.

### Step 1: Push Project to GitHub
In your local project directory:
```bash
git init
git add .
git commit -m "feat: initial commit for Vigil NSE terminal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vigil-nse.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to [https://render.com](https://render.com) and log in (or sign up with GitHub).
2. Click **New +** in the top navigation and select **Web Service**.
3. Connect your GitHub repository (`vigil-nse`).
4. Configure the service:
   - **Name**: `vigil-nse` (or your preferred name)
   - **Language / Runtime**: `Node`
   - **Region**: Any (e.g., `Singapore` for lowest latency to India, or `Oregon`)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.

Render will install dependencies, build the React frontend, compile the TypeScript server, and start the app. Within 2 to 3 minutes, your live terminal will be accessible at:
```
https://vigil-nse.onrender.com
```

---

## Option 2: Deploy on Railway (1-Click)

1. Go to [https://railway.app](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
2. Select your repository.
3. Railway automatically detects the root `package.json` and runs `npm run build` and `npm start`.
4. In **Settings** -> **Networking**, click **Generate Domain** to get a public URL like `https://vigil-production.up.railway.app`.

---

## Option 3: Universal Docker Container Deployment

If deploying to AWS ECS, DigitalOcean App Platform, Fly.io, or any VPS:
```bash
# Build Docker image
docker build -t vigil-terminal .

# Run container locally or on cloud
docker run -d -p 5000:5000 --name vigil vigil-terminal
```
The application will be live at `http://<your-host-ip>:5000`.

---

## Verifying the Live Deployment

Once deployed, verify:
1. Open your live URL (e.g. `https://vigil-nse.onrender.com`).
2. Verify the NIFTY 50 and SENSEX benchmark ticker strip loads.
3. Test the **Time-Machine Scrubber** (`[30m Ago]`, `[2h Ago]`, `[Test Rally]`) to ensure the delta engine dynamically computes price changes across sessions.
4. Click **"Mark as Reviewed"** to ensure checkpoint synchronization works in the cloud.
