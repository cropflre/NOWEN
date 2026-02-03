# NOWEN - 高颜值 Bento 风格个人导航页
# 支持书签管理、分类管理、名言管理、自定义图标
# GitHub: https://github.com/cropflre/NOWEN

# Build stage for frontend
# 使用国内镜像源解决网络问题
FROM registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine AS production

# OCI 标准标签
LABEL org.opencontainers.image.title="NOWEN"
LABEL org.opencontainers.image.description="高颜值 Bento 风格个人导航页，支持书签管理、分类管理、名言管理、自定义图标，一键 Docker 部署"
LABEL org.opencontainers.image.url="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.source="https://github.com/cropflre/NOWEN"
LABEL org.opencontainers.image.vendor="cropflre"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install production dependencies for backend
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Install tsx globally
RUN npm install -g tsx

# Copy backend source
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Install http-server with proxy support
RUN npm install -g http-server

# Create data directory
RUN mkdir -p /app/server/data

# 暴露端口
EXPOSE 3000 3001

# Start script
COPY <<EOF /app/start.sh
#!/bin/sh
echo "=== NOWEN Starting ==="
echo "Starting backend on port 3001..."
cd /app/server && tsx src/index.ts &
sleep 2
echo "Starting frontend on port 3000..."
cd /app && http-server dist -p 3000 -a 0.0.0.0 --proxy http://127.0.0.1:3001
EOF

RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
