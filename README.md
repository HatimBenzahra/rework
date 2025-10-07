# Full Stack Application

This project contains a frontend (React + Vite) and backend (NestJS + Prisma + PostgreSQL) setup.

## Project Structure

```
├── frontend/          # React + Vite frontend
└── backend/           # NestJS + Prisma + PostgreSQL backend
```

## Frontend Setup

The frontend is built with React and Vite.

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Backend Setup

The backend is built with NestJS, Prisma, and PostgreSQL.

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

### Getting Started

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure database:**
   - Update the `DATABASE_URL` in `backend/.env` with your PostgreSQL connection string
   - Example: `postgresql://username:password@localhost:5432/mydb?schema=public`

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The backend will be available at `http://localhost:3000`

### API Endpoints

- `GET /` - Hello world message
- `GET /users` - Get all users
- `POST /users` - Create a new user

### Database Schema

The project includes a sample `User` model with the following fields:
- `id` (Int, Primary Key, Auto-increment)
- `email` (String, Unique)
- `name` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run start:dev
```

### Database Management
```bash
cd backend
npx prisma studio  # Open Prisma Studio for database management
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate Prisma client
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
PORT=3000
```

## Next Steps

1. Set up your PostgreSQL database
2. Update the `DATABASE_URL` in the backend `.env` file
3. Run the database migrations
4. Start both frontend and backend servers
5. Begin development!

