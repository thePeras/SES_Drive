#!/bin/bash

echo "Starting backend as 'appuser'"
sudo -u appuser npm --prefix /app/backend run dev &

echo "Starting root-backend"
npm --prefix /app/root-backend run dev &

wait