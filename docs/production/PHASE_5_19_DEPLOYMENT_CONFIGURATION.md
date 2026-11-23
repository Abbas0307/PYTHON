# MINDORA 2.0 — PHASE 5.19 DEPLOYMENT CONFIGURATION
# CLOUD HOSTING BLUEPRINTS FOR VERCEL, RENDER & PERSISTENT DISKS

**Principal Auditor:** Cloud Deployment Engineer & DevSecOps Specialist  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This document specifies the deployment infrastructure, environment parameters, build commands, and service blueprints required to deploy Mindora 2.0 to cloud hosting platforms. The target architecture pairs a **Vercel** CDN deployment for the React/TypeScript frontend with a **Render** managed container service for the FastAPI backend and persistent SQLite disk.

---

## 2. Target Cloud Architecture

```
                                  HTTPS
     [ Student Browser ] ---------------------> [ Vercel Edge CDN ]
              |                                 (React 18 / Vite SPA)
              |
              | API Requests (HTTPS / Bearer Token)
              v
     [ Render Web Service ] ------------------> [ Persistent Disk Volume ]
    (FastAPI / Python 3.12+)                     (/var/data/mindora_auth.db)
              |
              v
     [ Serialized ML Models ]
     (models/best_model.pkl)
```

---

## 3. Backend Deployment Blueprint: Render (`render.yaml`)

```yaml
services:
  - type: web
    name: mindora-api
    runtime: python
    plan: starter # Starter plan required for persistent disk mount
    buildCommand: pip install -r requirements-production.txt
    startCommand: uvicorn local_companion.service:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /ready
    disk:
      name: mindora-db-volume
      mountPath: /var/data
      sizeGB: 1
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.0
      - key: MINDORA_ENV
        value: production
      - key: MINDORA_HOST
        value: 0.0.0.0
      - key: MINDORA_DB_PATH
        value: /var/data/mindora_auth.db
      - key: MINDORA_SECRET_KEY
        generateValue: true
      - key: MINDORA_ALLOWED_ORIGINS
        sync: false # Set to https://your-app.vercel.app in Render Dashboard
      - key: MINDORA_DOCS_ENABLED
        value: false
```

### Critical Render Provisioning Notes:
1. **Persistent Disk Requirement:** Do NOT deploy on the Render Free instance tier if persistence is needed. The Free tier lacks persistent disk support; container restarts or spin-downs would erase the SQLite database (`mindora_auth.db`), destroying student registrations and guardian consent records.
2. **In-Flight Port Mapping:** Uvicorn binds to `$PORT` passed automatically by Render.

---

## 4. Frontend Deployment Blueprint: Vercel (`frontend/vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Vercel Dashboard Environment Configuration:
- `VITE_API_URL`: Set to the deployed Render backend URL (e.g. `https://mindora-api.onrender.com`).
- Root Directory: `frontend`

---

## 5. Step-by-Step Production Deployment Procedure

### Stage 1: Deploy Backend to Render
1. Connect Git repository to Render.
2. Select "New Blueprint Instance" or "Web Service" using `render.yaml`.
3. Verify persistent disk volume is mounted at `/var/data`.
4. Copy the assigned backend public URL (e.g. `https://mindora-api.onrender.com`).
5. Verify health probe at `https://mindora-api.onrender.com/ready`.

### Stage 2: Deploy Frontend to Vercel
1. Import repository into Vercel.
2. Set Root Directory to `frontend`.
3. Add Environment Variable: `VITE_API_URL=https://mindora-api.onrender.com`.
4. Deploy and note the public URL (e.g. `https://mindora.vercel.app`).

### Stage 3: Close the CORS Loop
1. Navigate back to Render Dashboard -> Environment Variables.
2. Update `MINDORA_ALLOWED_ORIGINS` to `https://mindora.vercel.app`.
3. Trigger a configuration reload on Render.
4. Verify student registration and login from `https://mindora.vercel.app`.

---

## 6. Audit Verdict

**Status:** **`READY FOR DEPLOYMENT CONFIGURATION`**  
Infrastructure descriptors, environment parameters, and deployment steps are fully documented and verified.
