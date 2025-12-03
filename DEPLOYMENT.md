# Workix Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API keys secured
- [ ] SSL certificates ready
- [ ] Backup strategy in place
- [ ] Monitoring tools configured

### Backend Deployment

#### Option 1: AWS EC2 + RDS

1. **Database Setup (RDS)**
```bash
# Create PostgreSQL RDS instance
# - Engine: PostgreSQL 14+
# - Instance: t3.micro (dev) or larger
# - Storage: 20GB minimum
# - Enable automated backups
# - Configure security groups
```

2. **Redis Setup (ElastiCache)**
```bash
# Create Redis cluster
# - Engine: Redis 6+
# - Node type: cache.t3.micro or larger
# - Configure security groups
```

3. **EC2 Setup**
```bash
# Launch EC2 instance (Ubuntu 22.04)
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx postgresql-client redis-tools

# Clone repository
git clone <your-repo-url>
cd workix/backend

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
# Edit .env with production values

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start src/server.js --name workix-api
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/workix
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/workix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### Option 2: Docker Deployment

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: workix
      POSTGRES_USER: workix_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://workix_user:${DB_PASSWORD}@postgres:5432/workix
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### Mobile App Deployment

#### iOS (App Store)

1. **Prerequisites**
- Apple Developer Account ($99/year)
- Xcode with latest iOS SDK
- App Store Connect access

2. **Build & Submit**
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

3. **App Store Connect**
- Create app listing
- Add screenshots (required sizes)
- Write app description
- Set pricing (Free)
- Submit for review

#### Android (Google Play)

1. **Prerequisites**
- Google Play Developer Account ($25 one-time)
- Google Play Console access

2. **Build & Submit**
```bash
cd mobile

# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

3. **Google Play Console**
- Create app listing
- Add store listing assets
- Set content rating
- Submit for review

### Desktop App Deployment

#### Option 1: Build Installers

```bash
cd workix-desktop

# Build for all platforms
npm run tauri build

# Platform-specific builds
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-apple-darwin     # macOS
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

Installers will be in `src-tauri/target/release/bundle/`

#### Option 2: Auto-Update Server

Configure Tauri's built-in updater in `src-tauri/tauri.conf.json`:
```json
{
  "updater": {
    "active": true,
    "endpoints": ["https://releases.yourdomain.com/{{target}}/{{current_version}}"],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

#### Option 3: Web Mode (Development/Testing)

```bash
cd workix-desktop

# Build for web
npm run build

# Start with PM2
pm2 start npm --name "workix-desktop" -- start
pm2 save
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3033;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

### Backend (.env)

```bash
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/workix
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=workix
DB_USER=workix_user
DB_PASSWORD=<secure-password>

# Redis
REDIS_HOST=your-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# Security
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=7d

# AI
GEMINI_API_KEY=<your-gemini-key>

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=workix-production

# CORS
CORS_ORIGIN=https://admin.yourdomain.com,https://yourdomain.com
```

### Mobile (app.json)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.yourdomain.com/api/v1"
    }
  }
}
```

### Web Admin (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Post-Deployment

### 1. Database Backup

Setup automated backups:

```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR=/backups/postgres
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h your-db-host -U workix_user workix | gzip > $BACKUP_DIR/workix_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "workix_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### 2. Monitoring

Setup monitoring with:
- **Application:** PM2 monitoring, Sentry
- **Infrastructure:** AWS CloudWatch, Datadog
- **Uptime:** UptimeRobot, Pingdom
- **Logs:** CloudWatch Logs, Loggly

### 3. SSL/TLS

Ensure all endpoints use HTTPS:
- Backend API: https://api.yourdomain.com
- Web Admin: https://admin.yourdomain.com
- Mobile API calls: HTTPS only

### 4. Security Headers

Add security headers in Nginx:

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 5. Performance Optimization

- Enable Gzip compression
- Configure CDN for static assets
- Setup Redis caching properly
- Optimize database queries
- Enable connection pooling

## Rollback Plan

If deployment fails:

```bash
# Backend
pm2 stop workix-api
git checkout previous-stable-tag
npm ci
pm2 restart workix-api

# Database
psql -h host -U user workix < backup.sql

# Web Admin
vercel rollback
```

## Health Checks

Monitor these endpoints:
- Backend: `GET https://api.yourdomain.com/health`
- Web Admin: Homepage load time
- Mobile: API connectivity from app

## Cost Estimates (AWS)

**Minimum Setup:**
- RDS (db.t3.micro): ~$15/month
- ElastiCache (cache.t3.micro): ~$12/month
- EC2 (t3.small): ~$15/month
- S3 Storage: ~$5/month
- Total: ~$47/month

**Production Setup:**
- RDS (db.t3.medium): ~$60/month
- ElastiCache (cache.t3.small): ~$24/month
- EC2 (t3.medium): ~$30/month
- Load Balancer: ~$16/month
- S3 + CloudFront: ~$20/month
- Total: ~$150/month

## Support & Maintenance

### Regular Tasks

- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Performance review

### Scaling

When to scale:
- CPU usage consistently > 70%
- Memory usage > 80%
- Response time > 500ms
- More than 1000 concurrent users

Scaling options:
- Vertical: Larger instance types
- Horizontal: Load balancer + multiple instances
- Database: Read replicas
- Cache: Redis cluster

## Troubleshooting

### Backend Issues

```bash
# Check logs
pm2 logs workix-api

# Restart service
pm2 restart workix-api

# Check database connection
psql -h host -U user -d workix -c "SELECT 1;"

# Check Redis
redis-cli -h host ping
```

### Mobile App Issues

- Verify API URL in app configuration
- Check API is accessible from mobile networks
- Review app logs in crash reporting service
- Test on multiple devices/OS versions

### Web Admin Issues

```bash
# Check Next.js logs
pm2 logs workix-web

# Rebuild
npm run build
pm2 restart workix-web

# Check API connectivity
curl https://api.yourdomain.com/health
```

## Success Metrics

Track these KPIs:
- API uptime: > 99.9%
- Response time: < 200ms (p95)
- Error rate: < 0.1%
- Mobile app crash rate: < 1%
- User satisfaction: > 4.5/5

---

**Important:** Always test deployment process in staging environment before production deployment.

