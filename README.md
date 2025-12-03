# Workix - EPC Service Management Platform

> A comprehensive, AI-powered service lifecycle management system for Energy Performance Contracting (EPC) projects, featuring a mobile app for field technicians and a Tauri desktop app for internal teams.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React Native](https://img.shields.io/badge/react--native-0.73-blue.svg)
![Tauri](https://img.shields.io/badge/tauri-2.0-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Workix is a modern, enterprise-grade service management platform designed specifically for Energy Performance Contracting projects. It digitizes and streamlines the entire service lifecycle from issue detection to resolution, replacing manual processes with an intelligent, mobile-first workflow.

### Why Workix?

- **🚀 Lightning Fast**: Redis caching and optimized queries ensure sub-200ms response times
- **📱 Mobile-First**: Built for technicians in the field with offline-first capability
- **🤖 AI-Powered**: Google Gemini integration transforms rough notes into professional reports
- **📊 Data-Driven**: Comprehensive analytics for performance tracking and optimization
- **🔒 Enterprise Security**: JWT authentication, RBAC, and encrypted data storage
- **⚡ Real-Time**: Instant work order updates and notifications

## ✨ Features

### For Field Technicians (Mobile App)

- **Service Request Inbox**
  - Priority-based work order queue
  - Real-time notifications
  - Swipe-to-acknowledge gestures

- **Work Order Management**
  - Detailed asset information
  - Step-by-step workflows
  - Photo capture and documentation
  - Digital signature collection

- **AI Assistant**
  - One-tap text enhancement
  - Context-aware rewriting (observation, action, recommendation)
  - Professional report generation

- **Offline Capability**
  - Full offline data access
  - Automatic sync when online
  - Queued requests processing

- **PPM Scheduling**
  - Calendar view of preventive maintenance
  - Task checklists
  - Automated scheduling

### For Internal Teams (Desktop App)

- **Dashboard & Analytics**
  - Real-time KPI monitoring
  - Work order trends and statistics
  - Technician performance metrics
  - Asset reliability analysis

- **Project Management**
  - Hierarchical organization (Client → Project → Site → Asset)
  - Comprehensive asset tracking
  - Performance baseline management

- **Work Order Oversight**
  - Master view with advanced filtering
  - Drag-and-drop assignment
  - Status tracking
  - Activity history

- **User Management**
  - Role-based access control
  - Team organization
  - Activity auditing

- **Reporting**
  - Pre-built report templates
  - Custom report builder
  - Export to PDF/Excel
  - Automated report scheduling

## 🏗️ Architecture

Workix follows a modern, scalable three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│  ┌──────────────────┐         ┌───────────────────┐    │
│  │   Mobile App     │         │   Desktop App     │    │
│  │  (React Native)  │         │ (Tauri + Next.js) │    │
│  └──────────────────┘         └───────────────────┘    │
└─────────────────┬───────────────────┬──────────────────┘
                  │                   │
                  │   REST API        │
                  │   (JWT Auth)      │
                  │                   │
┌─────────────────┴───────────────────┴──────────────────┐
│              Backend API Layer (Node.js)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │  Express │  │   JWT    │  │  Google Gemini   │     │
│  │  Routes  │  │  Auth    │  │  AI Integration  │     │
│  └──────────┘  └──────────┘  └──────────────────┘     │
└─────────────────┬───────────────────┬──────────────────┘
                  │                   │
┌─────────────────┴───────────────────┴──────────────────┐
│                   Data Layer                            │
│  ┌──────────────────┐         ┌─────────────────┐     │
│  │   PostgreSQL     │         │     Redis       │     │
│  │  (Primary DB)    │         │    (Cache)      │     │
│  └──────────────────┘         └─────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │          AWS S3 (File Storage)               │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis
- Google Gemini API Key
- (Optional) Expo CLI for mobile development

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd workix
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# (Optional) Seed demo data
npm run seed

# Start server
npm run dev
```

Backend will be available at `http://localhost:5000`

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start

# Scan QR code with Expo Go app
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### 4. Desktop App Setup

```bash
cd workix-desktop

# Install dependencies
npm install

# Start development server (web mode)
npm run dev

# Or start as Tauri desktop app
npm run tauri dev
```

Desktop app will be available at `http://localhost:3033` (web mode) or as a native app

### 5. Login with Demo Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workix.com | Admin@123 |
| Technician | john.tech@workix.com | Tech@123 |
| Analyst | analyst@workix.com | Tech@123 |

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed installation and configuration
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [API Documentation](#) - Coming soon
- [User Manual](#) - Coming soon

## 📱 Screenshots

### Mobile App

| Home Screen | Work Order Detail | Activity List |
|-------------|-------------------|---------------|
| ![Home](docs/screenshots/mobile-home.png) | ![Detail](docs/screenshots/mobile-detail.png) | ![Activity](docs/screenshots/mobile-activity.png) |

### Desktop App

| Dashboard | Work Orders | Analytics |
|-----------|-------------|-----------|
| ![Dashboard](docs/screenshots/web-dashboard.png) | ![Work Orders](docs/screenshots/web-workorders.png) | ![Analytics](docs/screenshots/web-analytics.png) |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 14 with optimized indexes
- **Cache**: Redis 6+
- **Authentication**: JWT with bcrypt
- **AI**: Google Gemini Flash 1.5
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate limiting

### Mobile App
- **Framework**: React Native 0.73 (Expo)
- **State Management**: Zustand
- **UI Library**: React Native Paper
- **Navigation**: React Navigation 6
- **Storage**: Async Storage + Expo Secure Store
- **Network**: Axios with offline queue
- **Images**: Expo Image Picker & Camera
- **Utilities**: date-fns

### Desktop App
- **Framework**: Tauri 2.0 + Next.js 14 (App Router)
- **Language**: TypeScript + Rust
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

## 📁 Project Structure

```
workix/
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── database/       # DB setup, migrations, seeds
│   │   ├── middlewares/    # Auth, validation, errors
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helpers and utilities
│   │   └── server.js       # Entry point
│   ├── logs/               # Application logs
│   ├── package.json
│   └── .env.example
│
├── mobile/                  # React Native Mobile App
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── config/         # App configuration
│   │   ├── navigation/     # Navigation setup
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API & offline services
│   │   └── store/          # State management
│   ├── assets/             # Images, fonts
│   ├── App.js              # Entry point
│   ├── app.json            # Expo configuration
│   └── package.json
│
├── workix-desktop/         # Tauri Desktop App
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   │   └── ui/        # Shadcn/ui components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript types
│   ├── src-tauri/         # Tauri/Rust backend
│   ├── public/            # Static files
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                  # Documentation
├── SETUP.md              # Setup instructions
├── DEPLOYMENT.md         # Deployment guide
└── README.md             # This file
```

## 🤝 Contributing

This is a proprietary project. For internal contributors:

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Submit a pull request
5. Wait for review and approval

## 📄 License

Proprietary - All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

## 📞 Support

For support and inquiries:
- **Technical Issues**: Open an issue in the repository
- **Feature Requests**: Submit via issue tracker
- **Security Concerns**: Contact security@yourcompany.com

## 🙏 Acknowledgments

- Built with ❤️ for field technicians
- Powered by Google Gemini AI
- UI/UX inspired by modern mobile-first design principles

---

**Made with ⚡ by Your Team**

