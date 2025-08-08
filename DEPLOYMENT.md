# Lead Management System

A comprehensive full-stack web application for managing leads with role-based authentication, real-time updates, and automated categorization.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd lms-system
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

### Configuration

1. **Create Environment File**
   
   In the `server` directory, copy `.env.example` to `.env`:
   
```bash
cp .env.example .env
```

2. **Configure Environment Variables**
   
   Edit the `.env` file with your actual values:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/lms_database

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production

# Admin Account
ADMIN_EMAIL=admin@lms.com
ADMIN_PASSWORD=admin123!@#

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Database Setup

1. **Create Admin User**
```bash
cd server
npm run seed
```

### Running the Application

1. **Start Backend Server**
```bash
cd server
npm run dev
```

2. **Start Frontend Development Server** (in a new terminal)
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 User Roles & Credentials

### Admin Account
- **Email**: admin@lms.com
- **Password**: admin123!@# (as configured in .env)
- **Capabilities**: View dashboard with real-time metrics, manage all leads, access admin features

### Agent Accounts
Create new accounts through the registration page:

**Agent 1 (Lead Generator)**:
- Can add new leads with contact information
- Leads are automatically categorized (Hot/Warm/Cold) based on data completeness
- Can view their own created leads

**Agent 2 (Lead Follower)**:
- Can view all leads in real-time
- Can update lead status (Interested, Not Interested, Successful, Follow Up)
- Can schedule follow-up appointments
- Cannot create new leads

## 🏗️ Architecture

### Backend (Node.js/Express)
```
server/
├── models/          # MongoDB schemas (User, Lead)
├── routes/          # API endpoints (auth, leads)  
├── middleware/      # Authentication, validation
├── seeds/           # Database seeders
└── server.js        # Main application file
```

### Frontend (React)
```
client/src/
├── components/      # Reusable components
├── contexts/        # React contexts (Auth, Socket)
├── pages/           # Page components
└── App.js           # Main application component
```

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt (12 rounds)
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Security headers with Helmet
- Role-based access control
- NoSQL injection prevention

## 📊 Features

### Real-time Updates
- Socket.IO integration for live data synchronization
- Auto-refresh admin dashboard (every 10 seconds)
- Instant notifications for lead updates

### Lead Management
- **Automatic Categorization**:
  - **Hot** (Red): 80%+ fields completed
  - **Warm** (Yellow): 50-79% fields completed  
  - **Cold** (Blue): <50% fields completed

### Dashboard Analytics
- Total leads and conversion rates
- Lead category breakdown
- Status tracking
- Time-based metrics (today/week/month)

## 🚢 Deployment

### Backend Deployment (Heroku/Render)

1. **Set environment variables** in your hosting platform
2. **Deploy the server directory**
3. **Ensure MongoDB Atlas IP whitelist** includes your hosting provider

```bash
# Example for Heroku
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set ADMIN_EMAIL="admin@lms.com"
heroku config:set ADMIN_PASSWORD="your_admin_password"
heroku config:set NODE_ENV="production"
```

### Frontend Deployment (Vercel/Netlify)

1. **Build the application**:
```bash
cd client
npm run build
```

2. **Deploy the build directory**
3. **Set environment variables**:
```env
REACT_APP_API_URL=https://your-backend-url.herokuapp.com
```

## 🧪 Testing

### API Testing

Test the API endpoints using the provided examples:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!","role":"agent1"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lms.com","password":"admin123!@#"}'

# Create a lead (requires authentication)
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890","budget":5000,"company":"Test Corp"}'
```

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop browsers
- Tablet devices  
- Mobile phones

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run seed       # Create admin user
```

**Frontend:**
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

### Adding New Features

1. **Backend**: Add new routes in `routes/`, models in `models/`, middleware in `middleware/`
2. **Frontend**: Add new components in `components/`, pages in `pages/`, contexts in `contexts/`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your MongoDB URI is correct
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure the database user has proper permissions

2. **Frontend API Calls Failing**
   - Check if the backend server is running
   - Verify the API URL in the frontend configuration
   - Check browser console for CORS errors

3. **Authentication Issues**
   - Ensure JWT_SECRET is set in environment variables
   - Check if admin user was created successfully
   - Verify token is being sent in request headers

### Logs

Check application logs:
```bash
# Backend logs
cd server && npm run dev

# Frontend logs  
cd client && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using Node.js, React, and MongoDB**
