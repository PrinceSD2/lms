# Lead Management System (LMS)

A full-stack web application for managing leads with role-based access control and real-time updates.

## Features

- **Role-based Authentication**: Agent 1 (Lead Generator), Agent 2 (Lead Follower), Admin
- **Real-time Updates**: Using Socket.IO for live data synchronization  
- **AI Lead Categorization**: Automatic classification as Hot, Warm, or Cold based on data completeness
- **Dashboard Analytics**: Real-time metrics and conversion tracking
- **Mobile Responsive**: Clean UI with Tailwind CSS
- **Security**: JWT authentication, bcrypt hashing, input validation, rate limiting

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB Atlas
- Socket.IO for real-time communication
- JWT for authentication
- bcrypt for password hashing
- Helmet, CORS, express-rate-limit for security

### Frontend
- React.js with hooks
- Tailwind CSS for styling
- Axios for API calls
- Socket.IO client for real-time updates
- React Router for navigation

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies  
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory with the following variables:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@lms.com
ADMIN_PASSWORD=your_admin_password
PORT=5000
NODE_ENV=development
```

### 3. Start the Application

```bash
# Start backend server (from server directory)
npm run dev

# Start frontend (from client directory)  
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## User Roles

### Agent 1 (Lead Generator)
- Add new leads with contact information and budget
- Leads are automatically categorized based on data completeness:
  - **Hot** (Red): 80%+ fields completed
  - **Warm** (Yellow): 50-79% fields completed  
  - **Cold** (Blue): <50% fields completed

### Agent 2 (Lead Follower)
- View all leads in real-time
- Update lead status: Interested, Not Interested, Successful, Follow Up
- Schedule follow-up appointments with calendar integration

### Admin
- Real-time dashboard with metrics:
  - Total leads added
  - Total leads processed
  - Conversion rate
  - Success metrics
- Auto-refreshing dashboard (every 10 seconds)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - Get all leads (with pagination)
- `POST /api/leads` - Create new lead (Agent 1)
- `PUT /api/leads/:id` - Update lead status (Agent 2)
- `GET /api/leads/stats` - Get dashboard statistics (Admin)

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Security headers with Helmet
- Protected routes based on user roles

## Deployment

### Backend (Heroku/Render)
1. Set environment variables in your hosting platform
2. Deploy the server directory
3. Ensure MongoDB Atlas whitelist includes your hosting IP

### Frontend (Vercel/Netlify)
1. Build the React application: `npm run build`
2. Deploy the build directory
3. Update API base URL for production

## Default Admin Credentials
Use the credentials you set in the `.env` file:
- Email: Value of `ADMIN_EMAIL`
- Password: Value of `ADMIN_PASSWORD`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
