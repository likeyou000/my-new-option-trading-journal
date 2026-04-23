#!/bin/bash
while true; do
  npx next dev -p 3000
  echo "Server died, restarting in 2s..."
  sleep 2
done
