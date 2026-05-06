# CivicConnect

A full-stack civic issue management platform that enables citizens to report, track, and monitor local civic problems while helping authorities manage complaints efficiently through a centralized digital system.

---

## 🚀 Overview

CivicConnect bridges the communication gap between citizens and local authorities by providing a transparent platform for reporting and resolving civic issues such as:

- Potholes
- Broken street lights
- Water leakage
- Garbage pileups
- Sanitation problems
- Electricity-related issues

The platform allows citizens to submit complaints with location and image evidence, while admins can verify, manage, and resolve issues through a dedicated dashboard.

---

# 🛠 Tech Stack

## Frontend
- React.js
- Tailwind CSS
- Leaflet.js
- OpenStreetMap

## Backend
- Django
- Django REST Framework
- JWT Authentication

## Database
- PostgreSQL

---

# ✨ Features

## 👤 Citizen Features

### Authentication
- Secure Login & Signup
- JWT-based Authentication
- Role-based Access Control

### Community Feed
- View recent complaints in the locality
- Upvote complaints
- Flag spam or duplicate complaints
- Filter complaints by location

### Add Complaint
Users can:
- Add complaint title & description
- Select complaint category
- Upload issue images
- Capture GPS location automatically
- Pin issue on map

### My Complaints
Track personal complaints with statuses:
- Pending
- Verified
- In Progress
- Resolved
- Rejected

### Notifications
- Real-time complaint status updates

### Interactive Map
- Color-coded issue markers by priority
- Nearby issue filtering
- Status filtering
- Distance-based insights

---

## 🛡 Admin Features

### Admin Dashboard
- Manage all complaints
- Search & filter complaints
- Update complaint statuses instantly

### Flagged Issues
- Review suspicious or duplicate complaints

### Saved Problems
- Bookmark important issues

### Analytics Dashboard
- Total complaints
- Resolution rate
- Pending issues
- Top complaint category
- Average resolution time

### Reports
- Category-wise reports
- CSV export support

---

# 🗺 Map Priority System

| Priority | Color |
|----------|-------|
| Immediate | 🔴 Red |
| High | 🟠 Orange |
| Medium | 🟡 Yellow |
| Low | 🟢 Green |

---

# 🔐 Authentication Flow

- JWT token generated after login
- Token attached to every authenticated API request
- Role-based authorization for Citizens and Admins
- Admin accounts created only through backend access

---

# 📂 Project Structure

```bash
CivicFixConnect/
│
├── frontend/          # React Frontend
├── backend/           # Django Backend
├── media/             # Uploaded complaint images
├── requirements.txt
└── README.md
