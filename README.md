# CRM Sales Management System Backend

A robust, role-based CRM backend application built for managing sales leads, customers, deals, and activities. Designed with simple, beginner-friendly principles and enterprise-ready features using Node.js, Express, and MongoDB.

## Features

- **Role-Based Access Control (RBAC):** Hierarchical permissions across Admin, Sales Manager, and Sales Executive roles.
- **Lead Management:** Create, track, assign, and convert leads with a full lifecycle implementation.
- **Customer & Deal Tracking:** Post-conversion tracking, expected revenue calculations, and strict deal-stage validations.
- **Activity & Timeline System:** Track all calls, emails, and follow-ups securely across different entities with an automated audit timeline log.
- **Dynamic Dashboard & Analytics:** Server-side aggregation pipelines to compute expected revenue, deal stages, and conversion rates efficiently.
- **Security:** Helmet, CORS, Express-Rate-Limit, Zod validations, JWT cookies, and centralized error handling safely secure endpoints.
- **Swagger Documentation:** Automatically hosted Swagger UI for easy API testing and visualization.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database:** MongoDB Atlas & Mongoose 8.x
- **Validation:** Zod
- **Authentication:** jsonwebtoken (JWT), bcryptjs, cookie-parser
- **Security & Logging:** helmet, cors, express-rate-limit, morgan
- **Documentation:** swagger-ui-express

## Project Structure

```
├── src
│   ├── config         # Database connection configuration
│   ├── controllers    # Thin handlers wrapping the response logic
│   ├── middleware     # Authenticate, authorize, errorHandler, rate-limiter, and Zod validator middleware
│   ├── models         # Mongoose schemas (User, Lead, Customer, Deal, Activity, Timeline)
│   ├── routes         # Express routers
│   ├── services       # Core business logic, stage transitions, timeline integration, DB aggregation
│   ├── utils          # Helpers (AppError, asyncHandler, pagination, sendResponse, seed scripts, accessControl)
│   ├── app.js         # Express setup & route mounting
│   └── swagger.json   # OpenAPI API documentation schema
├── server.js          # Entry point
├── package.json       # Dependencies and npm scripts
├── .env.example       # Example environment variables
└── README.md          # Documentation
```

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB account (local or Atlas)

## Installation

1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Copy `.env.example` to `.env` in the root of the project:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crm?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## MongoDB Setup & Seeding

Ensure your MongoDB instance is running. You can automatically seed initial Admin and Executive users by running:
```bash
npm run seed
```

## Running the Application

- **Development Mode (Auto-restart):**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```

## Authentication Flow

The application uses **JWT Bearer Authentication**. Upon successfully registering or logging in at `/api/auth/login`, you will receive an `accessToken` in the JSON response payload.

Include this token as an HTTP `Authorization` Header for protected routes:
```
Authorization: Bearer <your_access_token>
```

## Roles and Permissions

- **admin:** Has unrestricted access to create, view, assign, update, and safely delete any record across the entire platform.
- **sales_manager:** Can view, manage, and assign leads/deals/activities assigned directly to them, or to any `sales_executive` assigned to their team.
- **sales_executive:** Restricted exclusively to interacting with their own assigned records.

## API Documentation

When the server is running, you can access the full Swagger UI documentation at:
**[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

## API Response Format

All responses strictly adhere to the following JSON formats:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": ["Optional list of Zod validation details"]
}
```

## Important Business Rules

1. **Lead Conversion:** Moving a Lead to `qualified` status opens the `/convert` endpoint. Converting generates a Customer, creates a Deal in the `qualification` stage, writes three timeline events atomically using a MongoDB Transaction, and locks the Lead.
2. **Deal Stages:** Deals must progress cleanly through stages. Moving to `won` requires a positive expected value and valid customer. Moving to `lost` requires an explicit `lostReason`. `won` or `lost` Deals cannot be moved back to active stages. Expected Revenue is always recalculated on the server dynamically (`value * probability / 100`).
3. **Activity Overdue Status:** An activity is strictly calculated as `overdue` at runtime if its status is `pending` and its `dueDate` falls before the current timestamp.
4. **Dashboard:** All statistics and pipelines rely strictly on MongoDB aggregations (`$match`, `$group`, `$sum`) to provide high-performance counts across large teams. The data is scoped automatically using the caller's role permissions.

## Database Models & Indexes

- `User`: Email indexed (Unique).
- `Lead`: Text index on Name, Email, and Company for high-performance searching.
- `Customer`: Indexed heavily on `assignedTo` and `status`.
- `Deal`: Value/Stage tracked and aggregated efficiently.
- `Activity`: Timeline and due date references optimized.
- `Timeline`: Polymorphic `entityType` and `entityId` indexing provides O(1) audit logs per record.

## Error Handling & Security

- **AppError:** Custom wrapper catching unhandled exceptions via standard Express global middleware.
- **Zod Validations:** Strictly enforces data structures. Unrelated or garbage fields injected in the API body are discarded safely.
- **Security:** Standard HTTP safety protections provided through `helmet`, sanitized queries, CORS controls restricting origin paths, and global Rate Limiting minimizing brute force and DDoS opportunities. 

## Local Testing via Postman

1. **Import:** Add a local POST request to `http://localhost:5000/api/auth/login`.
2. **Body:** Use `admin@crm.com` / `Admin@123` (if seeded) to grab a Bearer token.
3. **Automate:** Inject the returned `accessToken` into Postman's global Bearer Token Authorization tab to easily iterate across the protected module endpoints securely. 

## Deployment

The application runs seamlessly out-of-the-box using the standard `npm start` target. To deploy:
1. Guarantee environment variables like `NODE_ENV=production` are properly injected.
2. The server exposes the application over standard HTTP/port.
3. Configure your load balancer or NGINX proxy to route traffic over HTTPS externally.
