## Phase 1: Initial Setup (First Time)
```bash
cd Backend
npm install
docker-compose up --build
```

## Phase 2: Fresh Restart (Reset Everything - Clears Database)
```bash
cd Backend
docker-compose down 
docker volume rm odza-user-data
npm install
docker-compose up --build

# Recently changed the namings to match the company name (odza) so yall gotta
docker-compose down -v
docker-compose up --build

# !!! This deletes ALL images and container fully, !!! SO WATCHOUT IF YOU GOT A IMPORATNT CONTAINER !!!
```

## Normal Restart (Keep Existing Data)
```bash
cd Backend
docker-compose up
```

## Check if Running
```bash
docker ps
# Should show: odza-user-postgres (Healthy) and odza-api-gateway (Running)
```

## Test Backend Health
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","service":"odza-api-gateway"}
```

## Ports
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432


## Requirements
- Docker (latest version)
- Docker Desktop must be running
