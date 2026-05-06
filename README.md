# 🌾 Agri-Connect — Full Setup Guide

## Project Structure

```
agri-connect/
├── frontend/          ← React.js PWA (runs on port 3000)
│   └── src/
│       ├── components/
│       │   ├── auth/          ← Login, Register, OTP
│       │   ├── dashboard/     ← Farmer dashboard, feed
│       │   ├── content/       ← Article viewer, CMS
│       │   ├── community/     ← Forums, Q&A
│       │   ├── search/        ← Search interface
│       │   ├── admin/         ← Admin dashboard
│       │   └── shared/        ← Navbar, Sidebar, Cards
│       ├── pages/             ← Top-level page components
│       ├── hooks/             ← Custom React hooks
│       ├── store/             ← Redux Toolkit store + slices
│       ├── utils/             ← API client, helpers
│       └── styles/            ← Global CSS
└── backend/           ← Node.js + Express API (runs on port 5000)
    └── src/
        ├── controllers/       ← Route handler logic
        ├── routes/            ← Express route definitions
        ├── middleware/        ← Auth, validation, error handling
        ├── models/            ← Mongoose schemas
        ├── services/          ← Business logic (personalization, etc.)
        ├── config/            ← DB connection, environment
        └── utils/             ← Helpers, token generation
```

---

## Prerequisites — Install These First

| Tool | Version | Download |
|------|---------|---------|
| Node.js | v18+ | https://nodejs.org |
| MongoDB | Community Edition | https://www.mongodb.com/try/download/community |
| Git | Latest | https://git-scm.com |
| VS Code | Latest | https://code.visualstudio.com |

---

## VS Code Extensions (Install All of These)

Open VS Code → Extensions (Ctrl+Shift+X) → search and install:

### Essential
| Extension | Publisher | Why You Need It |
|-----------|-----------|----------------|
| **ES7+ React/Redux/React-Native snippets** | dsznajder | Shortcuts like `rafce` to generate components instantly |
| **ESLint** | Microsoft | Catches code errors as you type |
| **Prettier - Code formatter** | Prettier | Auto-formats your code on save |
| **Tailwind CSS IntelliSense** | Tailwind Labs | Autocomplete for Tailwind classes |
| **Auto Import** | steoates | Auto-imports React components |
| **Path Intellisense** | Christian Kohler | Autocomplete for file import paths |

### Backend
| Extension | Publisher | Why You Need It |
|-----------|-----------|----------------|
| **Thunder Client** | Rangav | Test your API endpoints (like Postman, built into VS Code) |
| **MongoDB for VS Code** | MongoDB | Browse your database from VS Code |
| **DotENV** | mikestead | Syntax highlighting for .env files |

### Quality of Life
| Extension | Publisher | Why You Need It |
|-----------|-----------|----------------|
| **GitLens** | GitKraken | See git history inline |
| **Error Lens** | Alexander | Shows errors inline on the same line |
| **Better Comments** | Aaron Bond | Color-coded TODO/NOTE comments |
| **Bracket Pair Color DLW** | BracketPairColorDlw | Color-matched brackets |

---

## Step-by-Step Setup

### Step 1 — Clone / Open the Project
```bash
# Open your terminal in VS Code (Ctrl + `)
cd Desktop
# If using git:
git init agri-connect && cd agri-connect
# Or just open the agri-connect folder you downloaded
```

### Step 2 — Set Up the Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agriconnect
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this_too
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=development
```

Start MongoDB (if running locally):
```bash
# Windows: MongoDB runs as a service automatically after install
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

Start the backend:
```bash
npm run dev
# You should see: "Server running on port 5000" and "MongoDB connected"
```

### Step 3 — Set Up the Frontend
Open a **new terminal** (Ctrl+Shift+`):
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Agri-Connect
```

Start the frontend:
```bash
npm start
# Browser opens automatically at http://localhost:3000
```

---

## Free Services You Need to Sign Up For

| Service | What For | Free Tier |
|---------|----------|-----------|
| **MongoDB Atlas** | Cloud database (alternative to local MongoDB) | 512MB free — enough for dev + pilot |
| **Cloudinary** | Image/video storage + CDN | 25GB free — more than enough |
| **Vercel** | Deploy your frontend | Free for personal projects |
| **Render** | Deploy your backend | Free tier available |

---

## Seed Data (Add Test Data to Your Database)

After both servers are running:
```bash
cd backend
npm run seed
# This creates: 1 admin, 2 experts, 5 test farmers, and 20 sample articles
```

Test accounts after seeding:
- **Admin:** admin@agriconnect.com / Admin@123
- **Expert:** expert@agriconnect.com / Expert@123  
- **Farmer:** farmer@agriconnect.com / Farmer@123

---

## API Base URL

All backend routes are prefixed with `/api`:
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Content: `GET /api/content`, `POST /api/content`
- Community: `GET /api/community/forums`, `POST /api/community/questions`
- Users: `GET /api/users/profile`, `PUT /api/users/profile`
- Search: `GET /api/search?q=maize`
- Admin: `GET /api/admin/users`
