# CivicFix: Backend Architecture & Implementation Plan

This document provides a detailed breakdown of the CivicFix backend architecture, designed to be scalable, secure, and performant.

---

## 1. High-Level Architecture

The CivicFix backend is built using **Django** and **Django REST Framework (DRF)**. It follows a decoupled architecture, serving as a RESTful API for the React frontend.

```mermaid
graph TD
    A[Frontend: React] -->|HTTPS / JWT| B[API Gateway: DRF]
    B --> C[Authentication Layer: SimpleJWT]
    B --> D[Business Logic: Views & Serializers]
    D --> E[Data Layer: Django Models]
    E --> F[(Database: Neon PostgreSQL)]
    D --> G[Media Storage: Cloudinary]
    D --> H[External APIs: Nominatim Geocoding]
```

---

## 2. Core Components

### A. Authentication & Security
*   **SimpleJWT**: Implements stateless authentication. Access tokens have a short lifespan, while refresh tokens allow users to stay logged in securely.
*   **Permissions**: 
    *   `IsAuthenticated`: Most endpoints require a valid token.
    *   `IsAdminUser`: Specific endpoints (like restoring flagged issues or deleting reports) are restricted to administrators.
*   **CORS**: `django-cors-headers` is configured to allow requests specifically from the frontend domain.

### B. App Modules
The backend is divided into two primary Django apps:

1.  **`users` App**:
    *   **Custom User Model**: Inherits from `AbstractUser` to support email-based identification and custom roles (`is_admin`, `is_citizen`).
    *   **Serializers**: Handles secure registration and profile data conversion.

2.  **`issues` App**:
    *   **Issue Model**: Stores title, description, category, status, coordinates, address, and photo references.
    *   **Related Models**: 
        *   **Comment**: Allows discussion on issues.
        *   **Upvote**: Tracks community support for issues.
        *   **Flag**: Community moderation system to report inappropriate content.
        *   **TimelineEvent**: Tracks the history of an issue's status updates and progress notes.
    *   **Status Workflow**: Managed through a `CharField` with predefined choices (`pending`, `verified`, `in_progress`, `resolved`, `rejected`). Status changes automatically generate Timeline Events.

---

## 3. Data Flow & Processing Logic

### A. The "Smart" Serializer
The `IssueSerializer` is responsible for more than just data conversion; it handles **Location Intelligence**:
*   **Geocoding**: If a user provides an address string without coordinates, the serializer calls the Nominatim API to resolve `lat` and `lng`.
*   **Reverse Geocoding**: If a user provides coordinates without an address, the serializer resolves the readable address.
*   **Validation**: Ensures that every issue has at least one location source before saving.

### B. Media Handling (Cloudinary)
Unlike local file system storage, CivicFix integrates with **Cloudinary** for scalable, cloud-based media management.
* Uploaded images are stored securely on Cloudinary servers.
* `cloudinary_storage` integrates natively with Django's `ImageField`.
* The `photo_url` is automatically serialized to provide absolute Cloudinary URLs to the frontend.

---

## 4. Deployment Strategy (Render)

### A. Production Stack
*   **Web Server**: **Gunicorn** (Green Unicorn) is used as the WSGI HTTP Server. It is faster and more secure for production than Django's built-in `runserver`.
*   **Static Management**: `WhiteNoise` serves static files efficiently.
*   **Database**: **Neon** (managed PostgreSQL) is configured via `dj-database-url`, moving away from local SQLite.

### B. Environment Configuration
Required environment variables for production:
*   `SECRET_KEY`: Django's unique secret.
*   `DEBUG`: Set to `False` in production.
*   `DATABASE_URL`: Connection string for the Neon PostgreSQL database.
*   `ALLOWED_HOSTS`: Domain names allowed to access the API.
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credentials for cloud image storage.

---

## 5. Directory Structure (Backend)

```text
backend/
├── config/              # Project settings and root URL routing
├── users/               # User accounts and authentication
│   ├── models.py        # CustomUser definition
│   ├── serializers.py   # JWT & Signup logic
│   └── views.py         # Auth endpoints
├── issues/              # Core domain logic
│   ├── models.py        # Issue, Comment, Upvote, Flag, TimelineEvent schemas
│   ├── serializers.py   # Geocoding & validation
│   └── views.py         # Issue CRUD, Analytics & Social Features
├── manage.py            # CLI entry point
└── requirements.txt     # Linux-optimized dependencies
```
