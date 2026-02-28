# NOWEN - 高颜值 Bento 风格个人导航页
# 支持书签管理、分类管理、名言管理、自定义图标
# GitHub: https://github.com/cropflre/NOWEN
# 支持多架构: linux/amd64, linux/arm64 (RK3588/RK3576/RK3566 等)

# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# 安装前端构建所需的编译工具（bcrypt 等 native 模块需要）
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# OCI 标准标签
LABEL org.opencontainers.image.title="NOWEN"
LABEL org.opencontainers.image.description="高颜值 Bento 风格个人导航页，支持书签管理、分类管理、名言管理、自定义图标，一键 Docker 部署"
LABEL org.opencontainers.image.url="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.source="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.vendor="cropflre"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install nginx and docker-cli
RUN apk add --no-cache nginx docker-cli

# Install production dependencies for backend
# server 使用 bcryptjs（纯 JS）而非 bcrypt，无需编译工具
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Install tsx globally
RUN npm install -g tsx

# Copy backend source
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create data directory
RUN mkdir -p /app/server/data

# 暴露端口
EXPOSE 3000 3001

# Start script
COPY <<EOF /app/start.sh
#!/bin/sh
echo "=== NOWEN Starting ==="
echo "Architecture: $(uname -m)"
echo "Starting backend on port 3001..."
cd /app/server && tsx src/index.ts &
sleep 2
echo "Starting nginx on port 3000..."
nginx -g "daemon off;"
EOF

RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
