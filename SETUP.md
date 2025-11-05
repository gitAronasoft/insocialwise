# InSocialWise - Quick Setup Guide

## Initial Setup (First Time Only)

### Step 1: Install Dependencies

You need to install dependencies for both the server and client:

```bash
# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies  
cd client
npm install
cd ..
```

This only needs to be done once (or when dependencies change).

### Step 2: Verify Environment Variables

Make sure both `.env` files exist with correct values:

**server/.env** - Should contain:
- Database connection (MySQL)
- JWT secret
- Email configuration
- Facebook/LinkedIn API credentials

**client/.env** - Should contain:
- Port configuration
- Backend URL
- Facebook App ID
- LinkedIn Client ID

✅ These files already exist and are configured!

### Step 3: Test Database Connection

```bash
cd server
node test-db-connection.js
```

This will verify your remote MySQL database is accessible.

## Running the Application

### Option 1: Using Node Script (Recommended)
```bash
node start.js
```

### Option 2: Using Shell Script
```bash
./start.sh
```

### Option 3: Manual (Two Terminal Windows)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Accessing the Application

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3001
- **On Replit**: The URLs will be displayed in the console

## Troubleshooting

### Dependencies Not Installed
If you get "module not found" errors:
```bash
cd server && npm install
cd ../client && npm install
```

### Database Connection Issues
1. Check server/.env has correct database credentials
2. Verify the remote MySQL server is accessible
3. Run `cd server && node test-db-connection.js`

### Port Already in Use
- Stop any other processes using ports 3001 or 5000
- Or modify the ports in the .env files

### Frontend Can't Connect to Backend
- Make sure backend is running first
- Check REACT_APP_BACKEND_URL in client/.env

## Development Workflow

1. **Pull latest changes**: `git pull origin develop`
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Install new dependencies if added**: `npm install` in server or client
4. **Make changes**
5. **Test locally**: Run both servers and test
6. **Commit**: `git add . && git commit -m "feat: your feature"`
7. **Merge develop**: `git merge develop` (resolve conflicts if any)
8. **Push**: `git push origin feature/your-feature`
9. **Create PR**: From feature branch to develop

## File Structure Reference

```
InSocialWise/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── context/       # Auth context
│   └── .env              # Frontend config
├── server/                # Node.js Backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── utils/            # Utilities
│   └── .env             # Backend config
├── start.js             # Start both servers
├── start.sh             # Alternative shell script
├── SETUP.md             # This file
└── replit.md            # Full architecture docs
```

## Important Reminders

- **Database**: Remote MySQL (NOT local, NOT PostgreSQL)
- **Don't commit**: .env files, node_modules, build folders
- **Coordinate**: Database schema changes with team
- **Review**: replit.md for complete architecture

## Quick Commands

```bash
# Setup (first time)
cd server && npm install && cd ../client && npm install && cd ..

# Run app
node start.js

# Test database
cd server && node test-db-connection.js

# Server only
cd server && npm run dev

# Client only
cd client && npm start
```

---

For detailed architecture and feature documentation, see [replit.md](./replit.md)
