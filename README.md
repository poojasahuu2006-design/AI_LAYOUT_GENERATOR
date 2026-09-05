# 🏛️ AI House Planner — Intelligent 2D/3D Architectural Layout Generator

An advanced, AI-powered floor plan and architectural layout planner built with **React, Three.js, Node.js, Express, and MongoDB**.

![AI House Planner](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Three.js%20%7C%20Express%20%7C%20MongoDB-blue?style=for-the-badge)

---

## 🌟 Key Features

* **Instant Architectural Floor Plan Generation**: Creates NBC 2016 / Indian Standard compliant 2D floor plans from custom plot dimensions and room specifications.
* **Natural Language Customization Engine**: Real-time room modification using plain English commands (e.g. `"remove kitchen"`, `"move staircase left"`, `"swap living room and kitchen"`).
* **Intelligent Space Auto-Reallocation**: Automatically expands adjacent spaces when rooms are removed to maintain gap-free, cohesive architectural plans.
* **Interactive 3D Architectural Viewer**: Full 3D building visualization powered by **Three.js** with orbital controls, daylight studio lighting, extruded walls, and floating labels.
* **Robust Authentication & Security**: JWT-authenticated endpoints with fallback support for offline operations.
* **Responsive Multi-Device UI**: Sleek, modern interface with glassmorphism design tokens and dark/light modes.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: Optional (automatic in-memory fallback enabled if local MongoDB is not running)

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_house_planner
JWT_SECRET=ai_house_planner_jwt_secret_key_2026
NODE_ENV=development
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE=http://localhost:5000/api
```

### 3. Run Development Servers

**Start Backend API Server:**
```bash
cd backend
node server.js
```
*(Runs on `http://localhost:5000`)*

**Start Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Lucide Icons |
| **3D Rendering** | Three.js, @react-three/fiber, OrbitControls |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose (with in-memory fallback) |
| **Auth** | JSON Web Tokens (JWT), Bcrypt.js |

---

## 🌐 Deployment Instructions

### Option A: Render (Recommended for Full Stack)
1. Push this repository to GitHub.
2. Connect your GitHub account to [Render.com](https://render.com).
3. Create a **New Blueprint Instance** and select this repo (`render.yaml` is pre-configured).

### Option B: Vercel (Frontend) + Railway (Backend)
1. Deploy `frontend` directory to [Vercel](https://vercel.com).
2. Deploy `backend` directory to [Railway](https://railway.app) or [Render](https://render.com).
3. Update `VITE_API_BASE` in Vercel to point to your live backend server URL.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for details.
