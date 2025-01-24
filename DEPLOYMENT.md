# Deployment Guide

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- AWS Account with S3 access
- Vercel Account
- GitHub Account

## Environment Variables

Ensure the following environment variables are set in your deployment environment:

```bash
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# File Upload
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# AWS (for backups)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-west-1
AWS_BACKUP_BUCKET=your-backup-bucket

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Redis
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
```

## Deployment Checklist

### 1. Pre-deployment
- [ ] Run security audit: `npm audit`
- [ ] Run type checking: `npm run type-check`
- [ ] Run tests: `npm test`
- [ ] Check for environment variables
- [ ] Backup database
- [ ] Review API endpoints for breaking changes

### 2. Database
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Verify database connections
- [ ] Check database indexes
- [ ] Verify backup system

### 3. Security
- [ ] Verify SSL/TLS configuration
- [ ] Check security headers
- [ ] Review API rate limits
- [ ] Verify authentication flows
- [ ] Check file upload restrictions

### 4. Performance
- [ ] Enable compression
- [ ] Configure caching
- [ ] Verify CDN setup
- [ ] Check API response times
- [ ] Review bundle size

### 5. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring
- [ ] Set up alerts

### 6. Deployment Steps

1. **Prepare for Deployment**
   ```bash
   # Install dependencies
   npm ci
   
   # Build application
   npm run build
   ```

2. **Database Migration**
   ```bash
   # Deploy migrations
   npx prisma migrate deploy
   
   # Verify database
   npx prisma db seed
   ```

3. **Deploy to Vercel**
   ```bash
   # Deploy
   vercel --prod
   ```

4. **Post-deployment Verification**
   - [ ] Verify application health check
   - [ ] Test critical user flows
   - [ ] Monitor error rates
   - [ ] Check API responses
   - [ ] Verify file uploads
   - [ ] Test authentication
   - [ ] Verify database queries

### 7. Rollback Plan

In case of deployment issues:

1. **Revert Code**
   ```bash
   # Revert to last known good commit
   git revert HEAD
   git push
   ```

2. **Database Rollback**
   ```bash
   # Rollback last migration
   npx prisma migrate reset
   ```

3. **Restore Backup**
   ```bash
   # Restore from latest backup
   npm run backup:restore
   ```

## Monitoring & Maintenance

### Daily Checks
- [ ] Review error logs
- [ ] Check API response times
- [ ] Monitor database performance
- [ ] Verify backup completion
- [ ] Check disk usage

### Weekly Tasks
- [ ] Review security updates
- [ ] Check database indexes
- [ ] Analyze API usage patterns
- [ ] Review performance metrics
- [ ] Test backup restoration

### Monthly Tasks
- [ ] Rotate access keys
- [ ] Review and update dependencies
- [ ] Perform security audit
- [ ] Review and optimize costs
- [ ] Test disaster recovery plan

## Support

For deployment issues:
1. Check logs in Vercel dashboard
2. Review error tracking in Sentry
3. Check database logs
4. Review GitHub Actions logs
5. Contact support team

## Useful Commands

```bash
# Health check
curl https://your-domain.com/api/health

# Verify database connection
npx prisma db seed

# Manual backup
npm run backup:create

# Restore from backup
npm run backup:restore

# Clear cache
npm run cache:clear

# Check security headers
curl -I https://your-domain.com
``` 