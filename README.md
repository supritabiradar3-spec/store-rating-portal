# Roxiler Store Rating Application

A full-stack, responsive Store Rating web application built strictly according to the **FullStack Intern Coding Challenge - V1.1** specifications.

---

## 1. Tech Stack

- **Frontend**: React.js (Vite)
- **Backend**: Node.js & Express.js
- **Database**: MySQL (using `mysql2/promise` connection pool)
- **Styling**: Plain/Normal CSS (no complex or heavy external frameworks)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing

---

## 2. User Roles & Implemented Features

### 1. System Administrator
- **Single Login System**: Authenticate using administrator credentials.
- **Dashboard Statistics**: Real-time counter of:
  - Total number of registered users.
  - Total number of registered stores.
  - Total number of submitted customer ratings.
- **User Management**:
  - View sortable list of users (name, email, address, role).
  - Search and filter users by Name, Email, Address, and Role.
  - View individual user details.
  - If the user is a Store Owner, their owned store details and average rating are displayed.
  - Add new Normal Users, Store Owners, or Administrator accounts with strict validation.
- **Store Management**:
  - View sortable list of stores (name, email, address, overall rating, assigned owner).
  - Search and filter stores by Name, Email, and Address.
  - Add new stores and assign them to registered store owners.
- **Logout**.

### 2. Normal User
- **Signup & Login**: Register a new account with strict field validation; single login system.
- **Password Management**: Update account password while logged in.
- **Store Browsing & Search**:
  - View a list of all registered stores with addresses and overall average ratings.
  - Search stores by Store Name and Address.
  - Sort table by Name, Address, and Rating (ascending/descending).
- **Rating Management**:
  - Submit ratings from 1 to 5 stars for stores.
  - View user's own submitted rating.
  - Modify existing submitted ratings.
  - Database uniqueness constraint prevents duplicate ratings per store per user.
- **Logout**.

### 3. Store Owner
- **Login**: Single login system.
- **Password Management**: Update account password while logged in.
- **Dashboard Functionalities**:
  - View average rating of their store.
  - View total number of customer ratings received.
  - View sortable list of customers who submitted ratings (Name, Email, Address, and Rating given).
- **Logout**.

---

## 3. Strict Form Validation Rules

Both Frontend and Backend strictly validate all input data according to the challenge requirements:

| Field | Rule | Description |
|---|---|---|
| **Name** | 20–60 characters | Applied to User Name and Store Name |
| **Address** | Maximum 400 characters | Enforced on user addresses and store addresses |
| **Password** | 8–16 characters | Must contain at least **1 uppercase letter** and at least **1 special character** |
| **Email** | Standard email format | Enforced using standard regex validation |
| **Rating** | Integer 1 to 5 | Enforced via UI star selector, API validation, and MySQL table check constraint |

---

## 4. Database Schema

The database `store_rating_db` consists of three core relational tables:

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

## 5. Folder Structure

```
store-rating/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               # JWT authentication & role-based access control
│   ├── routes/
│   │   ├── auth.js               # Login, signup, change-password, me
│   │   ├── admin.js              # Stats, user CRUD, store CRUD, owner lookup
│   │   ├── stores.js             # Store listing, search & store owner dashboard
│   │   └── ratings.js            # Rating submission & upsert logic
│   ├── utils/
│   │   └── validation.js         # Strict validation matching challenge rules
│   ├── .env                      # Database credentials and JWT secret
│   ├── package.json              # Backend dependencies and scripts
│   ├── schema.sql                # SQL schema and seed queries
│   ├── seed.js                   # Database seed script for demo accounts
│   ├── server.js                 # Express server entry point
│   └── test-suite.js             # Automated end-to-end API test suite (29 tests)
├── frontend/
│   ├── src/
│   │   ├── assets/               # Icons and static images
│   │   ├── components/
│   │   │   ├── ChangePasswordModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StarRating.jsx
│   │   │   └── UserDetailModal.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── UserStoresPage.jsx
│   │   ├── services/
│   │   │   └── api.js            # Frontend API client
│   │   ├── utils/
│   │   │   └── validation.js     # Frontend form validation
│   │   ├── App.css               # Clean, modern CSS styling
│   │   ├── App.jsx               # Role-based dashboard router
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env                      # Frontend API URL configuration
│   ├── index.html
│   ├── package.json
│   └── vite.config.js            # Vite configuration with API proxy
├── .gitignore
└── README.md
```

---

## 6. Demo Login Credentials

The database comes pre-seeded with accounts for all three roles:

| Role | Email | Password | Details |
|---|---|---|---|
| **System Administrator** | `admin@storerating.com` | `Admin@123` | Full dashboard stats, user & store management |
| **Store Owner** | `alex.owner@storerating.com` | `Owner@123` | Store stats, average rating, customer reviews |
| **Normal User** | `jessica@example.com` | `User@123` | Browse stores, submit & modify ratings |

*(Note: On the login page, you can also click the quick demo buttons to autofill these credentials immediately).*

---

## 7. How to Setup and Run

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server (running on localhost:3306)

### Step 1: Database Setup
Make sure MySQL is running. Create and seed the database using `backend/seed.js`:
```bash
cd backend
npm run seed
```
*(Or import `backend/schema.sql` via MySQL CLI / Workbench)*

### Step 2: Environment Variables
Backend `.env` (`backend/.env`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=store_rating_db
JWT_SECRET=your_jwt_secret_key_here
```

Frontend `.env` (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### Step 3: Start the Backend Server
```bash
cd backend
npm start
```
The backend starts on `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`

### Step 4: Start the Frontend Application
```bash
cd frontend
npm run dev
```
The frontend starts on `http://localhost:5173`. Open your browser at `http://localhost:5173`.

---

## 8. Automated API Test Suite

An automated test suite is included in `backend/test-suite.js` to verify every endpoint and validation requirement:

```bash
cd backend
npm test
```

**Results: 29 passed, 0 failed**, testing:
- Admin, Owner, and User login
- Form validation checks (Name < 20 chars, Password rules, Address rules)
- User signup and password update
- Admin dashboard statistics, user filtering, sorting, store creation
- Normal user store search, rating submission, rating modification (upsert)
- Store owner review dashboard
- Role-based access control (RBAC) and route protection

---

## 9. API Reference

### Authentication (`/auth`)
- `POST /auth/login` - User login (all roles)
- `POST /auth/signup` - Normal user registration
- `POST /auth/change-password` - Update password (authenticated)
- `GET /auth/me` - Get profile of authenticated user

### Administrator (`/admin`) - Requires ADMIN role
- `GET /admin/stats` - Total users, total stores, total ratings
- `GET /admin/users` - Search, filter, and sort users
- `GET /admin/users/:id` - User detail (includes store & rating if owner)
- `POST /admin/users` - Create new user (ADMIN, USER, or OWNER)
- `GET /admin/stores` - Search, filter, and sort stores
- `POST /admin/stores` - Create new store and assign owner
- `GET /admin/potential-owners` - List potential store owners

### Stores (`/stores`)
- `GET /stores` - List stores, search by name/address, sort, show overall and current user rating
- `GET /stores/owner/dashboard` - Store owner view: store details, average rating, customer reviews (Requires OWNER role)

### Ratings (`/ratings`)
- `POST /ratings` - Submit or modify store rating (1–5) (Requires authentication)
