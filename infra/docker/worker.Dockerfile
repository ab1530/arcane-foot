# =======================================
# ARCANE VIDEO WORKER - DOCKERFILE
# =======================================

FROM node:25-alpine

WORKDIR /app

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy worker source
COPY src/workers ./src/workers
COPY dist/workers ./dist/workers

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001 && \
    chown -R worker:nodejs /app

USER worker

# Start worker
CMD ["node", "dist/workers/video-processor.js"]
