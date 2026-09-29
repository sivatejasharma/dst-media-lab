# 🌐 Deploying Lahari Media Suite to the Internet

This guide clarifies the role of **OpenRouter** and provides step-by-step instructions to deploy your video processing suite publicly to the internet.

---

## 🤖 OpenRouter vs. Web Hosting: Understanding the Difference

> **Note**: **OpenRouter is an AI LLM API router** (like OpenAI, Anthropic, or Google Gemini API) used for connecting AI language models. It **cannot** host website files, run Node.js backend servers, or execute FFmpeg video rendering.

To make your website accessible to anyone on the internet, you need a **Web Application Host** or a **Tunnel Service**.

---

## 🛠️ Top 3 Deployment Options for Video Processing

Because your app processes heavy media using **Node.js, FFmpeg, and `yt-dlp`**, it requires a server with disk storage and sufficient CPU time (unlike serverless platforms which time out after 10–60 seconds).

---

### Option 1: Cloudflare Tunnel (Easiest & Free — Turn your Local/IIS Server Public)

If your app is already running on your Windows computer or IIS server, you can use **Cloudflare Tunnel (`cloudflared`)** to securely expose `http://localhost:3000` to a public `https://your-app.trycloudflare.com` or your own custom domain for **FREE**, without changing router settings or opening firewall ports.

#### Steps:
1. Download Cloudflare Tunnel for Windows (`cloudflared.exe`):
   ```cmd
   winget install Cloudflare.cloudflared
   ```
2. Run a quick public tunnel:
   ```cmd
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare will give you a public HTTPS URL (e.g. `https://random-words.trycloudflare.com`) that anyone in the world can access!

---

### Option 2: Railway.app / Render.com (Best Cloud PaaS)

[Railway.app](https://railway.app) and [Render.com](https://render.com) are modern cloud hosting platforms that support Node.js + FFmpeg applications out of the box with zero server maintenance.

#### Steps for Railway:
1. Push your project code to a private **GitHub repository**.
2. Sign up at [Railway.app](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
3. Railway automatically detects `package.json`, installs dependencies, and runs `npm run build` & `npm start`.
4. Add a public domain in Railway settings (e.g., `https://lahari-media-suite.up.railway.app`).

---

### Option 3: Cloud VPS (DigitalOcean / Hetzner / AWS EC2)

For heavy production workloads handling hundreds of 4K video renders per day:

1. Create a Linux VPS (e.g., Ubuntu 24.04 on DigitalOcean or Hetzner for ~$4–$6/month).
2. Install Node.js, FFmpeg, and PM2:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm ffmpeg
   sudo npm install -g pm2
   ```
3. Git clone your repository, run `npm install && npm run build`.
4. Start with PM2: `pm2 start ecosystem.config.js`.
5. Point your domain (e.g. `media.yourdomain.com`) to the VPS IP address using Nginx and free Let's Encrypt SSL (`certbot`).

---

## 📊 Comparison Summary

| Method | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| **Cloudflare Tunnel** | FREE | 2 minutes | Instant public access from your PC/IIS |
| **Railway.app / Render** | $0–$5/mo | 5 minutes | Easy managed cloud deployment from GitHub |
| **Cloud VPS (DigitalOcean)** | $4–$6/mo | 15 minutes | Maximum CPU performance for heavy rendering |
