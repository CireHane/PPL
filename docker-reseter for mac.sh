#!/bin/bash
echo "Resetting Docker Containers and Volumes..."
docker compose down -v
docker compose up --build
