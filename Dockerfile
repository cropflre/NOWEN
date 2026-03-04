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

# Create data directory and safe backup directory
RUN mkdir -p /app/server/data /app/.data-backup

# 🔑 声明数据卷 — 确保用户数据在容器更新/重建后不丢失
# 即使用户不手动配置 -v 挂载（如绿联/飞牛 NAS 的 Docker 界面），
# Docker 也会自动创建匿名卷(named volume)来持久化此目录
# 同时声明安全备份目录为卷，提供二次保障
VOLUME ["/app/server/data", "/app/.data-backup"]

# 暴露端口
EXPOSE 3000 3001

# 🔑 确保容器停止时发送 SIGTERM，让 start.sh 有机会保存数据
STOPSIGNAL SIGTERM

# Start script
COPY start.sh /app/start.sh
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
