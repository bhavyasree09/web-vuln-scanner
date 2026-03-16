# 🛡️ Web Vulnerability Scanner

A full-stack security scanning application that detects common web vulnerabilities.

## Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB Community Server (must be running locally on port 27017)

## 🚀 Starting the App

### 1. Start MongoDB (REQUIRED)

If MongoDB isn't already running as a Windows service:
```powershell
net start MongoDB
```
Or if installed manually, open a terminal and run:
```powershell
mongod --dbpath C:\data\db
```
Verify MongoDB Compass can connect to `mongodb://localhost:27017` before starting the backend.

### 2. Start the Backend
```powershell
cd backend
npm run dev
```
You should see: `🚀 Web Vulnerability Scanner API running on http://localhost:5000`
And: `✅ MongoDB Connected: 127.0.0.1`

### 3. Start the Frontend
Open a **new terminal**:
```powershell
cd frontend
npm run dev
```
Open http://localhost:5173 in your browser.

### 4. Install Python Scanner Dependencies (first time only)
```powershell
cd scanner
pip install -r requirements.txt
```

## 📁 Project Structure

```
web-vul-scan/
├── backend/          # Node.js + Express REST API (port 5000)
│   ├── src/
│   │   ├── index.js          # App entry point
│   │   ├── db.js             # MongoDB connection
│   │   ├── models/           # Mongoose schemas (User, Scan)
│   │   ├── middleware/       # Auth (JWT), Rate limiter
│   │   ├── routes/           # /api/auth, /api/scans
│   │   └── services/         # scannerService.js
│   └── .env                  # Environment variables
│
├── frontend/         # React 18 + Vite + Tailwind CSS (port 5173)
│   └── src/
│       ├── pages/            # Login, Register, Dashboard, NewScan, ScanProgress, ScanResults
│       ├── components/       # Navbar
│       ├── contexts/         # AuthContext (JWT)
│       └── api.js            # Axios instance
│
└── scanner/          # Python 3 scanning engine
    ├── main.py               # Entry point (NDJSON output)
    ├── crawler.py            # BFS website crawler
    ├── owasp_mapper.py       # OWASP Top 10 mapping
    └── checks/               # 9 vulnerability check modules
```

## 🔍 Vulnerabilities Detected

| Check | Severity |
|-------|----------|
| SQL Injection | Critical |
| Cross-Site Scripting (XSS) | High |
| CSRF Detection | High |
| Sensitive File Exposure | Critical → Low |
| Missing Security Headers | High → Low |
| Directory Listing | Medium |
| Open Redirect | Medium |
| Insecure Cookies | Medium |
| Clickjacking | Medium |

## 📊 Features

- **Dashboard** — Scan history with live status badges and stats
- **Ethical Disclaimer** — Must accept before scanning
- **Progress Page** — Live 2-second polling with animated progress bar
- **Results Page** — Severity-grouped vulnerability cards with OWASP Top 10 compliance panel
- **Reports** — Download as PDF or JSON

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:
```
MONGODB_URI=mongodb://localhost:27017/web-vul-scan
JWT_SECRET=your_super_secret_key
PORT=5000
PYTHON_PATH=python
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in, get JWT |
| POST | /api/scans | Start new scan |
| GET | /api/scans | List user's scans |
| GET | /api/scans/:id | Get scan + results |
| GET | /api/scans/:id/report/pdf | Download PDF report |
| GET | /api/scans/:id/report/json | Download JSON report |
| DELETE | /api/scans/:id | Delete scan |

## ⚠️ Ethical Usage

This tool is for **authorized security testing only**. Only scan websites you own or have explicit written permission to test. Unauthorized scanning may be illegal.
