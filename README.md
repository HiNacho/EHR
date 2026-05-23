# 🏥 Nacho EHR

A secure, high-performance, modular Electronic Health Record (EHR) and clinical operations platform designed for modern healthcare teams. Built with a robust **Django + PostgreSQL** backend and a sleek, real-time **React + Tailwind CSS** frontend.

---

## 🛠️ Built With

<div align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>

---

## ✨ Features

### 🩺 Clinical Hub & Vitals
*   **Tabbed Clinical Profiles:** Multi-pane stateful clinical hub separating Vitals, History, Notes, and Billing to eliminate workspace clutter.
*   **Real-time Vitals Tracking:** Dynamic time-series charting using Recharts to visualize patient health trends (temperature, pulse, BP).
*   **AI SOAP Note Synthesizer:** Doctor-facing two-pane workspace allowing transcription of unstructured medical recordings into formatted **SOAP notes** (Subjective, Objective, Assessment, Plan).

### 💬 Secure Messaging (HIPAA-Aligned)
*   **Encrypted 1-to-1 Threads:** Private patient-to-doctor messaging and nurse-to-doctor internal consult channels.
*   **Primary Staff Room:** An auto-joined hospital-wide staff group chat. Patients and unauthorized accounts are strictly blocked.
*   **Role Badges & Indicators:** Inline metadata displaying clinical roles (`Doctor`, `Nurse`, `Admin`) to ensure identity verification in threads.

### 📅 Advanced Scheduler
*   **Chronological Availability:** Day-by-day practitioner time slot allocation matching working schedules.
*   **Telehealth Integrations:** Instant, secure Zoom meetings generated automatically for telehealth appointments.

### 💳 Automated Revenue & Signals
*   **Model Signal Automation:** Background dispatching of invoice creation and email simulations catching Django `post_save` signals.
*   **Financial Dashboard:** Aggregated clinical invoicing tracker with outstanding, paid, and overdue metric statuses.
*   **HIPAA Audit Trail:** Secure, immutable database ledger tracking notes creation, modifications, and access history.

---

## 🏗️ Architecture

```
                       ┌──────────────────────┐
                       │    Vite + React      │
                       │    (Port 5173)       │
                       └──────────┬───────────┘
                                  │  REST API / JWT
                                  ▼
                       ┌──────────────────────┐
                       │   Django REST API    │
                       │    (Port 8001)       │
                       └──────────┬───────────┘
                                  │  psycopg2
                                  ▼
                       ┌──────────────────────┐
                       │      PostgreSQL      │
                       │    (Port 5432)       │
                       └──────────────────────┘
```

---

## 🚀 Quick Start

### 📋 Prerequisites
Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### 1. Launch the Services
Spin up the database, backend web service, and frontend server in the background:
```bash
docker-compose up -d
```

### 2. Prepare the Database Schema
Generate and run Django migrations inside the container:
```bash
docker exec nacho_ehr_backend python manage.py makemigrations
docker exec nacho_ehr_backend python manage.py migrate
```

### 3. Seed Realistic Demo Data
Seed the application with structured hospital data (departments, schedules, patients, messages, invoices):
```bash
docker exec nacho_ehr_backend python manage.py seed
```

### 4. Access the Application
*   **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
*   **Backend API Root:** [http://localhost:8001/api/](http://localhost:8001/api/)

---

## 🔐 Security & Access Control Matrix

| Role | Vitals Entry | Clinical Notes Auth | Group Chats | Financials | Patient Portal |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Doctor** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Nurse** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Patient** | ❌ | ❌ | ❌ | ✅ (View/Pay) | ✅ |

---

## 🔑 Demo Accounts

All credentials use the password: **`password123`**

*   **Admin**: `victor@hospital.com`
*   **Doctor (John)**: `john@hospital.com`
*   **Doctor (Scott)**: `scott@hospital.com`
*   **Nurse (Elizabeth)**: `elizabeth@hospital.com`
*   **Nurse (Jane)**: `jane@hospital.com`
*   **Patient (Alice)**: `patient.alice@gmail.com`
*   **Patient (Bob)**: `patient.bob@gmail.com`
