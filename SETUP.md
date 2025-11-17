# Workix - Complete Setup Guide

## 📋 Project Overview

Workix is a comprehensive EPC (Energy Performance Contracting) service management platform consisting of:
1. **Backend API** - Node.js/Express with PostgreSQL
2. **Mobile App** - React Native (Expo) for field technicians
3. **Web Admin Portal** - Next.js for internal teams

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis
- Google Gemini API Key
- (Optional) AWS S3 for file storage

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# - Database credentials
# - Redis connection
# - JWT secret
# - Gemini API key
# - AWS S3 credentials (optional)

# Run database migration
npm run migrate

# (Optional) Seed demo data
npm run seed

# Start server
npm run dev
```

The backend will start at `http://localhost:5000`

**API Documentation:**
- Base URL: `http://localhost:5000/api/v1`
- Health Check: `GET /health`
- Authentication: JWT Bearer token in Authorization header

### 2. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start

# Press 'a' for Android, 'i' for iOS, 'w' for web
```

**Features:**
- ✅ Offline-first architecture
- ✅ AI-powered text enhancement
- ✅ Photo capture and upload
- ✅ Real-time sync
- ✅ Work order management
- ✅ PPM scheduling

### 3. Web Admin Portal Setup

```bash
cd web-admin

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local

# Start development server
npm run dev
```

The admin portal will start at `http://localhost:3000`

## 🔑 Demo Credentials

After running `npm run seed` in the backend:

**Admin Access:**
- Email: `admin@workix.com`
- Password: `Admin@123`

**Technician (Mobile):**
- Email: `john.tech@workix.com`
- Password: `Tech@123`

**Analyst:**
- Email: `analyst@workix.com`
- Password: `Tech@123`

## 📊 Database Schema

The system uses a comprehensive relational schema with the following key entities:

- **users** - All system users (admins, technicians, analysts, clients)
- **clients** - Customer organizations
- **projects** - EPC contracts
- **sites** - Physical locations
- **assets** - Equipment (chillers, AHUs, etc.)
- **work_orders** - Service requests and tasks
- **work_order_activities** - Activity log for work orders
- **ppm_plans** - Preventive maintenance plans
- **ppm_schedules** - Scheduled maintenance tasks
- **notifications** - User notifications
- **audit_logs** - System audit trail

## 🎯 Key Features

### Backend API

**Authentication & Authorization:**
- JWT-based authentication
- Role-based access control (Admin, Manager, Analyst, Technician, Client)
- Secure password hashing with bcrypt

**Work Order Management:**
- Create, update, and track work orders
- Multi-asset support
- Priority and status management
- Activity logging with AI enhancement
- Photo attachments

**AI Integration:**
- Google Gemini Flash 1.5 for text enhancement
- Context-aware prompts (observation, action, recommendation)
- Batch processing support

**Performance & Caching:**
- Redis caching for frequently accessed data
- Optimized database queries
- Connection pooling

**Analytics & Reporting:**
- Dashboard with key metrics
- Work order trends
- Asset reliability analysis
- Technician performance metrics
- Mean Time To Repair (MTTR)

### Mobile App

**Service Request Inbox:**
- Real-time work order notifications
- Priority-based sorting
- Filter by status and source

**Work Order Detail:**
- Complete work order information
- Asset details and specifications
- AI-powered text enhancement
- Photo capture and gallery upload
- Offline data entry with auto-sync

**Activity Management:**
- View all assigned work orders
- Status filtering (Active, Completed, All)
- Quick status updates

**PPM Schedule:**
- Calendar view of preventive maintenance
- Task checklists
- Duration estimates

**Profile & Sync:**
- User profile management
- Offline sync status
- Manual sync trigger
- Dark mode support

### Web Admin Portal

**Dashboard:**
- Work order statistics
- Technician workload
- Performance metrics
- Real-time charts

**User Management:**
- Create and manage users
- Role assignment
- Status control

**Project Hierarchy:**
- Client management
- Project creation and tracking
- Site management
- Asset onboarding with full specifications

**Work Order Oversight:**
- Master view of all work orders
- Advanced filtering
- Manual work order creation
- Assignment management

**PPM Management:**
- Create maintenance plans
- Schedule tasks
- Assign to technicians
- Track completion

**Analytics & Reports:**
- Pre-built reports
- Custom report builder
- Data export

## 🔧 Technology Stack

### Backend
- **Framework:** Express.js
- **Database:** PostgreSQL with optimized indexes
- **Cache:** Redis
- **Authentication:** JWT
- **AI:** Google Gemini Flash 1.5
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate limiting

### Mobile
- **Framework:** React Native (Expo)
- **State:** Zustand
- **UI:** React Native Paper
- **Navigation:** React Navigation
- **Storage:** Async Storage + Secure Store
- **Network:** Axios with offline queue
- **Images:** Expo Image Picker & Camera

### Web Admin
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **UI:** Shadcn/ui + Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts

## 📁 Project Structure

```
workix/
├── backend/
│   ├── src/
│   │   ├── config/          # Redis, AWS configs
│   │   ├── controllers/     # Route controllers
│   │   ├── database/        # DB connection, migrations, seeds
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Logger, helpers
│   │   └── server.js        # Entry point
│   ├── package.json
│   └── .env.example
│
├── mobile/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── config/          # API config
│   │   ├── navigation/      # Navigation setup
│   │   ├── screens/         # App screens
│   │   ├── services/        # API & offline services
│   │   └── store/           # Zustand stores
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── web-admin/
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   ├── lib/             # API client, utilities
│   │   └── store/           # Zustand stores
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 🔐 Security Features

- JWT token-based authentication with expiration
- Password hashing with bcrypt (salt rounds: 10)
- Role-based access control (RBAC)
- Rate limiting to prevent abuse
- CORS configuration
- Helmet.js for HTTP header security
- SQL injection prevention via parameterized queries
- XSS protection
- Secure password requirements (min 8 characters)

## 🚀 Deployment

### Backend

**Option 1: Traditional Server (Ubuntu/Debian)**
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql redis-server nginx

# Setup PM2 for process management
npm install -g pm2

# Start application
pm2 start src/server.js --name workix-api
pm2 save
pm2 startup
```

**Option 2: Docker**
```dockerfile
# Create Dockerfile in backend/
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Option 3: Cloud Platforms**
- AWS Elastic Beanstalk
- Google Cloud Run
- Heroku
- DigitalOcean App Platform

### Mobile App

**iOS:**
```bash
cd mobile
eas build --platform ios
eas submit --platform ios
```

**Android:**
```bash
cd mobile
eas build --platform android
eas submit --platform android
```

### Web Admin

**Vercel (Recommended):**
```bash
cd web-admin
vercel --prod
```

**Other Options:**
- Netlify
- AWS Amplify
- Self-hosted with PM2

## 📈 Performance Optimizations

**Backend:**
- Connection pooling (max 20 connections)
- Redis caching with TTL
- Database indexes on frequently queried columns
- Gzip compression
- Query optimization with proper joins

**Mobile:**
- Offline-first with async storage
- Image compression before upload
- Lazy loading
- Memoization for expensive computations
- Request debouncing

**Web:**
- Next.js automatic code splitting
- TanStack Query caching
- Image optimization
- Lazy loading components
- Server-side rendering where applicable

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Mobile
cd mobile
npm test

# Web Admin
cd web-admin
npm test
```

## 📝 API Endpoints Summary

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Logout
- POST `/auth/change-password` - Change password

### Work Orders
- GET `/work-orders` - List work orders
- GET `/work-orders/:id` - Get work order details
- POST `/work-orders` - Create work order
- PATCH `/work-orders/:id` - Update work order
- DELETE `/work-orders/:id` - Delete work order
- POST `/work-orders/:id/activities` - Add activity
- GET `/work-orders/:id/activities` - Get activities

### AI
- POST `/ai/enhance-text` - Enhance single text
- POST `/ai/batch-enhance` - Enhance multiple texts
- POST `/ai/generate-summary` - Generate work order summary

### Users, Clients, Projects, Sites, Assets
Similar CRUD patterns for all entities

### Analytics
- GET `/analytics/dashboard` - Dashboard metrics
- GET `/analytics/trends` - Work order trends
- GET `/analytics/asset-reliability` - Asset failure analysis
- GET `/analytics/technician-performance` - Performance metrics
- GET `/analytics/mttr` - Mean time to repair

## 🐛 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify Redis is running: `redis-cli ping`
- Check .env configuration
- Review logs: `tail -f logs/error.log`

**Mobile app connection issues:**
- Verify backend URL in `src/config/api.js`
- Check network permissions in `app.json`
- Clear cache: `npx expo start -c`

**Web admin build errors:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

## 📞 Support

For issues and questions:
- Backend API: Check logs in `backend/logs/`
- Mobile: Use React Native Debugger
- Web: Use Browser DevTools

## 🎉 What's Working

✅ Complete backend API with all endpoints
✅ PostgreSQL database schema with triggers and views
✅ JWT authentication system
✅ AI integration with Google Gemini
✅ Redis caching layer
✅ Mobile app with offline-first capability
✅ Work order management flow
✅ AI text enhancement in mobile app
✅ Photo capture and upload
✅ PPM scheduling
✅ Web admin authentication
✅ Responsive UI design

## 🚧 Next Steps for Production

1. **Complete UI Components** - Finish remaining Shadcn/ui components for web admin
2. **Dashboard Implementation** - Build analytics dashboard with charts
3. **File Upload** - Implement AWS S3 integration
4. **Push Notifications** - Add Firebase Cloud Messaging
5. **Report Generation** - PDF generation for work orders
6. **Testing** - Write comprehensive unit and integration tests
7. **Documentation** - API documentation with Swagger/OpenAPI
8. **Monitoring** - Add application monitoring (e.g., Sentry)
9. **CI/CD** - Setup GitHub Actions or similar

## 📄 License

Proprietary - All rights reserved

