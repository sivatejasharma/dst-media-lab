# 🚀 IIS Deployment Guide for Video Merger API & UI

This guide details how to deploy the Video Merger application (Node.js + Express + FFmpeg + UI) on **Windows Server with IIS (Internet Information Services)**.

---

## 🏛️ Architecture Overview

Modern production Node.js deployment on IIS uses **IIS as a Reverse Proxy** via:
1. **Node.js process** running as a background service managed by **PM2** (listening on `localhost:3000`).
2. **IIS Server** listening on port 80/443, using **URL Rewrite & Application Request Routing (ARR)** to proxy incoming web traffic to the Node.js process.

This approach ensures zero `502.5` crashes associated with deprecated `iisnode`, high performance, automatic service restarts on system reboot, and full support for Node.js 20+.

---

## 📋 Prerequisites on Windows Server

1. **Node.js (v20+)** installed on the Windows Server.
2. **FFmpeg & FFprobe** binaries installed and added to System Environment `PATH` (or configured in `.env`).
3. **IIS (Internet Information Services)** enabled with **Web Server (IIS) Role**.
4. **IIS URL Rewrite Module 2.1**:
   - Download: [IIS URL Rewrite Download](https://www.iis.net/downloads/microsoft/url-rewrite)
5. **Application Request Routing (ARR) 3.0**:
   - Download: [ARR Download](https://www.iis.net/downloads/microsoft/application-request-routing)
6. **PM2 Process Manager**:
   ```cmd
   npm install -g pm2 pm2-windows-startup
   ```

---

## 🔧 Step-by-Step Deployment

### Step 1: Enable Proxy in IIS (ARR)
1. Open **IIS Manager** (`inetmgr`).
2. Select the **Server Name** in the left Connections panel.
3. Double-click **Application Request Routing Cache**.
4. In the right actions menu, click **Server Proxy Settings...**.
5. Check **Enable proxy** and click **Apply** in the right panel.

---

### Step 2: Build Application Code
On the server in your project directory (`c:\Users\lahar\source\repos\VideoMerger`):

```cmd
npm install --production=false
npm run build
```
*This compiles TypeScript into JavaScript in the `dist/` directory.*

---

### Step 3: Start Node.js App with PM2
Run PM2 to keep the Node.js application running as a Windows background service:

```cmd
pm2 start ecosystem.config.js
pm2 save
pm2-startup install
```

Verify status:
```cmd
pm2 status
```

---

### Step 4: Configure IIS Web Site
1. Open **IIS Manager**.
2. Right-click **Sites** -> **Add Website...**.
3. Set **Site name**: `VideoMerger`.
4. Set **Physical path**: `c:\Users\lahar\source\repos\VideoMerger`.
5. Set **Binding**: Port 80 (or desired domain/port).
6. Ensure the `web.config` file exists in the root folder (it contains the URL rewrite proxy rule).

---

### Step 5: Verify Permissions & Upload Limits
1. Ensure `IIS_IUSRS` group has **Read & Write** permissions on the `uploads/` directory.
2. The `web.config` is pre-configured with `<requestLimits maxAllowedContentLength="209715200" />` to allow up to 200MB video payloads.

---

## 🔍 Verification

1. Open your browser and navigate to `http://localhost` (or server IP/domain).
2. The **Lahari Video Merger UI** will load.
3. Status badge at top right should show **FFmpeg System Ready** (green dot).
4. Upload 2 short clips to test full merge & video player download.

---

## 🛠️ Management Commands

| Action | Command |
|--------|---------|
| View logs | `pm2 logs video-merger-api` |
| Restart app | `pm2 restart video-merger-api` |
| Stop app | `pm2 stop video-merger-api` |
| Check status | `pm2 status` |
