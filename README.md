# ⚖️ CaseFlow — Legal Case Management Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

## Description
**CaseFlow** is a streamlined, full-stack Legal Case Management Platform designed to help law firms and independent lawyers seamlessly manage their cases, clients, documents, and upcoming deadlines. The platform offers dedicated portals for both lawyers and clients, ensuring transparency and efficient communication.

---

## Features
- **Role-Based Authentication:** Secure login system differentiating between `lawyer` and `client` accounts with role-specific access control.
- **Case Management:** Lawyers can create, update, and close legal cases. Clients can view their assigned cases and track their status.
- **Document Management:** Securely upload, download, and store case-related documents and legal files.
- **Deadline Tracking:** Add critical case deadlines and court dates directly to active cases.

---

## Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | HTML, CSS, JavaScript, Bootstrap 5 | Responsive, lightweight vanilla UI |
| **Backend** | Node.js, Express.js | RESTful API server |
| **Database** | MongoDB, Mongoose | NoSQL database and object modeling |
| **Auth & Security** | JWT, bcryptjs | JSON Web Tokens & password hashing |
| **Storage** | Multer | Local filesystem file uploads |

---

## 📂 Folder Structure

```text
lextrack/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/ (User, Case, Document, Deadline)
│   ├── routes/ (auth, cases, documents, deadlines)
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── pages/
    ├── app.js
    └── index.html
```

---

## 🚀 Setup & Installation

Follow these steps to get the completely functional platform running on your local machine:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CaseFlow
   ```

2. **Install backend dependencies**
   ```bash
   cd lextrack/backend
   npm install
   ```

3. **Configure Environment Variables**  
   Create a `.env` file inside `lextrack/backend` and add the following:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/caseflow
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Start the backend server**  
   From the `lextrack/backend` directory, start the Node server (which automatically serves the frontend):
   ```bash
   npm start
   ```

5. **Access the application**  
   Open the website in your browser by double-clicking:
   ```text
   lextrack/frontend/index.html
   ```
   *(Alternatively, simply navigate to `http://localhost:5000`)*

---

## 🔑 Demo Login Credentials

Upon starting the server for the first time, sample demo data is automatically seeded. Use the following to log in:

| Role | Email | Password |
|------|-------|----------|
| **Lawyer** | `lawyer@lextrack.com` | `password123` |
| **Client** | `client@lextrack.com` | `password123` |

---

## 🔌 API Endpoints Reference

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/clients` | Get a list of all clients | Lawyer Only |
| `GET` | `/api/cases` | Get cases for the logged-in user | Yes |
| `GET` | `/api/cases/:id` | Get details for a specific case | Yes |
| `POST` | `/api/cases` | Create a new case file | Lawyer Only |
| `PATCH`| `/api/cases/:id/status`| Update status (Open/Active/Closed)| Lawyer Only |
| `DELETE`| `/api/cases/:id` | Delete a closed case | Lawyer Only |
| `POST` | `/api/documents/upload/:caseId` | Upload a document to a case | Yes |
| `GET` | `/api/documents/:caseId` | List documents for a case | Yes |
| `GET` | `/api/documents/download/:docId` | Download a document file | Yes |
| `POST` | `/api/deadlines/:caseId` | Add a deadline to a case | Lawyer Only |
| `GET` | `/api/deadlines/:caseId` | Get all deadlines for a case | Yes |

---

## 🗄️ MongoDB Collections

The database consists of the following four primary collections:
1. **`users`** — Stores lawyer and client accounts with hashed passwords.
2. **`cases`** — Stores legal case details, status, and references to the respective lawyer and client.
3. **`documents`** — Stores metadata and filesystem paths for uploaded files mapped to a specific case.
4. **`deadlines`** — Stores critical due dates mapped to a specific case.

---

## 📄 License
This project is licensed under the **MIT License**.
