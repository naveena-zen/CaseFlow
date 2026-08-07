# ⚖️ CaseFlow — Legal Case Management Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

## 📖 Description
**CaseFlow** is a streamlined, full-stack Legal Case Management Platform designed to help law firms and independent lawyers seamlessly manage their cases, clients, documents, and upcoming deadlines. The platform offers dedicated portals for both lawyers and clients, ensuring transparency, privacy, and efficient communication.

---

## ✨ Features
- **Role-Based Authentication:** Secure login system differentiating between `lawyer` and `client` accounts with JWT-based role access control.
- **Strict Security & Validation:** Input payload validation powered by **Zod**, HTTP security headers with **Helmet**, rate limiting with **express-rate-limit**, and granular IDOR ownership verification.
- **Case Management:** Lawyers can create, update, and close legal cases. Clients can view their assigned cases and track status.
- **Document Management:** Securely upload, download, and store case-related documents with type and file size restriction enforcement.
- **Deadline Tracking:** Add critical case deadlines and court dates directly to active cases.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | HTML, CSS, JavaScript, Bootstrap 5 | Responsive, lightweight vanilla UI |
| **Backend** | Node.js, Express.js | RESTful API server |
| **Database** | MongoDB, Mongoose | NoSQL database and object modeling |
| **Auth & Security** | JWT, bcryptjs, Helmet, Zod, express-rate-limit | Tokens, hashing, schema validation & rate limits |
| **Storage** | Multer | Local filesystem file uploads outside web root |

---

## 📂 Folder Structure

```text
CaseFlow/
├── backend/
│   ├── config/db.js
│   ├── middleware/ (auth, ownership, validate)
│   ├── models/ (User, Case, Document, Deadline)
│   ├── routes/ (auth, cases, documents, deadlines)
│   ├── validators/ (Zod schemas)
│   ├── uploads/
│   ├── seed.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── pages/
    ├── app.js
    └── index.html
```

---

## 🚀 Setup & Installation

Follow these steps to get the platform running on your local machine:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CaseFlow
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**  
   Copy `.env.example` to `.env` inside `backend/`:
   ```bash
   cp .env.example .env
   ```
   *Verify your `MONGO_URI`, `JWT_SECRET`, and `PORT` settings.*

4. **Seed Synthetic Demo Data**  
   Run the seed script to populate synthetic test users and legal cases:
   ```bash
   npm run seed
   ```
   *Default seed credentials:*
   - **Lawyer:** `lawyer@caseflow.dev` / `password123`
   - **Client:** `client@caseflow.dev` / `password123`

5. **Start the backend server**  
   From the `backend` directory:
   ```bash
   npm start
   ```

6. **Access the application**  
   Navigate to `http://localhost:5000` in your web browser.

---

## 🔌 API Endpoints Reference

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/clients` | Get a list of all clients | Lawyer Only |
| `GET` | `/api/cases` | Get assigned cases for authenticated user | Yes |
| `GET` | `/api/cases/:id` | Get details for a specific case | Yes (Assigned User) |
| `POST` | `/api/cases` | Create a new case file | Lawyer Only |
| `PATCH`| `/api/cases/:id/status`| Update status (`Open`/`Active`/`Closed`)| Lawyer Only (Owner) |
| `DELETE`| `/api/cases/:id` | Delete a closed case | Lawyer Only (Owner) |
| `POST` | `/api/documents/upload/:caseId` | Upload a document to a case | Yes (Assigned User) |
| `GET` | `/api/documents/:caseId` | List documents for a case | Yes (Assigned User) |
| `GET` | `/api/documents/download/:docId` | Download a document file | Yes (Assigned User) |
| `DELETE` | `/api/documents/:docId` | Delete a document | Yes (Assigned User) |
| `POST` | `/api/deadlines/:caseId` | Add a deadline to a case | Lawyer Only (Owner) |
| `GET` | `/api/deadlines/:caseId` | Get all deadlines for a case | Yes (Assigned User) |
| `PUT` | `/api/deadlines/:id` | Update a deadline | Lawyer Only (Owner) |
| `DELETE` | `/api/deadlines/:id` | Delete a deadline | Lawyer Only (Owner) |

---

## 🗄️ MongoDB Collections

The database consists of the following primary collections:
1. **`users`** — Stores lawyer and client accounts with hashed passwords.
2. **`cases`** — Stores legal case details, status, and references to the respective lawyer and client.
3. **`documents`** — Stores metadata and filesystem paths for uploaded files mapped to a specific case.
4. **`deadlines`** — Stores critical due dates mapped to a specific case.

---

## 📄 License
This project is licensed under the **MIT License**.
