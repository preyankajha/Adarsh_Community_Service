# Adarsh Society Service — Backend API

A **FastAPI + MongoDB** backend powering the **Adarsh Society Service** — a multi-community management platform.

---

## 📁 Project Structure

```
backend/
├── main.py                 # App entry point, startup events, core routes
├── database.py             # MongoDB connection & all collection references
├── dependencies.py         # Auth dependencies (get_current_user, role guards)
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not committed)
│
├── routes/                 # All API route handlers
│   ├── auth.py             # Login, signup, profile
│   ├── families.py         # Family registration & verification workflow
│   ├── communities.py      # Multi-community management
│   ├── core.py             # Assistance requests, notices, uploads
│   ├── finance.py          # Contributions, expenses, campaigns
│   ├── management.py       # User & role management
│   ├── elections.py        # Election & committee management
│   └── governance.py       # Strikes & performance ratings
│
├── models/                 # Pydantic data models
│   ├── schemas.py          # All request/response models
│   └── requests.py         # Misc request models
│
├── utils/                  # Shared utilities
│   ├── security.py         # JWT, password hashing
│   └── audit.py            # Audit log helper
│
├── data/                   # Static data files
│   ├── niyamavali.txt      # Society constitution (Hindi)
│   └── rules.json          # Rules in structured format
│
├── uploads/                # User-uploaded files (photos, documents)
├── scripts/                # Admin & seeding scripts (run manually)
└── _archive/               # Deprecated/debug files (safe to ignore)
```

---

## 🚀 Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Start development server
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Server runs at: `http://localhost:8001`  
Swagger docs at: `http://localhost:8001/docs`

---

## 🔑 Environment Variables (`.env`)

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
DB_NAME=adarsh_society_service
SECRET_KEY=your_jwt_secret
```

---

## 🏘️ Multi-Community Architecture

- Each **community/society** has a unique `society_code` (e.g. `JGSA`, `GMRW`)
- All families, users, and records are scoped to a `community_id`
- Family IDs follow the pattern: `{SOCIETY_CODE}-F-{seq}` (e.g. `JGSA-F-0001`)
- Member IDs follow: `{FAMILY_ID}-M{idx}` (e.g. `JGSA-F-0001-M01`)

---

## 📦 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new family head |
| POST | `/api/auth/login` | Login |
| GET | `/api/communities/` | List all active communities |
| POST | `/api/communities/register` | Register a new society |
| GET | `/api/families` | Admin: list all families |
| POST | `/api/families/{id}/approve` | Approve family & generate IDs |
| GET | `/api/finance/stats` | Finance overview |
