#!/bin/bash
# save as: start-local.sh

# Start SSH tunnel in background
ssh -i bastion.pem -L 5433:atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432 ubuntu@13.203.218.48 -N &
SSH_PID=$!

# Wait for tunnel
sleep 2

# Start backend
cd atelier-onboarding-api
source .venv/bin/activate
export $(grep -v '^#' .env.tunnel | xargs)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../UI
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "- SSH Tunnel PID: $SSH_PID"
echo "- Backend PID: $BACKEND_PID"
echo "- Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $SSH_PID $BACKEND_PID $FRONTEND_PID" EXIT
wait