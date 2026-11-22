# Application Setup Guide

## Current Docker support

The current `docker-compose.yml` defines **only PostgreSQL**. It does not define a frontend service, a backend service, or a migration/seed service. As a result, Docker Compose cannot currently start the complete application. This guide documents what the existing configuration can run without changing it.

## Prerequisites

- Git
- Docker Desktop, or Docker Engine with Docker Compose

## Clone the repository

No repository clone URL is configured in this workspace. Replace the sample owner and repository with the actual hosting location:

```powershell
git clone https://github.com/OWNER/REPOSITORY.git
Set-Location REPOSITORY
```

## Environment configuration

add `.env` file at the root 
sample env . Here I havent used any paid api keys so I am exposing it.Otherwise we shouldnt put env in git .
DATABASE_URL=postgresql://todo:todo@127.0.0.1:5433/todo
JWT_ACCESS_SECRET=8fK2mP9xR4vT7qL1nW6zB3cY0aH5jD8sE2uG9iQ4oX7pM1vN
JWT_REFRESH_SECRET=Z6wN3kT9pL2xQ8bR5yF1mV7cJ4hS0dE6uA9iG2oP5qX8nC1z
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=3d
FRONTEND_URL=http://localhost:5173
PORT=3001
BCRYPT_ROUNDS=12
NODE_ENV=development

## Start the configured Docker service

From the project root:

```powershell
docker compose up -d
docker compose ps
```

This starts the `postgres` service using PostgreSQL 16. The host port `5433` maps to the container port `5432`; database files persist in the `todo-postgres` named volume.

The repository's migration and seed scripts are backend npm scripts, but Compose does not provide a backend container to run them. The current Docker configuration therefore does not initialize the application schema or seed its Personal and Work categories. There is no Docker-only command for those operations in the current project.

after starting the server , we should seed the data 

## To seed the data

npm run db:migrate
npm run db:seed


## URLs and ports

| Component | Address or port in the code/configuration | Available from current Compose? |
| --- | --- | --- |
| PostgreSQL | `localhost:5433` (container port `5432`) | Yes |
| Frontend development server | `http://localhost:5173` 
| Backend API | `http://localhost:3001` 
| Swagger UI | `http://localhost:3001/api/docs`


## Stop the service

```powershell
docker compose down
```

This removes the container and network but preserves the named database volume. `docker compose down -v` also deletes the volume and its persisted database data; only use it when you intend to erase that data.
