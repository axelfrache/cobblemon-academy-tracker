# Cobblemon Academy Tracker

[![CI](https://github.com/axelfrache/cobblemon-academy-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/axelfrache/cobblemon-academy-tracker/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## Description

**Cobblemon Academy Tracker** is a competitive companion dashboard for the Cobblemon Academy server. It provides real-time player statistics, leaderboards, and detailed profile analytics for Pokemon trainers.

### Core Principles

- **Data-Driven**: Live fetching of player party, PC storage, and capture statistics.
- **Competitive Focus**: Detailed leaderboards for Shiny Hunters, Battlers, and Collectors.
- **Privacy & Security**: Secure read-only integration via standardized APIs.

## Getting Started

The application is divided into 2 parts:
- **Backend**: A high-performance FastAPI service interfacing with the data layer (MongoDB/Cobblemon files).
- **Frontend**: A React 19 + Vite SPA delivering the user experience.

### Prerequisites

- Python 3.13+ & Poetry
- Node.js 20+
- Docker & Docker Compose (optional but recommended)

## Configuration

This project uses environment variables for configuration.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` to match your local setup (e.g., MongoDB credentials).

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | Connection string for MongoDB |
| `DB_NAME` | Name of the database (default: `cobblemon`) |

## Running

### Locally (Development Mode)

**Backend:**
```bash
cd backend
poetry install
poetry run uvicorn cobblemon_academy_tracker_api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then access:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/docs` (Swagger UI)

### Locally (Fully Dockerized)

This will spin up both services and an Nginx reverse proxy to handle routing and CORS.

```bash
docker compose up -d --build
```

Then access:
- Application: `http://localhost:8080` (or configured port)
- API endpoint: `http://localhost:8080/api`

To stop the application:
```bash
docker compose down
```
