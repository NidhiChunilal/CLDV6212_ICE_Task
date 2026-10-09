# Logistics Fleet Tracker 🚚📦
### Cloud Full-Stack Logistics & Delivery Management Platform (.NET 10 Stack)

A cloud-native delivery tracking application designed for courier companies and logistics dispatchers. Built with a containerized **.NET 10 Web API**, a responsive **React / TypeScript / Vite** frontend, and **PostgreSQL (Supabase / Docker)**, fully orchestrated via **Docker Compose** and **GitHub Actions**.

---

## 1. Problem Justification & Real-World Context

South African last-mile courier services face significant bottlenecks due to fragmented tracking systems, lack of real-time communication between dispatchers and drivers, and inadequate customer visibility. Deliveries are frequently delayed without automated status logs or transparent auditing.

**Logistics Fleet Tracker** addresses this with a centralized three-tier platform:
1. **Dispatcher Dashboard**: Real-time management screen for logistics coordinators to register parcels, generate unique tracking identifiers (`LFT-XXXXXXXXXXXX`), and assign available drivers.
2. **Mobile Driver Portal**: Lightweight, touch-friendly portal for drivers to view assigned manifests and update shipment status (`Dispatched`, `In Transit`, `Out for Delivery`, `Delivered`, `Delayed`) with timestamped notes.
3. **Public Customer Tracking Search**: Open search interface where recipients can query their tracking number without authentication to view real-time package milestones, current driver details, and historical audit timelines.

---

## 2. Architecture & Tech Stack

```
                   ┌─────────────────────────────────────────┐
                   │           Client Web Browser            │
                   └────────────────────┬────────────────────┘
                                        │ Port 3000
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │    Frontend Service (Nginx / React 19)  │
                   │    - Dispatcher Dashboard               │
                   │    - Driver Portal                      │
                   │    - Public Customer Tracking           │
                   └────────────────────┬────────────────────┘
                                        │ Reverse Proxy / Port 5000
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │   Backend API Service (.NET 10 Web API) │
                   │   - ASP.NET Core REST Endpoints         │
                   │   - Entity Framework Core 10 ORM        │
                   │   - Swagger OpenAPI Documentation       │
                   └────────────────────┬────────────────────┘
                                        │ Port 5432 / TLS
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │   Persistent PostgreSQL Database         │
                   │   - Local: Docker Postgres Container    │
                   │   - Cloud: Supabase Free-Tier DB        │
                   └─────────────────────────────────────────┘
```

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Nginx multi-stage alpine container, custom responsive slate CSS |
| **Backend API** | ASP.NET Core (.NET 10) | RESTful API, Swagger OpenAPI UI, Entity Framework Core 10 |
| **Database** | PostgreSQL 16 | EF Core Migrations, connection pooling, seed data generator |
| **Containerization** | Docker & Docker Compose | Multi-stage Dockerfiles, healthchecks, bridge networks |
| **CI/CD** | GitHub Actions | Automated build, test, Docker verification, Trivy security scanning |
| **Cloud Hosting** | Render & Supabase | 100% Free-Tier compliant ($0 cost) |

---

## 3. Quick Start — Local Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- Alternatively: [.NET 10 SDK](https://dotnet.microsoft.com/) & [Node.js 20+](https://nodejs.org/)

### Run Full Stack with One Command (Docker Compose)
Clone the repository and launch the containerized stack:

```bash
# 1. Clone repository
git clone https://github.com/NidhiChunilal/CLDV6212_ICE_Task.git
cd CLDV6212_ICE_Task

# 2. Boot all services locally
docker compose up --build
```

Once started:
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **PostgreSQL Database**: `localhost:5432` (`fleet_db`)

---

### Running Without Docker (Manual Local Setup)

#### 1. Backend (.NET 10 API)
```bash
cd backend/LogisticsFleetTracker.Api
dotnet restore
dotnet run
```
API runs on `http://localhost:5000`.

#### 2. Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 4. API Documentation & REST Endpoints

OpenAPI / Swagger documentation is available at `http://localhost:5000/swagger`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/shipments` | List all registered fleet shipments (includes driver info) |
| `POST` | `/api/shipments` | Register a new shipment & generate unique `LFT-` tracking number |
| `GET` | `/api/shipments/{id}` | Get shipment details by ID including status history logs |
| `GET` | `/api/shipments/track/{trackingNumber}` | Public lookup by tracking number (e.g. `LFT-DEMO001`) |
| `PATCH` | `/api/shipments/{id}/status` | Update delivery status (`In Transit`, `Delivered`, etc.) & append log |
| `GET` | `/api/drivers` | List all active fleet drivers |
| `GET` | `/api/drivers/{id}/shipments` | List all shipments assigned to a specific driver |

---

## 5. Environment Variables & Configuration

Copy `.env.example` to `.env` to override local defaults:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Local PostgreSQL database name | `fleet_db` |
| `POSTGRES_USER` | Local PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | Local PostgreSQL password | `postgres` |
| `DATABASE_URL` | EF Core database connection string | Local container or Supabase URI |
| `VITE_API_URL` | Frontend target URL for backend API | `http://localhost:5000/api` |

---

## 6. Pre-Seeded Demonstration Data

On first startup, the database automatically provisions and seeds the following records for live demonstration:

### Fleet Drivers:
- **Thabo Mokoena** (`ND 12345`) — Contact: `071 000 0001`
- **Ayesha Khan** (`ND 67890`) — Contact: `072 000 0002`
- **Jason Naidoo** (`ND 24680`) — Contact: `073 000 0003`

### Sample Tracking Numbers:
- `LFT-DEMO001`: In Transit (Assigned to Thabo Mokoena)
- `LFT-DEMO002`: Dispatched (Assigned to Ayesha Khan)
- `LFT-DEMO003`: Delivered (Assigned to Jason Naidoo)
- `LFT-DEMO004`: Delayed (Assigned to Thabo Mokoena)
- `LFT-DEMO005`: Pending Dispatch (Unassigned)

---

## 7. Group Team Roles & Contributions

| Member | Role | Key Contributions |
|---|---|---|
| **Youvay** | **Group Leader & DevOps** | Repository configuration, branch protections, multi-stage Dockerfiles, root `docker-compose.yml`, GitHub Actions CI/CD workflows, Render provisioning. |
| **Nidhi** | **Backend API & Database Lead** | Supabase PostgreSQL schema, EF Core 10 models, RESTful controllers (`ShipmentsController`, `DriversController`), migrations & seed data engine. |
| **Kiasha** | **Frontend Architecture Lead** | React/Vite shell architecture, Dispatcher Dashboard view, Shipment registration form, API integration service, state management. |
| **Rhea** | **Driver & Customer UI Lead** | Mobile-optimized Driver Portal, Public Customer Tracking search, CSS delivery progress milestone stepper, audit trail logger, responsive UI styling. |

---

## 8. Deployment & Free-Tier Compliance

- **Web Hosting**: Render Free Web Services (Docker runtime).
- **Cloud Database**: Supabase Free PostgreSQL Tier.
- **CI/CD**: GitHub Actions (Free public repository workflows).
- **Container Registry**: Docker Hub / GitHub Container Registry.
- **Cost**: **$0.00 (100% Free Tiers)**.