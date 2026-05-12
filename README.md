# CareTrack Clinic MRMS

CareTrack Clinic MRMS is a full-stack Medical Records Management System built for a private clinic. It helps clinic staff manage doctors, patients, diagnosis records, users, and dashboard statistics with secure authentication and role-based access control.

The application was created for the BTEC Full Stack Development assignment scenario: CareTrack Clinic needs a web-based MRMS to replace paper records and disconnected spreadsheets.

## Current Status

The application is implemented and runnable locally.

- Frontend URL: `http://localhost:5173`
- Backend API URL: `http://localhost:5000`
- Database: MongoDB, default local URI `mongodb://127.0.0.1:27017/caretrack_mrms`

Seeded demo data includes:

- 7 users
- 12 doctors
- 30 patients
- 45 diagnosis records

## Technology Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React icons

Backend:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- express-validator
- CORS
- dotenv

## Main Features

- Secure login with JWT
- Password hashing with bcrypt
- Protected API routes
- Role-based authorization
- Admin user management
- Doctor management
- Patient management
- Diagnosis management
- Patient profile page with assigned doctor and linked diagnoses
- Search and filtering
- Dashboard statistics
- Severity badges for diagnosis records
- Responsive medical dashboard interface
- Sample clinic dataset

## Roles And Permissions

Admin:

- View dashboard
- Create, read, update, delete doctors
- Create, read, update, delete patients
- Create, read, update, delete diagnoses
- Create, read, update, delete users

Clinician:

- View dashboard
- View patients
- Update patients
- View diagnoses
- Update diagnoses
- Cannot delete records
- Cannot view or manage doctor profiles directly
- Cannot manage users

Receptionist:

- View dashboard
- View doctors
- Create patients
- View patients
- Cannot manage diagnoses
- Cannot delete records
- Cannot manage users

## Demo Accounts

Admin:

```text
email: admin@caretrack.com
password: Admin12345
```

Clinician:

```text
email: clinician@caretrack.com
password: Clinician12345
```

Receptionist:

```text
email: reception@caretrack.com
password: Reception12345
```

## Project Structure

```text
.
  README.md
  start.ps1
  start.sh
  backend/
    server.js
    config/
      db.js
    models/
      User.js
      Doctor.js
      Patient.js
      Diagnosis.js
    routes/
      authRoutes.js
      userRoutes.js
      doctorRoutes.js
      patientRoutes.js
      diagnosisRoutes.js
      dashboardRoutes.js
    controllers/
      authController.js
      userController.js
      doctorController.js
      patientController.js
      diagnosisController.js
      dashboardController.js
    middleware/
      authMiddleware.js
      roleMiddleware.js
      errorMiddleware.js
    utils/
      generateToken.js
    seed/
      seedAdmin.js
    package.json
    .env.example
  frontend/
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx
      api/
        axios.js
      context/
        AuthContext.jsx
      routes/
        PrivateRoute.jsx
        RoleRoute.jsx
      layout/
        DashboardLayout.jsx
        Sidebar.jsx
        Navbar.jsx
      pages/
        Login.jsx
        Dashboard.jsx
        doctors/
        patients/
        diagnoses/
        users/
        NotFound.jsx
      components/
      utils/
        permissions.js
      index.css
    package.json
    .env.example
```

## Requirements

Install these before running the project:

- Node.js 18 or newer
- npm
- MongoDB Community Server or MongoDB Atlas

For local MongoDB, make sure MongoDB is running on:

```text
127.0.0.1:27017
```

## Quick Start On Windows

From the project root, run:

```powershell
.\start.ps1
```

To reset and load sample data before starting:

```powershell
.\start.ps1 -Seed
```

The script will:

- Create missing `.env` files from `.env.example`
- Install dependencies if `node_modules` is missing
- Check MongoDB connection
- Optionally seed the database
- Start backend and frontend in separate PowerShell windows

## Quick Start On macOS, Linux, Or Git Bash

From the project root, run:

```bash
chmod +x start.sh
./start.sh
```

To reset and load sample data before starting:

```bash
./start.sh --seed
```

The script will:

- Create missing `.env` files from `.env.example`
- Install dependencies if `node_modules` is missing
- Check MongoDB connection
- Optionally seed the database
- Start backend and frontend in the current terminal session

## Manual Setup

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

Backend `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/caretrack_mrms
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For production or a hosted database, replace `MONGO_URI` with a MongoDB Atlas connection string and use a strong private `JWT_SECRET`.

## Render Deployment

Recommended production option: deploy this project as one Docker web service. The Dockerfile builds the React frontend, copies it into the Express backend, and serves both the UI and API from the same Render URL.

Single Docker Web Service:

```text
Service Type: Web Service
Runtime: Docker
Root Directory: leave empty
Dockerfile Path: ./Dockerfile
Health Check Path: /api/health
```

Environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/caretrack_mrms?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<your-single-render-service>.onrender.com
```

In this Docker setup, the frontend uses `/api` as a same-origin API base URL, so `VITE_API_URL` is not required.

After the first deploy, open:

```text
https://<your-single-render-service>.onrender.com
```

The API health check will be available at:

```text
https://<your-single-render-service>.onrender.com/api/health
```

To load demo data into the production MongoDB database, run this once from the Render service shell:

```bash
npm run seed
```

Do not run the seed command on a production database that already contains real clinic data, because it deletes and recreates demo users, doctors, patients, and diagnoses.

### Optional Two-Service Blueprint

The repository includes a Render Blueprint in `render.yaml` for two services:

- `caretrack-mrms-api`: Node/Express backend web service
- `caretrack-mrms`: React/Vite static frontend site

Before deploying:

1. Push this project to GitHub, GitLab, or Bitbucket.
2. Create a MongoDB Atlas cluster and copy the connection string.
3. In Render, create a new Blueprint from this repository.
4. When Render asks for `MONGO_URI`, paste the MongoDB Atlas connection string.
5. Keep the generated `JWT_SECRET`, or set your own long random secret.

Render service settings if creating services manually:

Backend web service:

```text
Root Directory: backend
Runtime: Node
Build Command: npm ci
Start Command: npm start
Health Check Path: /api/health
```

Backend environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/caretrack_mrms?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<your-render-frontend>.onrender.com
```

Frontend static site:

```text
Build Command: cd frontend && npm ci && npm run build
Publish Directory: frontend/dist
Rewrite Rule: /* -> /index.html
```

Frontend environment variable:

```env
VITE_API_URL=https://<your-render-backend>.onrender.com/api
```

After both services are created, make sure:

- Backend `FRONTEND_URL` exactly matches the deployed frontend URL.
- Frontend `VITE_API_URL` exactly matches the deployed backend API URL and ends with `/api`.
- If you rename the Render services, update the URLs in `render.yaml` or in the Render dashboard.

To load demo data into the production MongoDB database, run the backend service shell command once:

```bash
npm run seed
```

Do not run the seed command on a production database that already contains real clinic data, because it deletes and recreates demo users, doctors, patients, and diagnoses.

## Data Model

User:

- `name`
- `email`
- `password`
- `role`: `admin`, `clinician`, `receptionist`

Doctor:

- `fullName`
- `specialty`
- `department`
- `phone`
- `email`
- `availability`
- `createdAt`
- `updatedAt`

Patient:

- `fullName`
- `dateOfBirth`
- `gender`
- `phone`
- `address`
- `assignedDoctor`
- `emergencyContact`
- `createdAt`
- `updatedAt`

Diagnosis:

- `patient`
- `icdCode`
- `description`
- `severity`: `low`, `medium`, `high`, `critical`
- `notes`
- `diagnosedDate`
- `createdBy`
- `createdAt`
- `updatedAt`

Relationships:

- One doctor can have many patients
- One patient belongs to one doctor
- One patient can have many diagnosis records
- One diagnosis belongs to one patient
- One diagnosis is created by one user

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Users:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

Doctors:

- `GET /api/doctors`
- `GET /api/doctors/:id`
- `POST /api/doctors`
- `PUT /api/doctors/:id`
- `DELETE /api/doctors/:id`

Patients:

- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`
- `GET /api/patients/:id/profile`

Diagnoses:

- `GET /api/diagnoses`
- `GET /api/diagnoses/:id`
- `POST /api/diagnoses`
- `PUT /api/diagnoses/:id`
- `DELETE /api/diagnoses/:id`
- `GET /api/diagnoses/patient/:patientId`

Dashboard:

- `GET /api/dashboard/stats`

## Search And Filtering

Doctors:

```text
GET /api/doctors?search=cardiology
GET /api/doctors?specialty=cardiology
GET /api/doctors?department=Heart%20Care
GET /api/doctors?availability=Mon
```

Patients:

```text
GET /api/patients?search=aziz
GET /api/patients?assignedDoctor=<doctorId>
```

Diagnoses:

```text
GET /api/diagnoses?search=I10
GET /api/diagnoses?severity=high
GET /api/diagnoses?patient=<patientId>
```

## Verification Commands

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax check:

```powershell
cd backend
rg --files -g "*.js" -g "!node_modules/**" | ForEach-Object { node --check $_ }
```

API health check:

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "message": "CareTrack MRMS API is running"
}
```

## Important Notes

- `POST /api/auth/register` is admin-protected. Use the seed script to create the first admin user.
- Running `npm run seed` deletes existing users, doctors, patients, and diagnoses, then recreates sample data.
- `start.ps1` and `start.sh` do not reset the database unless you pass `-Seed` or `--seed`.
- If login fails after reseeding, clear browser local storage or logout and login again.
- If the frontend cannot login and shows `ERR_CONNECTION_REFUSED`, check that the backend is running on port `5000`.
- If the backend exits on startup, check that MongoDB is running and `MONGO_URI` is correct.

## Assignment Coverage

Implemented in the application:

- Full-stack MRMS
- Doctor CRUD
- Patient CRUD
- Diagnosis CRUD
- Patient profile with doctor and diagnosis history
- Search and filtering
- Authentication
- Role-based access control
- Dashboard
- Sample test data
- Responsive interface

Separate written assignment evidence may still be needed for BTEC submission, such as research, ERD, wireframes, data dictionary, feedback logs, test tables, screenshots, and final evaluation.
