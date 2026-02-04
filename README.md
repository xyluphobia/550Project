# UNCW Room & Equipment Booking System
## Project Overview

The UNCW Room & Equipment Booking System is a web-based application that allows campus users to browse, view availability, and reserve study rooms and library equipment through a unified, user-friendly interface.
The system replaces fragmented, desktop-only workflows with a centralized platform that improves accessibility, visibility, and conflict prevention.

---
## Architecture
This project uses a client-server architecture:
 - **Frontend:** React (Vite) + React Native (Vite)
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
 - React Native

**Backend**
 - Node.js
 - Express

**Database**
 - Microsoft SQL Azure (RTM) - 12+

**Testing**
 - Jest
 - React Testing Library

---
## Getting Started
**Prerequisites**
 - Node.js
 - Git

---
## Repository Structure
 - client/        # React frontend
 - server/        # Node/Express backend
 - server/db/     # Migrations, schema, seed scripts
 - tests/
 - docs/

---
## Installation
```
git clone https://github.com/xyluphobia/550Project.git
cd 550Project
```

### Backend Setup
```
cd server
npm install
```

**Create a .env file:**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=uncw_booking
PORT=5000
AUTH_MODE=mock
```

**Initialize database:**
```
npm run db:migrate
npm run db:seed
```

**Start backend:**
```
npm run dev
```
### Frontend Setup
```
cd my-app
npm install
npm run dev
```

Frontend runs at:
http://localhost:3000

Backend API runs at:
http://localhost:5000

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
