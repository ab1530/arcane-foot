# AutoScout Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- OpenAI API account with GPT-4 access
- Existing Arcane Football backend setup

## Installation Steps

### 1. Install Required Dependencies

```bash
cd /Users/lakhdari/Desktop/AppFoot/backend

# Install OpenAI SDK
npm install openai

# Install cache-manager (if not already installed)
npm install cache-manager

# Install @nestjs/cache-manager (if not already installed)
npm install @nestjs/cache-manager
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-proj-...  # Get from https://platform.openai.com/api-keys

# AutoScout Configuration (OPTIONAL - defaults shown)
AUTOSCOUT_CACHE_TTL=3600           # Cache duration in seconds (1 hour)
AUTOSCOUT_MAX_BATCH_SIZE=50        # Max players in bulk operation
AUTOSCOUT_RATE_LIMIT_PER_HOUR=10   # Reports per hour per scout
AUTOSCOUT_BULK_RATE_LIMIT=3        # Bulk operations per hour
```

### 3. Update Database Schema

Run Prisma migration to add the `auto_generated_reports` table:

```bash
# Generate migration
npx prisma migrate dev --name add_auto_generated_reports

# Generate Prisma Client
npx prisma generate
```

Expected output:
```
✓ Generated Prisma Client
✓ The following migration(s) have been created and applied:
  20251106_add_auto_generated_reports
```

### 4. Verify Database Schema

Check that the table was created:

```bash
npx prisma studio
```

Navigate to `auto_generated_reports` model - you should see:
- id (String)
- playerId (String)
- matchId (String?)
- scoutId (String?)
- reportData (Json)
- qualityScore (Float)
- qualityBreakdown (Json)
- template (String)
- model (String)
- tokensUsed (Int)
- generationTime (Int)
- wasManuallyEdited (Boolean)
- savedAsReport (Boolean)
- savedReportId (String?)
- createdAt (DateTime)

### 5. Build the Application

```bash
# Compile TypeScript
npm run build

# Or run in development mode
npm run start:dev
```

Expected output:
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] AutoScoutModule dependencies initialized
[Nest] INFO  [RoutesResolver] AutoScoutController {/auto-scout}:
[Nest] INFO  [RouterExplorer] Mapped {/auto-scout/generate, POST} route
[Nest] INFO  [RouterExplorer] Mapped {/auto-scout/bulk-generate, POST} route
...
```

### 6. Run Unit Tests

```bash
# Run AutoScout tests
npm run test -- auto-scout.service.spec.ts

# Or run all tests
npm run test
```

Expected output:
```
PASS  src/modules/auto-scout/auto-scout.service.spec.ts
  AutoScoutService
    ✓ should be defined
    ✓ should generate a report successfully
    ✓ should return cached report if available
    ✓ should throw error if player not found
    ...

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### 7. Verify API Endpoints

Start the server and check Swagger docs:

```bash
npm run start:dev
```

Open browser to: `http://localhost:3000/api/docs`

You should see:
- `auto-scout` section in the API documentation
- 10 endpoints listed
- Full request/response schemas

### 8. Test Basic Functionality

Create a test script or use curl:

```bash
# Get available templates
curl -X GET http://localhost:3000/auto-scout/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Generate a test report (preview mode - no DB save)
curl -X GET http://localhost:3000/auto-scout/preview/PLAYER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get cost estimate
curl -X GET http://localhost:3000/auto-scout/cost-estimate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Verification Checklist

- [ ] Dependencies installed (`openai`, `cache-manager`)
- [ ] `.env` file updated with `OPENAI_API_KEY`
- [ ] Database migration applied successfully
- [ ] `auto_generated_reports` table exists in database
- [ ] Application builds without errors
- [ ] Unit tests pass
- [ ] Swagger docs show AutoScout endpoints
- [ ] Can access templates endpoint
- [ ] Can generate preview report
- [ ] Cost estimate endpoint works

## Common Setup Issues

### Issue 1: OpenAI API Key Not Found

**Error:**
```
Error: OPENAI_API_KEY environment variable not found
```

**Solution:**
```bash
# Make sure .env file has the key
echo "OPENAI_API_KEY=sk-proj-..." >> .env

# Restart the application
npm run start:dev
```

### Issue 2: Prisma Client Not Generated

**Error:**
```
Cannot find module '@prisma/client'
Error: Unknown model 'auto_generated_reports'
```

**Solution:**
```bash
npx prisma generate
npm run build
```

### Issue 3: Migration Fails

**Error:**
```
Error: Foreign key constraint failed
```

**Solution:**
```bash
# Check if players, matches, users tables exist
npx prisma studio

# If missing, run all migrations
npx prisma migrate deploy

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Issue 4: Rate Limit Too Restrictive

**Problem:** Getting 429 errors too frequently

**Solution:**
Update `.env`:
```bash
AUTOSCOUT_RATE_LIMIT_PER_HOUR=20  # Increase from default 10
```

Restart application.

### Issue 5: Cache Not Working

**Problem:** Same reports regenerated every time

**Solution:**
Check cache configuration in `auto-scout.module.ts`:
```typescript
CacheModule.register({
  ttl: 3600,  // 1 hour in seconds
  max: 100,   // max items
})
```

Verify cache-manager is installed:
```bash
npm install cache-manager
```

## Testing in Different Environments

### Development Environment

```bash
# .env.development
NODE_ENV=development
OPENAI_API_KEY=sk-proj-dev-...
AUTOSCOUT_RATE_LIMIT_PER_HOUR=50  # More lenient for testing
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
OPENAI_API_KEY=sk-proj-staging-...
AUTOSCOUT_RATE_LIMIT_PER_HOUR=10
AUTOSCOUT_CACHE_TTL=3600
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
OPENAI_API_KEY=sk-proj-prod-...
AUTOSCOUT_RATE_LIMIT_PER_HOUR=10
AUTOSCOUT_CACHE_TTL=3600

# Additional production settings
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
```

## Security Checklist

- [ ] OpenAI API key stored in environment variables (not in code)
- [ ] Rate limiting enabled on all endpoints
- [ ] JWT authentication required on all endpoints
- [ ] Role-based access control configured (SCOUT, ADMIN, DIRECTOR)
- [ ] CORS configured for production domain only
- [ ] Helmet middleware enabled
- [ ] Input validation with DTOs
- [ ] SQL injection protection (Prisma ORM)

## Performance Optimization

### 1. Database Indexing

Verify indexes exist (already included in schema):

```sql
-- Check indexes on auto_generated_reports
SELECT * FROM pg_indexes WHERE tablename = 'auto_generated_reports';
```

Should show indexes on:
- playerId
- scoutId
- createdAt
- qualityScore
- template

### 2. Cache Configuration

Adjust cache settings based on usage:

```typescript
// For high-traffic environments
CacheModule.register({
  ttl: 7200,   // 2 hours (less API calls)
  max: 500,    // More cached reports
})

// For low-traffic environments
CacheModule.register({
  ttl: 1800,   // 30 minutes (fresher data)
  max: 50,     // Less memory usage
})
```

### 3. Rate Limiting

Adjust based on team size and usage patterns:

```typescript
// For large organizations
ThrottlerModule.forRoot([{
  ttl: 3600000,  // 1 hour
  limit: 20,     // 20 reports per hour
}])

// For small teams
ThrottlerModule.forRoot([{
  ttl: 3600000,
  limit: 5,      // 5 reports per hour
}])
```

## Monitoring Setup

### 1. Cost Tracking

Set up regular cost monitoring:

```bash
# Create a cron job to check daily costs
# Add to crontab: crontab -e

0 9 * * * curl -X GET https://your-api.com/auto-scout/analytics?startDate=$(date -d "yesterday" +%Y-%m-%d) | mail -s "AutoScout Daily Report" admin@yourcompany.com
```

### 2. Quality Monitoring

Track quality scores:

```sql
-- Average quality score by template
SELECT
  template,
  AVG("qualityScore") as avg_quality,
  COUNT(*) as report_count
FROM auto_generated_reports
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY template
ORDER BY avg_quality DESC;
```

### 3. Error Logging

Enable detailed logging:

```typescript
// In auto-scout.service.ts
private readonly logger = new Logger(AutoScoutService.name);

// Logs are automatically sent to your logging provider
// Configure in main.ts or app.module.ts
```

## Backup and Recovery

### 1. Database Backup

```bash
# Backup auto_generated_reports table
pg_dump -U postgres -t auto_generated_reports arcane_football > autoscout_backup.sql

# Restore
psql -U postgres arcane_football < autoscout_backup.sql
```

### 2. Export Reports

```bash
# Export all reports to JSON
npx prisma db execute --file export_reports.sql > reports_export.json
```

### 3. Cache Backup

Cache is in-memory and will reset on restart. For persistent caching, consider:
- Redis integration
- Database-backed caching
- Distributed cache

## Deployment

### Docker Deployment

```dockerfile
# Dockerfile already exists, ensure these ENV vars are set
ENV OPENAI_API_KEY=sk-proj-...
ENV AUTOSCOUT_CACHE_TTL=3600
ENV AUTOSCOUT_RATE_LIMIT_PER_HOUR=10
```

### Railway Deployment

```bash
# Set environment variables in Railway dashboard
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set AUTOSCOUT_CACHE_TTL=3600

# Deploy
git push railway main
```

### AWS/DigitalOcean Deployment

```bash
# Set environment variables in platform
# Run migrations
npm run prisma:migrate:deploy

# Start application
npm run start:prod
```

## Post-Deployment Verification

Run these checks after deployment:

```bash
# 1. Health check
curl https://your-api.com/health

# 2. Check AutoScout endpoints
curl https://your-api.com/auto-scout/templates \
  -H "Authorization: Bearer TOKEN"

# 3. Generate test report
curl https://your-api.com/auto-scout/preview/TEST_PLAYER_ID \
  -H "Authorization: Bearer TOKEN"

# 4. Check analytics (admin only)
curl https://your-api.com/auto-scout/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Support and Troubleshooting

### Get Help

1. Check the main README.md for detailed documentation
2. Review EXAMPLE_REPORT.md for sample outputs
3. See IMPLEMENTATION_SUMMARY.md for technical details
4. Review unit tests for usage examples

### Debug Mode

Enable detailed logging:

```bash
# .env
LOG_LEVEL=debug
```

This will show:
- API request/response details
- GPT-4 prompts and responses
- Cache hit/miss information
- Performance metrics

### Contact

For bugs or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the main Arcane Football documentation

---

## Quick Start Script

Save this as `setup-autoscout.sh`:

```bash
#!/bin/bash

echo "AutoScout Setup Script"
echo "====================="

# Install dependencies
echo "Installing dependencies..."
npm install openai cache-manager @nestjs/cache-manager

# Check for OPENAI_API_KEY
if grep -q "OPENAI_API_KEY" .env; then
    echo "✓ OPENAI_API_KEY found in .env"
else
    echo "⚠ OPENAI_API_KEY not found in .env"
    echo "Please add: OPENAI_API_KEY=sk-proj-..."
    exit 1
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name add_auto_generated_reports

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run tests
echo "Running tests..."
npm run test -- auto-scout.service.spec.ts

# Build application
echo "Building application..."
npm run build

echo "✓ Setup complete!"
echo "Run 'npm run start:dev' to start the application"
```

Make executable and run:
```bash
chmod +x setup-autoscout.sh
./setup-autoscout.sh
```

---

**Setup Complete!** AutoScout is now ready to use. See README.md for API documentation and usage examples.
