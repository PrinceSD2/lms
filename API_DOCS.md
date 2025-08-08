# API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { /* Response data */ },
  "error": "Error details (only if success is false)"
}
```

## Endpoints

### Authentication

#### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "Password123!",
  "role": "agent1" // optional, defaults to "agent1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "agent1",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "agent1"
    },
    "token": "jwt_token_here"
  }
}
```

#### Get Current User
```
GET /auth/me
```
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "agent1"
    }
  }
}
```

#### Update Profile
```
PUT /auth/profile
```
*Requires authentication*

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Change Password
```
PUT /auth/change-password
```
*Requires authentication*

**Request Body:**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

### Leads

#### Get All Leads
```
GET /leads?page=1&limit=10&status=new&category=hot&search=john
```
*Requires authentication*

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 10, max: 100)
- `status` (optional): Filter by status (new, interested, not-interested, successful, follow-up)
- `category` (optional): Filter by category (hot, warm, cold)
- `search` (optional): Search in name, email, company, phone

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "_id": "lead_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "budget": 5000,
        "source": "website",
        "company": "Test Corp",
        "jobTitle": "Manager",
        "location": "New York",
        "requirements": "Need CRM system",
        "notes": "Very interested",
        "category": "hot",
        "completionPercentage": 85,
        "status": "new",
        "priority": "high",
        "createdBy": {
          "_id": "user_id",
          "name": "Agent Name",
          "email": "agent@example.com"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### Get Single Lead
```
GET /leads/:id
```
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "lead": {
      "_id": "lead_id",
      "name": "John Doe",
      // ... full lead object
    }
  }
}
```

#### Create New Lead
```
POST /leads
```
*Requires authentication (Agent1 or Admin only)*

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890", 
  "budget": 5000,
  "source": "website",
  "company": "Test Corp",
  "jobTitle": "Manager",
  "location": "New York",
  "requirements": "Need CRM system",
  "notes": "Very interested client"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "lead": {
      "_id": "lead_id",
      "name": "John Doe",
      // ... full lead object with auto-calculated category
    }
  }
}
```

#### Update Lead Status
```
PUT /leads/:id
```
*Requires authentication (Agent2 or Admin only)*

**Request Body:**
```json
{
  "status": "interested",
  "followUpDate": "2023-12-25",
  "followUpTime": "14:30",
  "followUpNotes": "Call to discuss requirements",
  "conversionValue": 10000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "lead": {
      "_id": "lead_id",
      // ... updated lead object
    }
  }
}
```

#### Delete Lead
```
DELETE /leads/:id
```
*Requires authentication (Admin only)*

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

#### Get Dashboard Statistics
```
GET /leads/dashboard/stats
```
*Requires authentication (Admin only)*

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLeads": 150,
    "hotLeads": 25,
    "warmLeads": 60,
    "coldLeads": 65,
    "interestedLeads": 40,
    "successfulLeads": 15,
    "followUpLeads": 30,
    "conversionRate": "10.00",
    "todayLeads": 5,
    "weekLeads": 22,
    "monthLeads": 85,
    "todayFollowUps": 3,
    "lastUpdated": "2023-01-01T12:00:00.000Z"
  }
}
```

#### Get Follow-up Leads
```
GET /leads/dashboard/follow-ups
```
*Requires authentication (Agent2 or Admin only)*

**Response:**
```json
{
  "success": true,
  "data": {
    "followUps": [
      {
        "_id": "lead_id",
        "name": "John Doe",
        "company": "Test Corp",
        "followUpDate": "2023-12-25T00:00:00.000Z",
        "followUpTime": "14:30",
        "followUpNotes": "Call to discuss requirements",
        "createdBy": {
          "name": "Agent Name",
          "email": "agent@example.com"
        }
      }
    ]
  }
}
```

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email",
      "value": "invalid-email"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Not Found Errors
```json
{
  "success": false,
  "message": "Lead not found"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Something went wrong!",
  "error": "Detailed error message (development only)"
}
```

## Rate Limiting

- General API endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

## WebSocket Events

The application uses Socket.IO for real-time updates:

### Client Events

**Join Room:**
```javascript
socket.emit('join-room', 'user-123');
socket.emit('join-room', 'agent1');
```

### Server Events

**Lead Created:**
```javascript
socket.on('leadCreated', (data) => {
  // data.lead - the created lead
  // data.createdBy - name of user who created it
});
```

**Lead Updated:**
```javascript
socket.on('leadUpdated', (data) => {
  // data.lead - the updated lead
  // data.updatedBy - name of user who updated it
});
```

**Lead Deleted:**
```javascript
socket.on('leadDeleted', (data) => {
  // data.leadId - ID of deleted lead
  // data.deletedBy - name of user who deleted it
});
```

**Stats Updated (Admin only):**
```javascript
socket.on('statsUpdated', (data) => {
  // data - updated statistics object
});
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Examples

### Complete User Registration and Lead Creation Flow

1. **Register a new Agent1:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Generator",
    "email": "agent1@example.com",
    "password": "Password123!",
    "role": "agent1"
  }'
```

2. **Login and get token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@example.com", 
    "password": "Password123!"
  }'
```

3. **Create a lead (use token from step 2):**
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "budget": 5000,
    "source": "website",
    "company": "Test Corp",
    "jobTitle": "Manager",
    "location": "New York",
    "requirements": "Need CRM system"
  }'
```

4. **Register Agent2 and update lead status:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Follower",
    "email": "agent2@example.com", 
    "password": "Password123!",
    "role": "agent2"
  }'
```

```bash
curl -X PUT http://localhost:5000/api/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENT2_JWT_TOKEN" \
  -d '{
    "status": "interested",
    "followUpDate": "2023-12-25",
    "followUpTime": "14:30",
    "followUpNotes": "Schedule demo call"
  }'
```
