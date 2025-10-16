#!/bin/bash
# =======================================
# ARCANE DATABASE BACKUP SCRIPT
# =======================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="arcane_backup_${TIMESTAMP}.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Starting database backup...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo -e "${YELLOW}📦 Creating backup: $BACKUP_FILE${NC}"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: $SIZE${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Clean old backups
echo -e "${YELLOW}🧹 Cleaning backups older than $RETENTION_DAYS days...${NC}"
find "$BACKUP_DIR" -name "arcane_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
    echo -e "${GREEN}✅ Uploaded to S3${NC}"
fi

echo -e "${GREEN}✅ Backup process completed!${NC}"
