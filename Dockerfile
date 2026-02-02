# NOWEN - 高颜值 Bento 风格个人导航页
# 支持书签管理、分类管理、名言管理、自定义图标
# GitHub: https://github.com/cropflre/NOWEN

# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 生产环境打包时 VITE_API_BASE 为空，使用相对路径 /api
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

# OCI 标准标签 - 用于 Docker Hub 显示
LABEL org.opencontainers.image.title="NOWEN"
LABEL org.opencontainers.image.description="高颜值 Bento 风格个人导航页，支持书签管理、分类管理、名言管理、自定义图标，一键 Docker 部署"
LABEL org.opencontainers.image.url="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.source="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.vendor="cropflre"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx \
    && mkdir -p /run/nginx \
    && mkdir -p /var/log/nginx

# Install production dependencies for backend
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy backend source
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create data directory
RUN mkdir -p /app/server/data

# 只需要暴露一个端口，Nginx 统一代理
EXPOSE 3000

# Start script - 启动 Nginx + Backend
COPY <<EOF /app/start.sh
#!/bin/sh
echo "Starting Nginx..."
nginx
echo "Nginx started on port 3000"
echo "Starting backend server..."
cd /app/server && tsx src/index.ts
EOF

RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
