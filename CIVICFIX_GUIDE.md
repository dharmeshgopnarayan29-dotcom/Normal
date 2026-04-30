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
    - **Image Processing**: The `Issue.save()` method intercepts the upload, crops the photo to a **16:9 ratio**, and resizes it for dashboard consistency.
5. **Feed Update**: The new issue appears in the "Community Feed" with a `PENDING` status.

### C. Admin Workflow (Issue Management)
1. **Monitoring**: Admins see all reported issues on their dashboard and live map.
2. **Review**: Admin clicks an issue to see full details (Photo, Location, Reporter).
3. **Status Lifecycle**:
    - **Verify**: Admin approves the report (`Verified`).
    - **Assign/In Progress**: Issue is being worked on (`In Progress`).
    - **Resolve**: Work is complete (`Resolved`).
    - **Reject**: Invalid report (`Rejected`).
4. **Update**: Each change sends a `PATCH` request to `/api/issues/<id>/`.

---

## 2. API Endpoints Reference

| Endpoint | Method | Description | Role |
| :--- | :--- | :--- | :--- |
| `/api/users/login/` | `POST` | Authenticate user and return JWT tokens. | Public |
| `/api/users/register/` | `POST` | Create a new Citizen or Admin account. | Public |
| `/api/issues/` | `GET` | Fetch all reported issues. | Auth Required |
| `/api/issues/` | `POST` | Report a new issue (Title, Desc, Category, Location, Photo). | Citizen |
| `/api/issues/my/` | `GET` | Fetch only the issues reported by the current user. | Citizen |
| `/api/issues/<id>/` | `PATCH` | Update issue status (e.g., Pending -> Verified). | Admin |
| `/api/issues/<id>/` | `DELETE` | Remove an issue report. | Admin |

---

## 3. Dependency Breakdown

### Backend (Django REST Framework)
*   **Django**: Core web framework for routing, database management, and admin interface.
*   **Django REST Framework (DRF)**: Powers the API layer, handling serialization and request/response cycles.
*   **Pillow**: Used for high-quality **image processing** (cropping, resizing, and format conversion).
*   **SimpleJWT**: Handles secure token-based authentication.
*   **Psycopg2**: Database adapter for connecting to PostgreSQL.
*   **CORS-headers**: Allows the React frontend (port 5173) to communicate with the Django backend (port 8000).

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

### Image Auto-Fit Logic
To keep the UI consistent, the backend automatically crops every image:
```python
# In models.py
target_ratio = 16 / 9
if current_ratio > target_ratio:
    # Too wide, crop sides
elif current_ratio < target_ratio:
    # Too tall, crop top/bottom
```
This ensures that whether a user uploads a portrait or landscape photo, it fits perfectly in the feed card without being stretched.

### Smart Geocoding
The system supports dual-input for location:
- If a user types "Indiranagar", the backend finds `(12.97, 77.64)`.
- If a user clicks the map at `(12.97, 77.64)`, the backend fills in "Indiranagar, Bangalore".
- This is handled in `serializers.py` using the **Nominatim API**.



Continue
The workflow of CivicFix is built on a modern full-stack architecture using Django (REST Framework) for the backend and React for the frontend. Below is a detailed breakdown of the communication flow and API endpoints.

1. User Authentication Workflow
    This is the entry point for all users (Citizens and Admins).

    Registration:
    Action: User fills out the signup form.
    Frontend: Calls api.post('users/register/', signupData).
    Backend: POST /api/users/register/ (RegisterView) creates a new user in the database.
    Login:
    Action: User enters credentials.
    Frontend: Calls api.post('users/login/', { username, password }).
    Backend: POST /api/users/login/ (CustomTokenObtainPairView) validates credentials and returns a JWT (Access & Refresh tokens).
    Token Storage:
    The frontend stores the access_token in localStorage.
    An Axios Interceptor (api.js) automatically attaches this token to the Authorization header for every subsequent request.

2. Citizen Workflow (Reporting & Tracking)
    Citizens use the platform to report local issues and track their progress.

    Load Dashboard:
    Frontend: Calls GET /api/issues/ to populate the community feed and GET /api/issues/my/ to show the user's specific activity.
    Reporting an Issue:
    Action: User clicks "Report New Issue" and fills the modal (Title, Description, Category, Image, Location).
    Frontend: Calls POST /api/issues/ using multipart/form-data (to handle image uploads).
    Backend: IssueListCreateView saves the issue and automatically associates it with the logged-in user (reported_by).
    Viewing My Complaints:
    Frontend: Navigates to MyComplaints.jsx which calls GET /api/issues/my/.
    Backend: UserIssueListView filters the database to return only issues where reported_by == request.user.

3. Admin Workflow (Management & Resolution)
    Admins oversee all reports and update their progress.

    Reviewing Issues:
    Frontend: Calls GET /api/issues/ to see all community reports.
    Updating Status:
    Action: Admin clicks "Approve", "Mark In Progress", or "Resolved".
    Frontend: Calls PATCH /api/issues/<id>/ with the new status (e.g., { "status": "verified" }).
    Backend: IssueDetailView updates the record in the database.
    Analytics:
    Frontend: Navigates to Analytics.jsx which calls GET /api/issues/analytics/.
    Backend: AnalyticsView performs database aggregation (e.g., Count) to return stats grouped by status and category.

4. API Endpoints Table
    Endpoint	Method	App	Description
    /api/users/register/	POST	Users	Creates a new user account.
    /api/users/login/	POST	Users	Authenticates user; returns JWT tokens.
    /api/users/login/refresh/	POST	Users	Refreshes the access token using a refresh token.
    /api/issues/	GET	Issues	Fetches all issues (supports filtering by status, category).
    /api/issues/	POST	Issues	Creates a new issue (requires image/form data).
    /api/issues/my/	GET	Issues	Fetches issues reported by the current logged-in user.
    /api/issues/<id>/	GET	Issues	Fetches details of a specific issue.
    /api/issues/<id>/	PATCH	Issues	Updates issue status (Admin only).
    /api/issues/analytics/	GET	Issues	Returns counts of issues grouped by status and category.

5. Technical Workflow Summary
    Request: React component triggers an api call (Axios).
    Security: Interceptor adds Bearer <token> to the header.
    Routing: Django urls.py routes the request to the specific View class.
    Logic: The View interacts with the Issue model, performs filtering/saving, and uses the IssueSerializer to convert database objects to JSON.
    Response: JSON is sent back to React, which updates the state and re-renders the UI.