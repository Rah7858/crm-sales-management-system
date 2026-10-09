const fs = require('fs');

const doc = {
  openapi: "3.0.0",
  info: {
    title: "CRM Sales Management System API",
    version: "1.0.0",
    description: "API Documentation for the CRM backend"
  },
  servers: [{ url: "http://localhost:5000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {}
};

const buildResponse = (description) => ({
  "200": { description },
  "400": { description: "Validation / Business logic error" },
  "401": { description: "Unauthorized" },
  "403": { description: "Forbidden" },
  "404": { description: "Resource not found" },
  "500": { description: "Server Error" }
});

const getParams = (names) => names.map(n => ({
  name: n,
  in: "path",
  required: true,
  schema: { type: "string" }
}));

const queryParams = (names) => names.map(n => ({
  name: n,
  in: "query",
  required: false,
  schema: { type: "string" }
}));

// Auth
doc.paths['/api/auth/register'] = {
  post: {
    tags: ["Auth"], summary: "Register new sales executive",
    security: [],
    requestBody: { content: { "application/json": { schema: { type: "object" } } } },
    responses: buildResponse("Registered successfully")
  }
};
doc.paths['/api/auth/login'] = {
  post: {
    tags: ["Auth"], summary: "Login user",
    security: [],
    requestBody: { content: { "application/json": { schema: { type: "object" } } } },
    responses: buildResponse("Logged in successfully")
  }
};
doc.paths['/api/auth/logout'] = { post: { tags: ["Auth"], summary: "Logout user", responses: buildResponse("Logged out") } };
doc.paths['/api/auth/me'] = { get: { tags: ["Auth"], summary: "Get current user", responses: buildResponse("Current user") } };

// Users
doc.paths['/api/users'] = {
  get: { tags: ["Users"], summary: "List users", parameters: queryParams(['search', 'role', 'isActive', 'page', 'limit', 'sortBy', 'order']), responses: buildResponse("List users") },
  post: { tags: ["Users"], summary: "Create user", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Created") }
};
doc.paths['/api/users/{id}'] = {
  get: { tags: ["Users"], summary: "Get user", parameters: getParams(['id']), responses: buildResponse("User data") },
  put: { tags: ["Users"], summary: "Update user", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Updated") },
  delete: { tags: ["Users"], summary: "Delete user", parameters: getParams(['id']), responses: buildResponse("Deleted") }
};

// Leads
doc.paths['/api/leads'] = {
  get: { tags: ["Leads"], summary: "List leads", parameters: queryParams(['search', 'status', 'source', 'priority', 'assignedTo', 'page', 'limit']), responses: buildResponse("List leads") },
  post: { tags: ["Leads"], summary: "Create lead", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Created") }
};
doc.paths['/api/leads/{id}'] = {
  get: { tags: ["Leads"], summary: "Get lead", parameters: getParams(['id']), responses: buildResponse("Lead data") },
  put: { tags: ["Leads"], summary: "Update lead", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Updated") },
  delete: { tags: ["Leads"], summary: "Delete lead", parameters: getParams(['id']), responses: buildResponse("Deleted") }
};
doc.paths['/api/leads/{id}/status'] = {
  patch: { tags: ["Leads"], summary: "Update status", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Status updated") }
};
doc.paths['/api/leads/{id}/assign'] = {
  patch: { tags: ["Leads"], summary: "Assign lead", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Assigned") }
};
doc.paths['/api/leads/{id}/notes'] = {
  post: { tags: ["Leads"], summary: "Add note", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Added") },
  get: { tags: ["Leads"], summary: "Get notes", parameters: getParams(['id']), responses: buildResponse("List notes") }
};
doc.paths['/api/leads/{id}/convert'] = {
  post: { tags: ["Leads"], summary: "Convert lead", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Converted") }
};

// Customers
doc.paths['/api/customers'] = {
  get: { tags: ["Customers"], summary: "List customers", parameters: queryParams(['search', 'status', 'assignedTo', 'createdFrom', 'createdTo', 'page', 'limit']), responses: buildResponse("List customers") },
  post: { tags: ["Customers"], summary: "Create customer", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Created") }
};
doc.paths['/api/customers/{id}'] = {
  get: { tags: ["Customers"], summary: "Get customer", parameters: getParams(['id']), responses: buildResponse("Customer data") },
  put: { tags: ["Customers"], summary: "Update customer", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Updated") },
  delete: { tags: ["Customers"], summary: "Delete customer", parameters: getParams(['id']), responses: buildResponse("Deleted") }
};

// Deals
doc.paths['/api/deals'] = {
  get: { tags: ["Deals"], summary: "List deals", parameters: queryParams(['search', 'stage', 'assignedTo', 'minAmount', 'maxAmount', 'status', 'page', 'limit']), responses: buildResponse("List deals") },
  post: { tags: ["Deals"], summary: "Create deal", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Created") }
};
doc.paths['/api/deals/{id}'] = {
  get: { tags: ["Deals"], summary: "Get deal", parameters: getParams(['id']), responses: buildResponse("Deal data") },
  put: { tags: ["Deals"], summary: "Update deal", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Updated") },
  delete: { tags: ["Deals"], summary: "Delete deal", parameters: getParams(['id']), responses: buildResponse("Deleted") }
};
doc.paths['/api/deals/{id}/stage'] = {
  patch: { tags: ["Deals"], summary: "Change stage", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Stage changed") }
};
doc.paths['/api/deals/{id}/assign'] = {
  patch: { tags: ["Deals"], summary: "Assign deal", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Assigned") }
};

// Activities
doc.paths['/api/activities'] = {
  get: { tags: ["Activities"], summary: "List activities", parameters: queryParams(['type', 'status', 'assignedTo', 'entityType', 'entityId', 'dueFrom', 'dueTo', 'page', 'limit']), responses: buildResponse("List activities") },
  post: { tags: ["Activities"], summary: "Create activity", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Created") }
};
doc.paths['/api/activities/{id}'] = {
  get: { tags: ["Activities"], summary: "Get activity", parameters: getParams(['id']), responses: buildResponse("Activity data") },
  put: { tags: ["Activities"], summary: "Update activity", parameters: getParams(['id']), requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: buildResponse("Updated") },
  delete: { tags: ["Activities"], summary: "Delete activity", parameters: getParams(['id']), responses: buildResponse("Deleted") }
};
doc.paths['/api/activities/{id}/complete'] = {
  patch: { tags: ["Activities"], summary: "Complete activity", parameters: getParams(['id']), responses: buildResponse("Completed") }
};

// Timeline
doc.paths['/api/timeline/lead/{id}'] = { get: { tags: ["Timeline"], summary: "Lead timeline", parameters: getParams(['id']), responses: buildResponse("Timeline") } };
doc.paths['/api/timeline/customer/{id}'] = { get: { tags: ["Timeline"], summary: "Customer timeline", parameters: getParams(['id']), responses: buildResponse("Timeline") } };
doc.paths['/api/timeline/deal/{id}'] = { get: { tags: ["Timeline"], summary: "Deal timeline", parameters: getParams(['id']), responses: buildResponse("Timeline") } };

// Dashboard
doc.paths['/api/dashboard/stats'] = { get: { tags: ["Dashboard"], summary: "Dashboard stats", responses: buildResponse("Stats") } };
doc.paths['/api/dashboard/pipeline'] = { get: { tags: ["Dashboard"], summary: "Dashboard pipeline", responses: buildResponse("Pipeline") } };
doc.paths['/api/dashboard/team-performance'] = { get: { tags: ["Dashboard"], summary: "Team performance", responses: buildResponse("Performance") } };

fs.writeFileSync('src/swagger.json', JSON.stringify(doc, null, 2));
console.log('Swagger generated');
