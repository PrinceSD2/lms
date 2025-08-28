# LMS Organizational Hierarchy System - Complete Implementation

## 🎯 System Overview

The Lead Management System now supports a comprehensive organizational hierarchy where:

- **Super Admin**: Creates organizations and manages all users across the system
- **Organizations**: Two types - Main (Reddington) and Client organizations  
- **Users**: Role-based access with organization-specific permissions
- **Lead Flow**: Structured assignment from any organization to Reddington Agent2s
- **Tracking**: Complete visibility for Super Admin, organization-specific data for others

## 🏗️ Architecture

### Database Models Enhanced

#### Organization Model (`/server/models/Organization.js`)
```javascript
organizationType: {
  type: String,
  enum: ['main', 'client'],
  default: 'client',
  required: true
}
```

#### Lead Model (`/server/models/Lead.js`)
```javascript
sourceOrganization: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: true
},
assignedToOrganization: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization'
}
```

#### User Model (`/server/models/User.js`)
- Already supports organization reference
- Roles: superadmin, admin, agent1, agent2

### API Endpoints

#### Lead Assignment
- `PUT /api/leads/:id/assign-to-agent2` - Assign leads to Reddington Agent2s
- `GET /api/leads/organization/:orgId` - Get leads by organization with role-based filtering

#### Organization Management  
- `GET /api/organizations/:id/users` - Get users of an organization (SuperAdmin only)
- `GET /api/auth/reddington-agent2s` - Get available Agent2s from main organization

## 👥 User Roles & Permissions

### 🔱 Super Admin
**Capabilities:**
- ✅ Create and manage organizations
- ✅ Create users for any organization
- ✅ View all leads from all organizations
- ✅ Assign leads to Reddington Agent2s
- ✅ Full CRUD operations on leads
- ✅ Complete system visibility

**Login:** superadmin@lms.com / superadmin123

### 🏢 Organizations

#### Main Organization (Reddington)
- **Type**: `main`
- **Special Role**: Houses all Agent2s who receive lead assignments
- **Users**: Admin, Agent1, Agent2 (multiple)

#### Client Organizations
- **Type**: `client`
- **Purpose**: Generate leads and assign them to Reddington Agent2s
- **Users**: Admin, Agent1 (no Agent2s)

### 👨‍💼 Admin (Organization-specific)
**Capabilities:**
- ✅ View leads from their organization only
- ✅ Track which Agent2 (Reddington) leads are assigned to
- ✅ Monitor assignment status and updates
- ✅ Manage Agent1s in their organization
- ❌ Cannot create leads directly
- ❌ Cannot see other organizations' data

**Example Login:** admin@reddington.com / admin123

### 👨‍💻 Agent1 (Organization-specific)
**Capabilities:**
- ✅ Create leads manually for their organization
- ✅ Assign leads to Reddington Agent2s
- ✅ View leads they created
- ✅ Edit leads before assignment
- ❌ Cannot see leads from other organizations
- ❌ Cannot modify leads after assignment

**Example Login:** agent1@reddington.com / agent1123

### 👨‍🔧 Agent2 (Reddington Only)
**Capabilities:**
- ✅ View leads assigned to them from ANY organization
- ✅ Update lead status and progress
- ✅ Add follow-up notes and call dispositions
- ✅ Mark leads as successful/unsuccessful
- ❌ Cannot create new leads
- ❌ Cannot reassign leads

**Example Logins:**
- agent2-1@reddington.com / agent2123
- agent2-2@reddington.com / agent2123
- agent2-3@reddington.com / agent2123

## 🔄 Lead Flow Process

### 1. Lead Creation
```
Agent1 (Any Organization) → Creates Lead → Stored with sourceOrganization
```

### 2. Lead Assignment
```
Agent1/Admin/SuperAdmin → Selects Reddington Agent2 → Lead Assignment
```

### 3. Lead Processing
```
Agent2 (Reddington) → Updates Status → Visible to Source Organization Admin
```

### 4. Tracking & Visibility
```
SuperAdmin: Sees ALL leads and assignments
Source Org Admin: Sees their leads + assignment status
Agent2: Sees only leads assigned to them
```

## 📊 Dashboard Features

### Super Admin Dashboard
**Tabs:**
1. **Overview**: System statistics and metrics
2. **Organizations**: Create/manage organizations and users
3. **Leads**: Complete lead management with assignment capabilities

**Key Features:**
- Organization creation with type selection
- User creation with role-based options
- Lead assignment to Reddington Agent2s
- Organization-based filtering
- Complete system visibility

### Organization Management Component
- Create new client organizations
- View organization details and users
- Add users to organizations (Admin, Agent1, Agent2 for main org only)
- Role-based user creation restrictions

### Lead Assignment System
- Modal for selecting Reddington Agent2s
- Assignment notes capability
- Real-time status updates
- Organization tracking

## 🔒 Security & Access Control

### Role-Based Route Protection
- **SuperAdmin**: Full system access
- **Admin**: Organization-scoped access
- **Agent1**: Organization-scoped + lead creation
- **Agent2**: Assignment-scoped access

### Data Isolation
- Organizations can only see their own data
- Assignments create cross-organization visibility
- Super Admin maintains complete oversight

### API Security
- JWT-based authentication
- Role-based authorization middleware
- Organization ownership validation
- Assignment permission checks

## 🚀 Setup & Deployment

### Database Initialization
```bash
cd server
node seeds/reddingtonSeed.js
```

This creates:
- Reddington main organization
- Super Admin user
- Sample Admin, Agent1, and 3 Agent2s

### Starting the System
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client  
cd client
npm start
```

### Environment Variables Required
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

## 📋 Testing Scenarios

### 1. Organization Creation
- Login as SuperAdmin
- Navigate to Organizations tab
- Create new client organization
- Add Admin and Agent1 users

### 2. Lead Generation & Assignment
- Login as Agent1 from any organization
- Create a new lead
- Assign lead to Reddington Agent2
- Verify assignment visibility

### 3. Lead Processing
- Login as assigned Agent2
- View assigned leads
- Update lead status
- Add processing notes

### 4. Admin Tracking
- Login as organization Admin
- View leads from organization
- Track assignment status
- Monitor Agent2 updates

## 🔧 Technical Implementation Details

### Frontend Components
- `OrganizationManagement.js`: Complete org management interface
- `SuperAdminDashboard.js`: Enhanced with assignment features
- Role-based component rendering
- Real-time updates via Socket.IO

### Backend Enhancements
- Organization type support
- Lead assignment routes
- Role-based filtering
- Cross-organization assignment logic

### Database Indexes
- Organization lookups
- User role filtering  
- Lead assignment queries
- Performance optimization

## 📈 Monitoring & Analytics

### Lead Tracking
- Source organization identification
- Assignment timeline tracking
- Status progression monitoring
- Performance metrics per Agent2

### Organization Metrics
- Lead generation statistics
- Assignment success rates
- User activity tracking
- System utilization data

## 🛡️ Data Privacy & Compliance

### Organization Isolation
- Strict data boundaries
- Cross-organization assignment controls
- Audit trail maintenance
- Role-based access logging

### Lead Assignment Transparency
- Clear assignment tracking
- Status update visibility
- Performance accountability
- Complete audit trails

---

## 🎉 System Ready!

The complete organizational hierarchy system is now operational with:

✅ **Multi-organization support**
✅ **Role-based access control** 
✅ **Lead assignment workflow**
✅ **Cross-organization tracking**
✅ **Complete audit trails**
✅ **Scalable architecture**

The system perfectly implements your requirements where Agent1s from any organization can create leads and assign them to Reddington Agent2s, while Admins can track everything and Super Admin has complete oversight of the entire operation.
