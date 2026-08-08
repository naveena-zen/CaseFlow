# ⚖️ CaseFlow — Legal Case Management Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

> A production-quality, full-stack legal case management platform with role-based access, security hardening, automated testing, audit trails, document versioning, and real-time deadline reminders.

---

## ✨ Feature Highlights

| Feature | Details |
|---------|---------|
| **Role-Based Authentication** | Lawyer and client portals, JWT (1h expiry), bcrypt password hashing |
| **Security Hardening** | Helmet headers, rate limiting (auth: 15/15min, API: 100/15min), env-driven CORS, JWT startup check |
| **Request Validation** | Zod schemas on all POST/PATCH routes; inline error messages surfaced in UI |
| **IDOR Protection** | Ownership middleware on every case, document, and deadline endpoint — unauthorized access returns `403 Forbidden` |
| **Password Policy** | Min 8 characters + at least one number, enforced on registration with live UI feedback |
| **Case Management** | Create, update status, close, and delete cases; search by title/client, filter by status, paginated results |
| **Document Management** | Upload with file type + 5MB size validation; **document versioning** (re-upload keeps version history); drag-and-drop UI |
| **Deadline Tracking** | Add/update/delete deadlines with urgency color coding (red/amber/green); **daily email reminders** via Nodemailer |
| **Audit Trail** | Every status change, document event, and deadline action is logged and shown in a visual activity timeline |
| **Dashboard Analytics** | Case status doughnut chart (Chart.js) + upcoming deadlines list (next 14 days) |
| **Frontend Polish** | Toast notifications, loading skeletons, inline Zod error messages, empty states, drag-and-drop upload, responsive mobile nav |
| **Automated Testing** | 18 Jest + Supertest tests across `auth`, `cases`, `documents`, `deadlines`; in-memory MongoDB via `mongodb-memory-server` |
| **CI Pipeline** | GitHub Actions workflow runs the test suite on every push and pull request |
| **Idempotent Seeding** | `npm run seed` clears and re-populates demo data safely on repeated runs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, Bootstrap 5, Bootstrap Icons, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Auth & Security** | JWT, bcryptjs, Helmet, Zod, express-rate-limit |
| **File Uploads** | Multer (type filter, 5MB limit, filename sanitization) |
| **Email Reminders** | Nodemailer (Mailtrap in dev) |
| **Scheduler** | node-cron |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **CI** | GitHub Actions |

---

## 📂 Project Structure

```
CaseFlow/
├── .github/workflows/ci.yml     # GitHub Actions CI pipeline
├── backend/
│   ├── config/db.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification + requireRole()
│   │   ├── ownership.js         # IDOR protection (403 Forbidden)
│   │   └── validate.js          # Zod schema validation middleware
│   ├── models/
│   │   ├── User.js, Case.js, Document.js (versioned), Deadline.js
│   │   └── ActivityLog.js       # Audit trail
│   ├── routes/
│   │   ├── auth.js, cases.js, documents.js, deadlines.js
│   ├── services/
│   │   └── reminderService.js   # Daily cron + email
│   ├── tests/
│   │   ├── setup.js             # MongoMemoryServer
│   │   └── *.test.js            # 18 passing tests
│   ├── utils/activityLogger.js
│   ├── validators/index.js      # Zod schemas
│   ├── seed.js                  # Idempotent seeder
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── pages/
│   │   ├── login.html, register.html
│   │   ├── lawyer-dashboard.html   # Charts, search/filter/pagination
│   │   ├── lawyer-case-detail.html # Drag-and-drop, timeline
│   │   ├── client-dashboard.html
│   │   └── client-case-view.html
│   ├── app.js                   # Shared helpers (toasts, auth, skeletons)
│   └── index.html
├── docs/
│   └── ARCHITECTURE.md          # Mermaid diagrams + design decisions
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`)

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd CaseFlow

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set: MONGO_URI, JWT_SECRET, PORT, CORS_ORIGIN
# For email reminders, set: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# 4. Seed demo data (idempotent — safe to re-run)
npm run seed

# 5. Start the backend server
npm start
```

**Access at:** `http://localhost:5000`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Lawyer | `lawyer@caseflow.dev` | `password123` |
| Lawyer 2 | `m.sterling@caseflow.dev` | `password123` |
| Client | `client@caseflow.dev` | `password123` |
| Client 2 | `sophia.reed@example.com` | `password123` |

---

## 🧪 Automated Testing

```bash
cd backend

# Run full test suite
npm test

# Run with coverage report
npm run test:coverage
```

Tests use **Jest** + **Supertest** with **mongodb-memory-server** (isolated in-memory DB — no real database touched):

| Test File | Coverage |
|-----------|---------|
| `auth.test.js` | Register (valid/weak password), login (valid/invalid), JWT secret check |
| `cases.test.js` | CRUD, role restrictions, cross-user 403, search/filter/pagination, activity log, analytics |
| `documents.test.js` | Upload (valid/invalid type/oversized), versioning, download ownership 403 |
| `deadlines.test.js` | Create, cross-user 403, reminder cron trigger |

---

## 🔌 API Endpoints Reference

### Authentication
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | No | Register with name, email, password (8+ chars, 1 digit), role |
| `POST` | `/api/auth/login` | No | Login, returns 1h JWT |
| `GET` | `/api/auth/clients` | Lawyer | List all client users |

### Cases
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/cases` | Yes | List cases; supports `?page=&limit=&status=&search=` |
| `GET` | `/api/cases/analytics/summary` | Yes | Status breakdown + upcoming deadlines |
| `GET` | `/api/cases/:id` | Assigned | Case details |
| `GET` | `/api/cases/:id/activity` | Assigned | Audit trail timeline |
| `POST` | `/api/cases` | Lawyer | Create case |
| `PATCH` | `/api/cases/:id/status` | Lawyer Owner | Update status |
| `DELETE` | `/api/cases/:id` | Lawyer Owner | Delete closed case |

### Documents
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/documents/upload/:caseId` | Assigned | Upload file (5MB limit; re-upload creates new version) |
| `GET` | `/api/documents/:caseId` | Assigned | List documents |
| `GET` | `/api/documents/download/:docId?version=N` | Assigned | Download (latest or specific version) |
| `DELETE` | `/api/documents/:docId` | Assigned | Delete all versions |

### Deadlines
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/deadlines/:caseId` | Lawyer Owner | Create deadline |
| `GET` | `/api/deadlines/:caseId` | Assigned | List deadlines |
| `PUT` | `/api/deadlines/:id` | Lawyer Owner | Update deadline |
| `DELETE` | `/api/deadlines/:id` | Lawyer Owner | Delete deadline |

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `users` | Lawyer/client accounts with bcrypt-hashed passwords |
| `cases` | Case details, status, lawyerId, clientId references |
| `documents` | File metadata, path, version number, version history array |
| `deadlines` | Due dates and titles linked to cases |
| `activitylogs` | Immutable audit log of all case events |

---

## 🏛️ Architecture

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for:
- High-level architecture diagram (Mermaid)
- Document upload sequence diagram
- Auth flow explanation
- Ownership/IDOR middleware pattern
- Design decisions & tradeoffs
- Planned future improvements

---

## 📄 License

This project is licensed under the **MIT License**.
