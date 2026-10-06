# 🩸 Hemora — AI-Powered Emergency Blood Donor Matching

> **SDG 3 — Good Health and Well-being**
> Connecting recipients with nearby donors and blood banks in real-time during emergencies.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://bloodbaank.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge&logo=render)](https://bloodbaank-backend.onrender.com/health)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/hareesh86820-ui/bloodbaank)

---

## 📌 Overview

Hemora is a full-stack hybrid application that uses AI and machine learning to match blood donors with recipients during emergencies. The system prioritizes critical requests, checks nearby blood banks first, and escalates to individual donors when inventory is insufficient.

---

## ✨ Features

### 🔐 Authentication & Security
- **Email OTP Verification** — 6-digit code sent via Gmail before account creation
- **JWT Authentication** — Secure token-based sessions with role-based access control
- **Fraud Detection** — AI-powered system that blocks duplicate requests, rate-limits abuse, and flags suspicious activity with a fraud score
- **90-Day Donation Cooldown** — Donors are automatically locked from receiving requests after accepting one, enforced on both frontend and backend

### 👥 User Roles
| Role | Capabilities |
|------|-------------|
| **Donor** | Receive alerts, accept requests, eligibility check, donation history, navigation |
| **Recipient** | Create blood requests, track status, priority mode |
| **Hospital / Blood Bank** | Manage blood inventory, fulfill requests, receive priority alerts |
| **NGO / Organization** | Campaigns, donor outreach, demand prediction, request monitoring |
| **Admin** | User verification, system monitoring, fraud audit, chatbot audit |

### 🤖 AI & Machine Learning
- **Smart Matching Engine** — Matches donors by blood type compatibility, location proximity, availability score, and reliability
- **Donor Eligibility Scoring** — Random Forest classifier trained on health parameters (age, weight, medications, illness history)
- **Donor Availability Prediction** — Gradient Boosting model predicting donor response likelihood
- **Demand Prediction by Area** — Grid-based geospatial technique dividing the map into ~11km² cells, using exponential decay weighting and historical patterns to forecast blood demand for the next 7 days
- **Chosen-Type Chatbot** — Step-by-step multiple-choice eligibility guidance with ML risk scoring

### 🚨 Emergency Request Flow
1. Recipient submits blood request (normal / urgent / critical)
2. System runs **fraud detection** — blocks duplicates and abuse
3. **Critical requests** → scan nearby blood banks for compatible stock first
4. If blood bank has stock → notify hospital immediately
5. If no stock found → escalate to available donors with compatible blood types
6. **Priority mode** → always notifies hospitals AND donors in parallel
7. Donor/hospital accepts → recipient notified via push + SMS
8. Request fulfilled → donor reliability score updated

### 🗺️ Location & Navigation
- Real-time GPS tracking with live map updates
- OpenStreetMap integration with hospital and request markers
- **One-click Google Maps navigation** from donor to hospital with turn-by-turn directions
- Address autocomplete using OpenStreetMap Nominatim (free, no API key)
- Reverse geocoding — auto-fills address from GPS coordinates

### 📱 Notifications
- **Push Notifications** — Firebase Cloud Messaging for real-time alerts
- **SMS** — Termii API with retry queue, exponential backoff, and phone number normalization
- Smart filtering — unavailable and cooldown donors never receive notifications

### 💬 BloodBot — Text Chatbot
A floating AI chatbot available on every page that answers questions about:
- Eligibility (age, weight, medications, illness, tattoos, pregnancy)
- Donation process (duration, volume, pain, recovery)
- Blood types and compatibility
- Before/after donation tips
- Benefits and impact

### 📊 NGO Dashboard
- Blood drive campaign management with blood type targeting
- Bulk donor outreach via push + SMS filtered by blood type
- **Demand Prediction heatmap** — top 20 high-demand areas with predicted units needed
- One-click "Alert Donors" from demand prediction to outreach
- Request monitoring with flag/review capability
- Full donor registry with reliability scores

### 🏥 Hospital Dashboard
- Visual blood inventory management with color-coded blood type cards
- Critical low stock alerts (< 5 units)
- Pending request fulfillment with stock validation
- Fulfillment history tracking

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | React.js + Redux Toolkit |
| **Mobile** | React Native (Expo) |
| **Backend** | Node.js + Express |
| **Database** | MongoDB Atlas |
| **AI / ML** | Python + FastAPI + scikit-learn |
| **Push Notifications** | Firebase Cloud Messaging |
| **SMS** | Termii API |
| **Email OTP** | Nodemailer + Gmail |
| **Maps** | Leaflet + OpenStreetMap |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
bloodbaank/
├── backend/          Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   └── package.json
│
├── web/              React.js Web Dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   └── dashboards/
│   │   ├── components/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
├── mobile/           React Native (Expo) Mobile App
│   ├── src/
│   │   ├── screens/
│   │   ├── store/
│   │   └── utils/
│   └── App.js
│
└── ml/               Python ML Service
    ├── main.py       FastAPI endpoints
    └── train_models.py
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account

### Backend
```bash
cd backend
cp .env.sample .env   # fill in your credentials
npm install
npm run dev           # runs on http://localhost:5000
```

### ML Service
```bash
cd ml
pip install -r requirements.txt
python train_models.py        # trains and saves models
uvicorn main:app --port 8000  # runs on http://localhost:8000
```

### Web
```bash
cd web
cp .env.sample .env
npm install
npm start             # runs on http://localhost:3000
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

---

## 🌐 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
TERMII_API_KEY=your_termii_key
TERMII_SENDER_ID=BloodAlert
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=https://bloodbaank.vercel.app
```

### Web `.env`
```env
REACT_APP_API_URL=https://bloodbaank-backend.onrender.com/api
```

---

## 🔗 Live Links

- **Web App**: https://bloodbaank.vercel.app
- **API Health**: https://bloodbaank-backend.onrender.com/health
- **GitHub**: https://github.com/hareesh86820-ui/bloodbaank

---

## 📄 License

MIT License — built for SDG 3: Good Health and Well-being.
