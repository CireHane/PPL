Phase 1: Initial Setup (First Time)
- docker-compose up --build

Phase 2: Fresh Restart (Reset Everything)
- docker-compose down 
- docker volume rm odza-api-gateway_postgres_data
- docker-compose up --build

Normal Restart (Keep Data)
- docker-compose up


Requiements: Docker (latest version)