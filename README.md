# UNCW Room & Equipment Booking System
## Project Overview

The UNCW Room & Equipment Booking System is a web-based application that allows campus users to browse, view availability, and reserve study rooms and library equipment through a unified, user-friendly interface.
The system replaces fragmented, desktop-only workflows with a centralized platform that improves accessibility, visibility, and conflict prevention.

---
## Architecture
This project uses a client-server architecture:
 - **Frontend:** React (Vite) + Axios
 - **Backend:** Node.js + Express (REST API)
 - **Database:** MySQL hosted on Azure
 - **Authentication:** Mock or simplified auth for prototype
 - **Testing:** Jest / React Testing Library / Supertest (or similar)

---
## Goals
 1. Centralized booking for rooms and equipment
 2. Real-time availability views (day/week)
 3. Booking creation, viewing, and cancellation
 4. Conflict detection and enforcement
 5. Admin/staff resource management
 6. Demo-ready prototype with seeded data and tests

---
## Core Features
 - Searchable/filterable catalog of rooms and equipment
 - Availability calendar (day/week)
 - Booking workflow with validation
 - Double-booking prevention
 - Admin dashboard for inventory and bookings
 - Seeded demo users and resources
 - Unit + basic integration tests

---
## Tech Stack
**Frontend**
 - React
 - Axios / Fetch API
 - React Router

**Backend**
 - Node.js
 - Express

**Database**
 - Microsoft SQL Azure (RTM) - 12+ (production)
 - mariadb (localhosted for development)

**Testing**
 - Jest
 - React Testing Library

---
## Getting Started
**Prerequisites**
 - Node.js
 - Git
 - npm
 - MariaDB Server

---
## Repository Structure
 - frontend/        # React frontend
 - backend/        # Node/Express backend & DB seed scripts
 - database/     # Migrations
 - docs/

---
## Installation
```
git clone https://github.com/xyluphobia/550Project.git
cd 550Project
```

### Backend Setup
```
cd backend
npm install
```

**Create a .env file:**
The file should be located at `backend/.env` and should contain:
```
DB_HOST=localhost
DB_USER=550user
DB_PASSWORD=yourpassword
DB_NAME=550project
DB_PORT=3306
PORT=5000
```

**Initialize database:**
You must manually create the database once before running migrations & seeds.
Login to MariaDB
```
mariadb -u root -p
```
Create the database:
```
CREATE DATABASE 550project;
```
To seed (or reset) the database with tables & dummy data, run the following script from the root directory:
```
npm run db:reset
```

**Start backend:**
```
npm run dev:backend
```
You can test if you have done everything correctly by running the following command:
```
curl http://localhost:5000/api/users
```
You should expect to receive JSON data containing the seeded users.

### Frontend Setup
```
cd my-app
npm install
npm run dev
```

Frontend runs at:
http://localhost:5173

Backend API runs at:
http://localhost:3000

## Testing
Backend
```
cd server
npm test
```

Frontend
```
cd my-app
npm test
```

---
## User Roles
**Standard User**
 - Browse rooms and equipment
 - View availability
 - Create and cancel bookings
 - View personal bookings

**Admin/Staff**
 - Create/update/delete resources
 - View all bookings
 - Approve/deny bookings (if required)
 - Manage blackout/maintenance periods

---
## Booking Rules & Validation
 - Time overlap prevention
 - Booking duration limits
 - Advance booking windows
 - Resource availability constraints
(See `/docs/booking-rules.md`)

---
## Assumptions & Limitations
 - Simplified or mock authentication
 - Minimal calendar UI (day/week views)
 - Local demo fallback if deployment is restricted
 - MVP scope prioritized for prototype deadline

---
## Success Criteria
 - Demo-ready prototype by May 1, 2026
 - End-to-end booking flow works
 - 0 double-booking failures in tests
 - Local setup in ≤ 10 minutes
 - Basic unit + integration tests included
 - Admin can manage resources and bookings

---
## Documentation
 - API endpoints (`/docs/api.md`)
 - Database schema / ERD
 - Setup and seeding instructions
 - Known limitations

---
## Team
Team 3 ~ {Grayson, Julia, Matthew, Sinclair}
CSC 550 - 002
UNCW Room & Equipment Booking System
