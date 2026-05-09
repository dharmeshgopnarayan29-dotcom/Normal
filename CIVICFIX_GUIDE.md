# CivicFix: Project Architecture & Workflow Guide

CivicFix is a community-driven platform for reporting and tracking city issues. This document outlines the project's technical architecture, workflow details, API endpoints, and dependency breakdown.

---

## 1. Project Workflow (Detail)

### A. Authentication Flow
CivicFix uses **JWT (JSON Web Token)** for secure, stateless authentication.
1. **Login**: User submits credentials (email/password) to `/api/users/login/`.
2. **Token Generation**: Django backend validates credentials and returns an `access` and `refresh` token.
3. **Storage**: The frontend stores these tokens in `localStorage`.
4. **Authorized Requests**: All subsequent API calls (except login/signup) include the `Authorization: Bearer <token>` header.
5. **Session Management**: If the access token expires, the frontend can use the refresh token to get a new one, or redirect to login.

### B. Citizen Workflow (Issue Reporting)
1. **Initiation**: Citizen opens the "Add Complaint" modal.
2. **Data Collection**: 
    - **Description & Title**: Manual input.
    - **Location**: Automatically fetched via Geolocation API or manually selected on the Map.
    - **Photo**: Citizen uploads a photo of the issue.
3. **Submission**: Frontend sends a `multipart/form-data` POST request to `/api/issues/`.
4. **Backend Processing**:
    - **Geocoding**: If only an address is provided, the backend uses **Nominatim** (OpenStreetMap) to find coordinates.
    - **Reverse Geocoding**: If only coordinates are provided, the backend finds the readable address.
    - **Image Storage**: The image is securely uploaded to **Cloudinary**, and the URL is saved to the database.
5. **Feed Update**: The new issue appears in the "Community Feed" with a `PENDING` status.
6. **Community Features**: Citizens can upvote (`/upvote/`), flag (`/flag/`), or comment (`/comments/`) on community issues. If an issue receives 5 flags, it is automatically hidden from public view until reviewed by an admin.

### C. Admin Workflow (Issue Management)
1. **Monitoring**: Admins see all reported issues on their dashboard and live map, including those hidden via community flags.
2. **Review**: Admin clicks an issue to see full details, location, reporter, and timeline history.
3. **Status Lifecycle**:
    - **Verify**: Admin approves the report (`Verified`).
    - **Assign/In Progress**: Issue is being worked on (`In Progress`).
    - **Resolve**: Work is complete (`Resolved`).
    - **Reject**: Invalid report (`Rejected`).
4. **Update**: Each change sends a `PATCH` request to `/api/issues/<id>/`, automatically logging a **TimelineEvent** to track the resolution journey. Admins can also manually add notes to the timeline.

---

## 2. API Endpoints Reference

| Endpoint | Method | Description | Role |
| :--- | :--- | :--- | :--- |
| `/api/users/login/` | `POST` | Authenticate user and return JWT tokens. | Public |
| `/api/users/register/` | `POST` | Create a new Citizen or Admin account. | Public |
| `/api/issues/` | `GET` | Fetch all reported issues (supports filtering). | Auth Required |
| `/api/issues/` | `POST` | Report a new issue (Title, Desc, Category, Location, Photo). | Citizen |
| `/api/issues/my/` | `GET` | Fetch only the issues reported by the current user. | Citizen |
| `/api/issues/<id>/` | `PATCH` | Update issue status (e.g., Pending -> Verified). | Admin |
| `/api/issues/<id>/delete/` | `DELETE` | Remove an issue report. | Owner/Admin |
| `/api/issues/<id>/comments/` | `GET`/`POST` | List or create comments on an issue. | Auth Required |
| `/api/issues/<id>/upvote/` | `POST` | Toggle an upvote on a specific issue. | Auth Required |
| `/api/issues/<id>/flag/` | `POST` | Toggle a flag (report) on a specific issue. | Auth Required |
| `/api/issues/flagged/` | `GET` | View issues hidden due to high flag count. | Admin |
| `/api/issues/<id>/restore/` | `POST` | Restore a flagged issue and clear its flags. | Admin |
| `/api/issues/<id>/timeline/` | `GET` | View the progress timeline of an issue. | Auth Required |

---

## 3. Dependency Breakdown

### Backend (Django REST Framework)
*   **Django**: Core web framework for routing, database management, and admin interface.
*   **Django REST Framework (DRF)**: Powers the API layer, handling serialization and request/response cycles.
*   **Cloudinary**: Remote storage for media files, removing local file dependency.
*   **Neon / dj-database-url / Psycopg2**: Database adapters and URL parsing for connecting to managed PostgreSQL.
*   **SimpleJWT**: Handles secure token-based authentication.
*   **CORS-headers**: Allows the React frontend to communicate with the Django backend.

### Frontend (React + Vite)
*   **React (v19)**: UI library for building a dynamic, responsive interface.
*   **Vite**: Next-generation build tool for fast development and bundling.
*   **Axios**: HTTP client for making API calls with interceptors for JWT token handling.
*   **React-Leaflet**: Integration for **OpenStreetMap**, providing the interactive "Live Map".
*   **Lucide-React**: Set of premium, modern icons used throughout the dashboard.
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI styling and glassmorphism effects.
*   **Recharts**: Used for displaying analytics and trend data in the Admin Dashboard.

---

## 4. Key Logic Implementations

### Smart Geocoding
The system supports dual-input for location:
- If a user types "Indiranagar", the backend finds `(12.97, 77.64)`.
- If a user clicks the map at `(12.97, 77.64)`, the backend fills in "Indiranagar, Bangalore".
- This is handled in `serializers.py` using the **Nominatim API**, ensuring data completion even with partial user input.

### Community Moderation & Flagging
To maintain feed quality without constant admin intervention, a community flagging feature exists:
- Users can click "Flag" to report spam or inappropriate content.
- If an issue accumulates **5 unique flags**, its `is_flagged` status becomes `True`.
- Flagged issues are automatically filtered out from the `IssueListCreateView` for regular citizens, while admins can still review and restore them via a dedicated dashboard view.

### Progress Timeline Tracking
Every issue lifecycle is tracked meticulously:
- When a citizen submits a complaint, a `TimelineEvent` (step: "Submitted") is generated.
- When an admin updates the issue status (e.g., from "Pending" to "Verified"), a `TimelineEvent` is automatically triggered.
- Admins can optionally add manual notes to specific timeline steps, making the progression transparent to the citizen tracking the issue.
