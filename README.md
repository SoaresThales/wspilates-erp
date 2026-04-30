# WS Pilates ERP (Core)

> Internal SaaS system for operational, financial, and communication management of WS Pilates.

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Node.js](https://img.shields.io/badge/node.js-backend-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/postgresql-database-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/docker-container-2496ED?logo=docker)

---

## Overview

This project was built from a real operational problem: manual generation of payment receipts.

It started as a simple script and evolved into a structured backend system designed to:

- automate receipt generation
- ensure legal validity through digital signatures
- reduce manual data entry
- serve as the foundation for a full ERP system

---

## Current State (v1.1 — Organized Engine)

Production-ready and in use.

- Refactored Frontend logic with modular `main.js`
- Digital signature using e-CNPJ certificate (P12/PFX)
- Legally valid documents generated server-side
- Business rules for payment plans (monthly, semiannual, annual)
- Secure handling of credentials via environment variables
- Linux-based execution with permission control

---

## Project Structure
```
wspilates-erp/
├── public/
│ ├── images/
│ ├── javascripts/
│ │ └── main.js # Refactored for clarity and maintenance
│ └── stylesheets/
│ ├── style.css
│ └── estilo_recibo.css
├── routes/
│ ├── index.js
│ └── users.js
├── views/
│ ├── error.jade
│ ├── index.jade
│ ├── layout.jade
│ ├── index.html
│ └── template_recibo.html
├── cert/ # Digital certificates (P12/PFX)
├── bin/
│ └── www # Server entry point
├── .env
├── .env.example
├── .gitignore
├── app.js
├── docker-compose.yml # Infrastructure for PostgreSQL
├── banco_recibos.db # Legacy storage (Migration active)
├── package.json
├── package-lock.json
└── README.md
```
---

## Execution Flow (Core Feature)

End-to-end automated receipt generation with no user interaction required.

### Flow

1. Client triggers a request (HTTP endpoint)
2. Backend processes business rules (plan, amount, metadata)
3. HTML template is dynamically populated
4. Puppeteer renders HTML → PDF
5. PDF is digitally signed using certificate (PFX/P12)
6. Signed document is returned directly to the browser

### Result

- Download starts immediately
- Document is legally valid
- No manual steps involved

---

## Local Setup

### Requirements

- Node.js >= 18
- Docker + Docker Compose
- Git

---

### Clone repository

```bash
git clone https://github.com/SoaresThales/wspilates-erp.git
cd wspilates-erp
```

---

### Environment variables

Create .env file:

```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=wspilates
DB_USER=postgres
DB_PASSWORD=postgres

CERT_PATH=./cert/certificate.pfx
CERT_PASSWORD=your_password
```

---

### Start database (optional / future PostgreSQL)

```bash
docker-compose up
```

---

### Install dependencies

```bash
npm install
```

---

### Run application

```bash
npm run dev
```

or

```bash
node app.js
```

---

### Expected behavior

- Server running at: http://localhost:3000
- Receipt generation endpoint active
- PDF generation working
- Digital signature applied (requires valid certificate)

---

### Technical Decisions

- Server-side PDF generation for consistency and control
- Digital signature embedded in backend flow (not externalized)
- Environment-based configuration for security
- Gradual evolution: script → modular backend → ERP

---

## Roadmap

### Phase 2 — Data Layer

- [x] Migration path to PostgreSQL (Docker)
- [ ] Relational modeling (Students, Plans, Receipts, Scheduling)
- [ ] Admin dashboard (React)

### Phase 3 — Automation

- [ ] AutomaticScheduled jobs (CRON)
- [ ] Email delivery (NodeMailer)
- [ ] Workflow automation (n8n, WhatsApp integration)

### Phase 4 — Full ERP

- [ ] Scheduling system (check-in / check-out)
- [ ] Instructor commission calculation
- [ ] Student enrollmentGitOps-based deployment
- [ ] Secrets management (SOPS)

---

## Status

> Actively developed. Core functionality is already used in a real environment.

---

## Author

- Thales Soares
  - [GitHub](https://github.com/SoaresThales)
  - [LinkedIn](https://www.linkedin.com/in/thales-soares-dev/)
  - [Site](https://soaresthales.github.io/)
