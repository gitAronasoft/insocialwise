#!/bin/bash

echo "=========================================="
echo "Starting Full-Stack Application"
echo "Backend (API) will run on http://0.0.0.0:3001"
echo "Frontend (React) will run on http://0.0.0.0:5000"
echo "=========================================="
echo ""

npx concurrently -k \
  -n "Backend,Frontend" \
  -c "cyan,green" \
  "cd server && node index.js" \
  "cd client && PORT=5000 HOST=0.0.0.0 BROWSER=none npm start"
