# Stage 1: Build
FROM node:20.18.1-alpine3.20 AS builder

# Add metadata
LABEL maintainer="Arcane Football <support@arcane.football>"
LABEL version="1.0.0"
LABEL description="Arcane Football Backend API"

# Security: Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client and build
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20.18.1-alpine3.20 AS production

# Add metadata
LABEL maintainer="Arcane Football <support@arcane.football>"
LABEL version="1.0.0"
LABEL description="Arcane Football Backend API - Production"

# Security: Install dumb-init and ca-certificates
RUN apk add --no-cache dumb-init ca-certificates tzdata && \
    rm -rf /var/cache/apk/*

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Security: Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/

# Copy built application from builder stage
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules

# Copy scripts
COPY --chown=nodejs:nodejs start.sh ./

# Make start script executable (already owned by nodejs)
USER root
RUN chmod +x start.sh
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } }).on('error', () => { process.exit(1); });"

# Security: Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["sh", "start.sh"]
