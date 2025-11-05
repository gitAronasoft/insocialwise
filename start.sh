#!/bin/bash

echo "🚀 Starting InSocialWise Application..."
echo ""

# Start backend in background
echo "✅ Starting Backend (port 3001)..."
(cd server && npm run dev) &
SERVER_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend in background
echo "✅ Starting Frontend (port 5000)..."
(cd client && BROWSER=none npm start) &
CLIENT_PID=$!

echo ""
echo "📝 Both servers are starting..."
echo "   - Backend API: http://0.0.0.0:3001"
echo "   - Frontend: http://0.0.0.0:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle Ctrl+C
trap "echo ''; echo '🛑 Shutting down...'; kill $SERVER_PID $CLIENT_PID; exit" INT

# Wait for both processes
wait
