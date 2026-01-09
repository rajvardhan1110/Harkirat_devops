#  Monitoring with Prometheus & Grafana (Node.js)

This project demonstrates basic application monitoring using **Prometheus** and **Grafana** with a **Node.js (Express)** application running inside Docker containers.

---

## 🔵 Prometheus

**Prometheus** is an open-source monitoring and alerting system designed to collect and store **time-series metrics**.

### What Prometheus Does
- Collects numeric metrics over time
- Uses a **pull-based model** (scrapes metrics)
- Stores data as **time-series**
- Exposes metrics through an HTTP endpoint (`/metrics`)
- Uses **PromQL (Prometheus Query Language)** for querying

### Core Prometheus Concepts
- **Metric** – A numeric measurement (request count, latency, memory usage)
- **Time Series** – Metric + labels + timestamp
- **Labels** – Key-value pairs to filter and group metrics
- **Scrape Interval** – How often Prometheus collects metrics
- **Job** – Logical name for a group of targets
- **Target** – An application exposing a `/metrics` endpoint

### Prometheus in This Project
- Scrape interval: **15 seconds**
- Job name: `nodejs-app`
- Target: `node-app:3000`
- Metrics exposed using `prom-client`

---

## 🟠 Grafana

**Grafana** is an open-source **visualization and dashboarding tool**.

### What Grafana Does
- Does **not store data**
- Connects to Prometheus as a data source
- Executes **PromQL queries**
- Displays metrics using dashboards and panels

### Grafana in This Project
- Uses Prometheus as the data source
- Visualizes:
  - Request rate
  - API latency
  - Error count
- Accessible on **port 3001**

---

## ⚙️ Monitoring Flow

User Request  
↓  
Node.js Application  
↓  
`/metrics` Endpoint  
↓  
Prometheus (scrapes every 15s)  
↓  
Grafana (visualization)

---

##  Project Structure (Important Files Only)

.
├── docker-compose.yml # Runs Node app, Prometheus, Grafana
├── Dockerfile # Node.js application container
├── prometheus.yml # Prometheus scrape configuration
├── src/
│ ├── index.ts # Express server
│ ├── metrics/ # Prometheus metrics & metricsMiddleware
│ └── middleware.ts # Optional custom middleware
├── package.json
└── README.md


---

##  Services & Ports

| Service      | Port |
|-------------|------|
| Node.js App | 3000 |
| Prometheus  | 9090 |
| Grafana     | 3001 |

---

##  Summary

- **Prometheus** collects and stores metrics
- **Grafana** visualizes metrics
- **Node.js** exposes `/metrics`
- **Docker Compose** runs the full monitoring stack

---

##  Use Cases

- Monitor API performance
- Track request rates
- Detect slow endpoints
- Visualize application health

---


