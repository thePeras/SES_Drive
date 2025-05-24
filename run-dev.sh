#!/bin/bash
set -e

echo "Starting development environment..."

docker-compose -f docker-compose.dev.yml down

docker-compose -f docker-compose.dev.yml up --build
