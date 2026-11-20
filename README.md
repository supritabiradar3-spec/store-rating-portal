# Store Rating Portal

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20MySQL-blue.svg)](https://github.com/supritabiradar3-spec/store-rating-portal)
[![Validation](https://img.shields.io/badge/Validation-Strict%20Backend%20%26%20Frontend-green.svg)](https://github.com/supritabiradar3-spec/store-rating-portal)
[![Tests](https://img.shields.io/badge/API%20Tests-29%2F29%20Passing-brightgreen.svg)](https://github.com/supritabiradar3-spec/store-rating-portal)

A full-stack, responsive web application for rating and discovering retail stores, built strictly according to the **FullStack Intern Coding Challenge - V1.1** specification. The platform implements Role-Based Access Control (RBAC) across three distinct user roles, strict data validation on both frontend and backend, real-time rating aggregates, and a clean, responsive user interface styled with pure CSS.

---

## Table of Contents

1. [Architecture & Tech Stack](#1-architecture--tech-stack)
2. [User Roles & Key Features](#2-user-roles--key-features)
3. [Strict Form Validation Rules](#3-strict-form-validation-rules)
4. [Database Schema & Entity Relationships](#4-database-schema--entity-relationships)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Demo & Evaluation Accounts](#6-demo--evaluation-accounts)
7. [Local Setup & Installation](#7-local-setup--installation)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Automated API Test Suite](#9-automated-api-test-suite)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Security & Best Practices](#11-security--best-practices)

---

## 1. Architecture & Tech Stack

The application is structured as a decoupled client-server architecture:

- **Frontend**:
  - **React 18** bootstrapped with **Vite** for fast, optimized single-page client rendering.
  - **Pure CSS / Modern Custom Styles** (zero heavy UI dependencies, adhering strictly to assignment guidelines).
  - Component-based architecture with interactive modals, toast alerts, dynamic star-rating controls, and responsive navigation.
- **Backend**:
  - **Node.js** with **Express.js** RESTful API framework.
  - Layered architecture: modular routing (`routes/`), database pool abstraction (`config/db.js`), centralized validation helpers (`utils/validation.js`), and JWT authentication middleware (`middleware/auth.js`).
- **Database**:
  - **MySQL** relational database with foreign-key referential integrity and cascading constraints.
  - Efficient connection pooling using `mysql2/promise`.
- **Authentication & Security**:
  - **JSON Web Tokens (JWT)** for stateless session management with 7-day token expiration.
  - **bcryptjs** password hashing (10 salt rounds) — passwords are never stored in plain text.
  - Strict input sanitization and parameterized SQL queries to prevent SQL injection.

---

## 2. User Roles & Key Features

### 1. System Administrator (`ADMIN`)
- **Single Login System**: Secure authentication with administrative privileges.
- **Real-Time Analytics Dashboard**:
  - Instant visual metrics for Total Users, Total Registered Stores, and Total Submitted Ratings.
- **User Management**:
  - Tabular list of registered users with sorting indicators across Name, Email, Address, and Role.
  - Search and filter controls for Name, Email, Address, and Role.
  - **User Details Modal**:
    - Complete profile information.
    - If the user is a **Store Owner**, displays their assigned store details and real-time average store rating.
    - If the user is a **Normal User**, displays their comprehensive **Rating History** (store name, rating score, and submission timestamp).
  - Add new User accounts (Normal User, Store Owner, or Administrator) with strict validation.
- **Store Management**:
  - Tabular list of stores with sortable headers, clear ownership attribution, and standardized rating summaries (`4.0/5 · 1 review`).
  - Search and filter controls for Store Name, Email, and Address.
  - Create new stores and assign them directly to verified store owners.
- **Secure Logout** & credential updates.

### 2. Normal User (`USER`)
- **Registration & Authentication**:
  - Self-service signup with client-side and server-side validation.
  - Single login system with JWT token persistence.
- **Account Management**:
  - In-app password change modal enforcing security rules.
- **Store Discovery & Multi-Column Sorting**:
  - Browse all registered stores with addresses, overall average ratings, and review counts.
  - Real-time search by Store Name and Store Address.
  - Dynamic ascending/descending sorting on **Store Name**, **Address**, **Overall Rating**, and **Your Rating**.
- **Interactive Rating System**:
  - Submit ratings from 1 to 5 stars using an interactive star selector.
  - Immediate upsert capability: modify existing submitted ratings anytime.
  - Database uniqueness constraint ensures one rating per store per user.

### 3. Store Owner (`OWNER`)
- **Single Login System**: Authenticate and access an owner-tailored dashboard.
- **Multi-Store Selector**:
  - Owners with multiple stores can switch seamlessly between stores using clean, selectable store cards.
- **Key Metrics Overview**:
  - Balanced metric cards displaying Average Rating (e.g., `★ 4.0 / 5.0`) and Total Verified Reviews received.
- **Customer Feedback & Ratings**:
  - Comprehensive customer review history displaying reviewer full name, email, address, submitted star rating, and formatted submission date.
- **Account Management**:
  - Update account password securely from within the dashboard.

---

## 3. Strict Form Validation Rules

Both frontend forms and backend endpoints strictly enforce the constraints specified in the coding challenge:

| Field | Requirement | Validation Rule |
|---|---|---|
| **Full Name** | 20 to 60 characters | Applied to User Name and Store Name |
| **Address** | Maximum 400 characters | Enforced on User addresses and Store addresses |
| **Password** | 8 to 16 characters | Must include at least **1 uppercase letter** (`A-Z`) and at least **1 special character** (`!@#$%^&*...`) |
| **Email** | Valid RFC-compliant format | Standard regex verification applied across all inputs |
| **Rating** | Integer between 1 and 5 | Enforced via interactive star selector, API payload validation, and MySQL table check constraint |

---

## 4. Database Schema & Entity Relationships

The relational database `store_rating_db` consists of three core tables configured with foreign key constraints and cascading rules:

```sql
-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(400) NOT NULL,
  role ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Stores Table
CREATE TABLE stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address VARCHAR(400) NOT NULL,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Ratings Table
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  value INT NOT NULL CHECK (value >= 1 AND value <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_store (user_id, store_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

---

## 5. Project Directory Structure

```
store-rating/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool configuration
│   ├── middleware/
│   │   └── auth.js               # JWT verification & RBAC middleware
│   ├── routes/
│   │   ├── admin.js              # Admin endpoints: stats, users, stores, owner lookup
│   │   ├── auth.js               # Auth endpoints: login, signup, change password, profile
│   │   ├── ratings.js            # Rating submission and upsert logic
│   │   └── stores.js             # Store search, sorting, and owner dashboard data
│   ├── utils/
│   │   └── validation.js         # Centralized form and input validation rules
│   ├── .env                      # Local environment configuration (gitignored)
│   ├── .gitignore                # Backend ignore rules
│   ├── package.json              # Backend scripts and dependencies
│   ├── schema.sql                # Complete SQL schema & initial seed statements
│   ├── seed.js                   # Node.js seed script for initializing test database
│   ├── server.js                 # Express server bootstrap & health check
│   └── test-suite.js             # Automated end-to-end API test suite (29 tests)
├── frontend/
│   ├── src/
│   │   ├── assets/               # Static icons and logos
│   │   ├── components/
│   │   │   ├── ChangePasswordModal.jsx  # In-app password change modal
│   │   │   ├── Navbar.jsx               # Role-aware responsive navigation bar
│   │   │   ├── StarRating.jsx           # Interactive 1-5 star rating component
│   │   │   └── UserDetailModal.jsx      # Admin modal showing profile & rating history
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx       # Admin analytics, user & store management
│   │   │   ├── Login.jsx                # Single login with Quick Demo autofill buttons
│   │   │   ├── OwnerDashboard.jsx       # Store owner dashboard with multi-store cards
│   │   │   ├── Signup.jsx               # Normal user self-registration
│   │   │   └── UserStoresPage.jsx       # Store exploration, search & multi-column sorting
│   │   ├── services/
│   │   │   └── api.js                   # Centralized Axios/fetch API service client
│   │   ├── utils/
│   │   │   └── validation.js            # Frontend input validation matching backend rules
│   │   ├── App.css                      # Clean, unified responsive application styling
│   │   ├── App.jsx                      # App root & role-based view routing
│   │   ├── index.css                    # Base styling reset
│   │   └── main.jsx                     # Vite React entry point
│   ├── .env                             # Local frontend configuration (gitignored)
│   ├── .gitignore                       # Frontend ignore rules
│   ├── index.html                       # HTML5 template
│   ├── package.json                     # Frontend scripts and dependencies
│   └── vite.config.js                   # Vite dev server configuration & API proxy
├── .gitignore                           # Repository root gitignore (ignores all .env files)
└── README.md                            # Comprehensive project documentation
```

---

## 6. Demo & Evaluation Accounts

The database seed script initializes representative accounts for all three application roles:

| Role | Pre-Seeded Email | Intended Access |
|---|---|---|
| **System Administrator** | `admin@storerating.com` | Full administrative control: platform analytics, user & store management |
| **Store Owner** | `alex.owner@storerating.com` | Store Owner dashboard: multi-store selector, average rating, customer review feed |
| **Normal User** | `jessica@example.com` | Explore stores, multi-column sorting, submit and update 1–5 star ratings |

> [!TIP]
> **One-Click Quick Demo**:
> For the evaluator's convenience, the **Login page includes Quick Demo one-click buttons** (`Admin Demo`, `Store Owner Demo`, `Normal User Demo`). Clicking any demo button automatically autofills credentials and logs in immediately without manual entry.
>
> Evaluators may also register fresh test accounts via the **Sign Up** page or add users through the **Admin Dashboard**.
>
> *(In accordance with security best practices, actual operational credentials are never exposed in public repositories).*

---

## 7. Local Setup & Installation

### Prerequisites
- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)
- **MySQL Server** (v8.0+ running locally on port `3306`)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/supritabiradar3-spec/store-rating-portal.git
cd store-rating
```

---

### Step 2: Initialize the Database
Ensure your local MySQL service is running. You can initialize the database using the automated seed script or by importing the raw SQL schema:

**Option A — Automated Seed Script (Recommended):**
```bash
cd backend
npm install
npm run seed
```
This script connects to MySQL, creates the `store_rating_db` database if it does not exist, creates all required tables, and seeds demo accounts, stores, and ratings.

**Option B — Direct SQL Import:**
```bash
mysql -u root -p < backend/schema.sql
```

---

### Step 3: Configure Environment Variables
Create your local environment files in the respective directories.

> [!IMPORTANT]
> `.env` files contain machine-specific configurations and secrets. They are strictly excluded from version control via `.gitignore`. You must create them locally using the templates below.

#### 1. Backend Configuration (`backend/.env`)
Create a file named `.env` in the `backend/` directory:
```env
# Server Configuration
PORT=5000

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=store_rating_db

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret_key_here
```

#### 2. Frontend Configuration (`frontend/.env`)
Create a file named `.env` in the `frontend/` directory:
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000
```

---

### Step 4: Start the Backend API Server
```bash
cd backend
npm install
npm start
```
The Express server will start on `http://localhost:5000`.
- Verify server status via the health check endpoint: `http://localhost:5000/api/health`

---

### Step 5: Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`. Open `http://localhost:5173` in your browser.

---

## 8. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `5000` | Port on which the Express REST API server listens |
| `DB_HOST` | Optional | `localhost` | Hostname of the MySQL database server |
| `DB_PORT` | Optional | `3306` | Port number of the MySQL database server |
| `DB_USER` | Optional | `root` | Username used to authenticate with MySQL |
| `DB_PASSWORD` | **Required** | *None* | Password for the MySQL user |
| `DB_NAME` | Optional | `store_rating_db` | Name of the relational database |
| `JWT_SECRET` | Recommended | Fallback default | Secret key used to sign and verify JSON Web Tokens |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Optional | `http://localhost:5000` | Base URL of the backend API (development also utilizes Vite proxy) |

---

## 9. Automated API Test Suite

The backend includes a comprehensive, automated end-to-end test suite (`backend/test-suite.js`) covering authentication, RBAC authorization, CRUD operations, edge cases, and all validation rules.

To execute the test suite:
```bash
cd backend
npm test
```

### Test Suite Coverage (29 / 29 Passing):
- **Authentication**: Admin, Store Owner, and User login validation.
- **Strict Form Validation**: Name length bounds (<20 or >60 characters), password complexity enforcement, address length limits, and email format rules.
- **User Operations**: Signup flow, duplicate email rejection, and in-app password changes.
- **Admin Capabilities**: Dashboard statistics calculation, user filtering, sorting, store creation, and store owner assignment.
- **Normal User Features**: Store listing, address/name search, multi-column sorting, 1–5 star rating submission, and rating modification (upsert).
- **Store Owner Operations**: Store review dashboard, rating calculation, and reviewer identity resolution.
- **Role-Based Access Control**: Route protection verifying that unauthorized roles cannot access admin or owner-exclusive endpoints.

---

## 10. REST API Documentation

All API endpoints are mounted under both `/api/*` and `/*` prefixes for convenience.

### 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new normal user account |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return JWT |
| `POST` | `/api/auth/change-password` | Authenticated | Change current user's password |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role |

### 2. Administrator Endpoints (`/api/admin`) — Requires `ADMIN` Role
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Real-time counts of users, stores, and ratings |
| `GET` | `/api/admin/users` | Admin | Search, filter, and sort registered users |
| `GET` | `/api/admin/users/:id` | Admin | Fetch user details: owned store if Owner, rating history if User |
| `POST` | `/api/admin/users` | Admin | Create a new user (`ADMIN`, `USER`, or `OWNER`) |
| `GET` | `/api/admin/stores` | Admin | Search, filter, and sort registered stores with owner details |
| `POST` | `/api/admin/stores` | Admin | Create a new store and assign it to a Store Owner |
| `GET` | `/api/admin/potential-owners` | Admin | Retrieve list of eligible Store Owners for assignment |

### 3. Store Endpoints (`/api/stores`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/stores` | Public / User | List stores with search, multi-column sorting, average ratings, and user's rating |
| `GET` | `/api/stores/owner/dashboard` | Store Owner | Multi-store selector, average rating, review count, and customer reviews |

### 4. Rating Endpoints (`/api/ratings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ratings` | Authenticated | Submit or update a 1–5 star rating for a store (upsert) |

### 5. System Health (`/api/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System status check and database table counts |

---

## 11. Security & Best Practices

- **Zero Hardcoded Secrets**: Secrets and credentials are managed strictly through environment variables.
- **Password Protection**: Passwords hashed with `bcryptjs` (salt rounds: 10) before storage; plaintext passwords are never saved or logged.
- **SQL Injection Prevention**: All SQL queries utilize parameterized placeholders (`?`) via `mysql2/promise`.
- **JWT Authorization**: Requests to protected routes require a valid `Bearer <token>` header verified through Express middleware.
- **Defensive Error Handling**: API endpoints catch operational errors, prevent sensitive stack trace leaks in client responses, and return structured error messages.
- **Production-Ready Frontend Build**: The frontend compiles cleanly with `npm run build` using Vite with zero bundling errors.
