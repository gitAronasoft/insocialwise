# InSocialWise Full-Stack Application

## Overview
This is a full-stack social media management application with:
- **Frontend**: React application (port 5000)
- **Backend**: Node.js/Express API (port 3001)
- **Database**: Remote MySQL database (already configured)

## Project Structure
```
.
├── client/          # React frontend application
├── server/          # Node.js backend API
├── start.js         # Process manager to run both servers
└── start-all.sh     # Shell script alternative
```

## Running the Application

### Quick Start
Run both servers with a single command:
```bash
node start.js
```

This will start:
- Backend API on `http://0.0.0.0:3001`
- Frontend React app on `http://0.0.0.0:5000`


## Configuration

### Environment Variables
- **Server** (.env in `server/`): Contains database credentials, JWT secret, email config, Facebook/LinkedIn API keys
- **Client** (.env in `client/`): Contains React app config and backend URL

### Database
The application is connected to a remote MySQL database:
- Host: 194.163.46.7
- Database: u742355347_insocial_newdb
- No need to create a new database

## Dependencies
All dependencies are installed in their respective directories:
- Server dependencies: `server/node_modules/`
- Client dependencies: `client/node_modules/`

## Tech Stack
- **Frontend**: React 18, React Router, Axios, Socket.io-client, Bootstrap, ApexCharts
- **Backend**: Node.js, Express, Sequelize, MySQL2, Socket.io, JWT, Nodemailer
- **Real-time**: Socket.io for live messaging and updates

## Notes
- The backend connects to a remote MySQL database (credentials in server/.env)
- Frontend is configured to connect to backend at http://0.0.0.0:3001
- Socket.io is used for real-time features like messaging

## Recent Changes (October 11, 2025)
- Installed all project dependencies
- Configured environment variables for local Replit development
- Created process manager scripts for running both servers
- Verified database connection and server functionality
