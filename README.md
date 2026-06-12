LeadFlow - Lead Management System

A mini Lead Management System built using Node.js/Express, PostgreSQL, and React.

---

Setup Instructions

Prerequisites

Before setting up the project locally, ensure you have the following installed on your machine:

* Node.js (v16+ recommended)
* PostgreSQL (v13+ recommended) & pgAdmin
* npm (installed automatically with Node.js)

Project Layout

The repository contains the following structure:

* backend/ - Node.js + Express API server.
* frontend/ - React + Vite SPA client.

---

Database Setup

The database schema consists of three tables: users, leads, and activity_logs.

Step 1: Create the Database

In pgAdmin or via the PostgreSQL CLI (psql), create a new database:

```sql
CREATE DATABASE lead_management;
```

Step 2: Create Tables & Indexes

Run the following SQL queries in the pgAdmin Query Tool for lead_management to establish the tables and indexes:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    source VARCHAR(50) NOT NULL DEFAULT 'web',
    status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'won', 'in_progress', 'completed')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    enrichment_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('created', 'updated', 'assigned', 'status_changed')),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id ON activity_logs(lead_id);
```

---
Environment Configuration

Configure the environment settings so the backend API can connect to your local PostgreSQL instance.

1. Locate the configuration file backend/.env (created from backend/.env.example).
2. Configure the database credentials to match your local setup.

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=lead_db
JWT_SECRET=lead_mgmt_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h
```

---
How to Run Frontend & Backend

1. Running the Backend API Server

Navigate to the backend directory, install the required packages, and launch the development environment.

```powershell
cd backend
npm install
npm run dev
```

The backend will run on:
http://localhost:5000

2. Running the Frontend SPA Client

In a separate terminal window, navigate to the frontend directory, install the packages, and run the dev server.

```powershell
cd frontend
npm install
npm run dev
```

The frontend will run on:
http://localhost:5173

Navigate to this URL in your web browser to open the application.

---
API Documentation

All API requests except login and register require a valid authentication token sent in the headers as:

Authorization: Bearer <token>

Authentication /api/auth

| Method | Endpoint  | Access    | Description                                     |
| ------ | --------- | --------- | ----------------------------------------------- |
| POST   | /register | Public    | Registers a new user                            |
| POST   | /login    | Public    | Authenticates credentials and returns JWT token |
| GET    | /profile  | Protected | Retrieves logged-in user profile                |
| GET    | /agents   | Protected | Retrieves all registered agents                 |

Leads /api/leads

| Method | Endpoint | Access        | Description                             |
| ------ | -------- | ------------- | --------------------------------------- |
| GET    | /        | Protected     | Lists leads with filters and pagination |
| GET    | /stats   | Protected     | Returns lead counters grouped by status |
| GET    | /:id     | Protected     | Returns lead details by ID              |
| POST   | /        | Manager/Admin | Creates a new lead                      |
| PUT    | /:id     | Protected     | Updates lead details                    |
| DELETE | /:id     | Manager/Admin | Deletes lead record                     |

Activity Logs /api/logs

| Method | Endpoint  | Access        | Description                          |
| ------ | --------- | ------------- | ------------------------------------ |
| GET    | /         | Manager/Admin | Fetches global activity logs         |
| GET    | /lead/:id | Protected     | Fetches activity timeline for a lead |

---

Architecture Explanation

The application follows a decoupled client-server SPA architecture.

Frontend Architecture (React.js + Vite)

* Uses React Context API for authentication state management.
* Uses react-router-dom for protected/public routing.
* Provides role-based UI access controls.

Backend Architecture (Node.js + Express.js)

* Routing Layer
* Middleware Layer
* Controller Layer
* Service Layer
* Database Access Layer

Data Flow Diagram

```text
[React Client] ---> [Express Router]
                           |
                           v
[Database Connection] <--- [Controllers & Services]
                           |
                           v
                    [RandomUser API]
```

---

Assumptions Made

1. Active lead count includes only active statuses such as new, contacted, qualified, and in_progress.
2. Least-loaded agent is selected for automatic lead assignment.
3. RandomUser API is used for lead enrichment fallback.
4. Agents can only access leads assigned to them.
5. Lead activities are stored in activity_logs.

---

Trade-offs Considered

1. JWT tokens are stored in localStorage for simpler implementation.
2. Lead assignment uses transaction blocks to avoid duplicate assignment issues.
3. External API calls are executed outside database transactions.
4. Hard deletion is used instead of soft deletion.
5. Filtering and pagination are handled server-side for better scalability.
