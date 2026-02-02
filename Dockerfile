# NOWEN - Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build || true

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies for backend
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy backend source (for tsx to run)
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Install a simple static file server
RUN npm install -g serve

# Create data directory
RUN mkdir -p /app/server/data

# Expose ports
EXPOSE 3000 3001

# Start script
COPY <<EOF /app/start.sh
#!/bin/sh
cd /app/server && tsx src/index.ts &
serve -s /app/dist -l 3000
EOF

# 修改这里：先用 sed 删除回车符，再给执行权限
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
