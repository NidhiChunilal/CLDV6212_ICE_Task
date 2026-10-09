# Logistics Fleet Delivery Tracker

CLDV6212 Cloud Development — Group ICE Task Presentation.

A full-stack delivery tracking web application with a 5-stage logistics pipeline board, driver assignment directory, and public parcel tracking.

---

## Tech Stack

- **Backend**: ASP.NET Core (.NET 10 Web API), Entity Framework Core
- **Database**: PostgreSQL (Supabase / Docker) with automatic SQLite local fallback
- **Frontend**: React 19, TypeScript, Vite
- **Testing**: xUnit unit tests (.NET 10)
- **Deployment**: Render Blueprint (`render.yaml`), Docker Compose

---

## Project Structure

```text
CLDV6212_ICE_Task/
├── backend/
│   ├── LogisticsFleetTracker.Api/       # ASP.NET Core Web API
│   │   ├── Controllers/                 # Shipments & Drivers controllers
│   │   ├── Data/                        # AppDbContext & DbSeeder
│   │   ├── Models/                      # Shipment, Driver, StatusLog
│   │   └── Migrations/                  # EF Core database migrations
│   ├── LogisticsFleetTracker.Tests/     # xUnit test project
│   ├── LogisticsFleetTracker.slnx       # .NET Solution file
│   └── Dockerfile                       # Container definition for backend
├── frontend/
│   ├── src/                             # React application source code
│   ├── Dockerfile                       # Multi-stage production container
│   ├── nginx.conf                       # Production Nginx reverse proxy
│   └── vite.config.ts                   # Vite configuration with proxy
├── docker-compose.yml                   # Multi-container orchestration
├── render.yaml                          # Render Cloud deployment blueprint
└── README.md
```

---

## Local Development

### 1. Run the Backend API

```bash
cd backend/LogisticsFleetTracker.Api
dotnet run
```
- API Base URL: `http://localhost:5000`
- Swagger Documentation: `http://localhost:5000/swagger`
- When run locally without a PostgreSQL string, the API automatically uses a local SQLite database (`fleet.db`) with pre-seeded demo data.

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose

To run the entire stack (PostgreSQL database, .NET API, and React frontend in Nginx):

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Database: `localhost:5432`

---

## Running Automated Tests

Run the backend unit test suite:

```bash
dotnet test backend/LogisticsFleetTracker.slnx
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/shipments` | List all shipments with assigned drivers |
| `POST` | `/api/shipments` | Create a new parcel shipment |
| `GET` | `/api/shipments/{id}` | Get shipment details by ID |
| `PATCH` | `/api/shipments/{id}/status` | Update delivery status and add status note |
| `PUT` | `/api/shipments/{id}/assign-driver` | Assign or reassign a driver to a shipment |
| `GET` | `/api/shipments/track/{trackingNumber}` | Public lookup by tracking number (e.g. `LFT-DEMO001`) |
| `GET` | `/api/drivers` | List all registered fleet drivers |
| `POST` | `/api/drivers` | Register a new driver |

---

## Cloud Deployment (Render & Supabase)

The repository includes a `render.yaml` blueprint for one-click deployment to Render:

1. Create a PostgreSQL project on Supabase and copy the connection string.
2. In Render, select **New +** > **Blueprint** and connect this repository.
3. Provide the Supabase connection string as the `DATABASE_URL` environment variable.
4. Render provisions:
   - `logistics-fleet-api`: Containerized .NET Web Service
   - `logistics-fleet-ui`: Static Site on CDN