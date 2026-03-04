#!/bin/sh
echo "=========================================="
echo "  NOWEN - Starting..."
echo "=========================================="
echo "Architecture: $(uname -m)"
echo ""

# ============================================================
# 🔑 数据持久化 — 终极防呆设计（兼容绿联/飞牛等 NAS）
# ============================================================
# 
# ⚠️ 问题根因：
#   绿联/飞牛等 NAS 的 Docker GUI 会为每个容器创建独立的存储目录，
#   路径格式为: 共享文件夹/docker/<容器名>/app_server_data
#   当更新镜像重建容器时，容器名从 xxx-1 变成 xxx-2，
#   新的存储目录是空的，导致数据丢失。
#   更关键的是：如果 Dockerfile 声明了 VOLUME，NAS 会为 VOLUME
#   路径也创建独立目录，安全备份卷也一起丢失。
#
# 解决策略：
#   1. Dockerfile 中不声明 VOLUME（避免 NAS 自动创建新目录）
#   2. 安全备份放在 /app/.nowen-safe（镜像层内路径，NAS 不挂载）
#   3. 启动时扫描宿主机旧容器目录，自动找回数据
#   4. 同时兼容用户手动配置的 bind mount / named volume
# ============================================================

DATA_DIR="/app/server/data"
DB_FILE="${DATA_DIR}/zen-garden.db"
BACKUP_DIR="${DATA_DIR}/backups"
# 🔑 安全备份使用镜像层内路径（不是 VOLUME，NAS 不会挂载它）
SAFE_BACKUP_DIR="/app/.nowen-safe"
SAFE_DB_FILE="${SAFE_BACKUP_DIR}/zen-garden.db.safe"

# 确保目录存在
mkdir -p "${BACKUP_DIR}"
mkdir -p "${SAFE_BACKUP_DIR}"

# ============================================================
# 第一步：挂载检测
# ============================================================
check_mount() {
  MOUNT_MARKER="${DATA_DIR}/.mount-marker"
  
  if mount | grep -q "/app/server/data"; then
    MOUNT_TYPE=$(mount | grep "/app/server/data" | head -1)
    echo "✅ Data volume detected: mounted"
    echo "   Mount info: ${MOUNT_TYPE}"
    return 0
  else
    if [ -f "${MOUNT_MARKER}" ]; then
      echo "✅ Data volume detected: persistent (marker found)"
      return 0
    else
      echo "⚠️  WARNING: Data directory may not be properly mounted!"
      echo ""
      echo "┌───────────────────────────────────────────────────┐"
      echo "│  ⚠️  数据持久化警告 / Data Persistence Warning   │"
      echo "├───────────────────────────────────────────────────┤"
      echo "│                                                   │"
      echo "│  未检测到数据卷挂载。                              │"
      echo "│  NOWEN 会自动在镜像内保留备份，但强烈建议         │"
      echo "│  在 NAS Docker 设置中手动指定宿主机存储路径：      │"
      echo "│                                                   │"
      echo "│  宿主机路径(固定) → /app/server/data               │"
      echo "│                                                   │"
      echo "└───────────────────────────────────────────────────┘"
      echo ""
      echo "$(date -Iseconds)" > "${MOUNT_MARKER}"
      return 1
    fi
  fi
}

# ============================================================
# 第二步：数据恢复（优先级从高到低）
# ============================================================
recover_database() {
  if [ -f "${DB_FILE}" ]; then
    DB_SIZE=$(ls -lh "${DB_FILE}" | awk '{print $5}')
    echo "✅ Database found: zen-garden.db (${DB_SIZE})"
    
    # 启动前备份到 data/backups/
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp "${DB_FILE}" "${BACKUP_DIR}/zen-garden_${TIMESTAMP}.db.bak"
    echo "   Auto backup: zen-garden_${TIMESTAMP}.db.bak"
    
    # 同步到镜像层内的安全备份
    cp "${DB_FILE}" "${SAFE_DB_FILE}"
    echo "   Safe backup synced to image layer"
    
    # 清理旧备份，只保留最近 5 个
    cd "${BACKUP_DIR}" && ls -1t *.db.bak 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    cd /app
    return 0
  fi

  echo "⚠️  Database not found in data directory!"
  echo ""

  # ============================================================
  # 恢复源 1: 镜像层内安全备份（/app/.nowen-safe/）
  # 这个路径在镜像层内，NAS 不会为它创建新目录
  # ============================================================
  if [ -f "${SAFE_DB_FILE}" ]; then
    SAFE_SIZE=$(ls -lh "${SAFE_DB_FILE}" | awk '{print $5}')
    echo "🔄 Found safe backup in image layer (${SAFE_SIZE}), restoring..."
    cp "${SAFE_DB_FILE}" "${DB_FILE}"
    if [ -f "${DB_FILE}" ]; then
      echo "✅ Database restored from image-layer safe backup!"
      return 0
    fi
  fi
  
  # ============================================================
  # 恢复源 1.5: 兼容旧版安全备份路径（/app/.data-backup/）
  # ============================================================
  OLD_SAFE_FILE="/app/.data-backup/zen-garden.db.safe"
  if [ -f "${OLD_SAFE_FILE}" ]; then
    OLD_SAFE_SIZE=$(ls -lh "${OLD_SAFE_FILE}" | awk '{print $5}')
    echo "🔄 Found legacy safe backup (${OLD_SAFE_SIZE}), restoring..."
    cp "${OLD_SAFE_FILE}" "${DB_FILE}"
    if [ -f "${DB_FILE}" ]; then
      echo "✅ Database restored from legacy safe backup!"
      return 0
    fi
  fi

  # ============================================================
  # 恢复源 2: data/backups/ 目录
  # ============================================================
  LATEST_BACKUP=$(ls -1t "${BACKUP_DIR}"/*.db.bak 2>/dev/null | head -1)
  if [ -n "${LATEST_BACKUP}" ]; then
    echo "🔄 Found backup: ${LATEST_BACKUP}"
    echo "   Restoring from backup..."
    cp "${LATEST_BACKUP}" "${DB_FILE}"
    if [ -f "${DB_FILE}" ]; then
      echo "✅ Database restored from backup!"
      return 0
    fi
  fi

  # ============================================================
  # 恢复源 3: 扫描宿主机常见路径 + 绿联/飞牛旧容器目录
  # 这是关键！绿联 NAS 的 Docker 数据存储在宿主机的
  # /docker/<容器名>/ 目录下，通过 /host 只读挂载可以访问
  # ============================================================
  echo "🔍 Scanning host filesystem for existing NOWEN data..."
  
  # 3a: 扫描绿联/飞牛等 NAS 的旧容器目录
  # 绿联挂载格式: 共享文件夹/docker/<容器名>/app_server_data/zen-garden.db
  # 在 /host 挂载下查找
  if [ -d "/host" ]; then
    echo "   Scanning NAS old container directories..."
    # 搜索所有可能的 docker 目录
    for DOCKER_BASE in \
      "/host/docker" \
      "/host/DATA/docker" \
      "/host/volume1/docker" \
      "/host/volume2/docker" \
      "/host/mnt/docker" \
      "/host/opt/docker" \
      "/host/home/docker" \
      "/host/mnt/user1/docker" \
      "/host/mnt/media_rw"; do
      if [ -d "${DOCKER_BASE}" ]; then
        # 搜索该 docker 目录下所有包含 nowen 的容器目录
        for CONTAINER_DIR in $(find "${DOCKER_BASE}" -maxdepth 2 -type d -iname "*nowen*" 2>/dev/null); do
          # 搜索该容器目录下的所有 zen-garden.db 文件
          for DB_FOUND in $(find "${CONTAINER_DIR}" -name "zen-garden.db" -type f 2>/dev/null); do
            FOUND_SIZE=$(ls -lh "${DB_FOUND}" 2>/dev/null | awk '{print $5}')
            # 验证文件大小（大于 100 字节才是有效数据库）
            FOUND_BYTES=$(stat -c%s "${DB_FOUND}" 2>/dev/null || stat -f%z "${DB_FOUND}" 2>/dev/null || echo "0")
            if [ "${FOUND_BYTES}" -gt 100 ] 2>/dev/null; then
              echo "🎉 Found database in old container: ${DB_FOUND} (${FOUND_SIZE})"
              cp "${DB_FOUND}" "${DB_FILE}" 2>/dev/null
              if [ -f "${DB_FILE}" ]; then
                echo "✅ Database restored from NAS old container directory!"
                # 同步到安全备份
                cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
                return 0
              fi
            fi
          done
        done
        
        # 也搜索非 nowen 名称但包含 cropflre 的目录
        for CONTAINER_DIR in $(find "${DOCKER_BASE}" -maxdepth 2 -type d -iname "*cropflre*" 2>/dev/null); do
          for DB_FOUND in $(find "${CONTAINER_DIR}" -name "zen-garden.db" -type f 2>/dev/null); do
            FOUND_SIZE=$(ls -lh "${DB_FOUND}" 2>/dev/null | awk '{print $5}')
            FOUND_BYTES=$(stat -c%s "${DB_FOUND}" 2>/dev/null || stat -f%z "${DB_FOUND}" 2>/dev/null || echo "0")
            if [ "${FOUND_BYTES}" -gt 100 ] 2>/dev/null; then
              echo "🎉 Found database in old container: ${DB_FOUND} (${FOUND_SIZE})"
              cp "${DB_FOUND}" "${DB_FILE}" 2>/dev/null
              if [ -f "${DB_FILE}" ]; then
                echo "✅ Database restored from NAS old container directory!"
                cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
                return 0
              fi
            fi
          done
        done
      fi
    done
    
    # 3b: 扫描传统绑定挂载路径
    for SCAN_PATH in \
      "/host/volume1/docker/nowen/data/zen-garden.db" \
      "/host/volume2/docker/nowen/data/zen-garden.db" \
      "/host/DATA/docker/nowen/data/zen-garden.db" \
      "/host/mnt/docker/nowen/data/zen-garden.db" \
      "/host/opt/docker/nowen/data/zen-garden.db" \
      "/host/home/docker/nowen/data/zen-garden.db" \
      "/host/root/nowen-data/zen-garden.db" \
      "/host/home/nowen-data/zen-garden.db"; do
      if [ -f "${SCAN_PATH}" ]; then
        FOUND_SIZE=$(ls -lh "${SCAN_PATH}" | awk '{print $5}')
        echo "🎉 Found existing database at: ${SCAN_PATH} (${FOUND_SIZE})"
        cp "${SCAN_PATH}" "${DB_FILE}"
        if [ -f "${DB_FILE}" ]; then
          echo "✅ Database restored from host filesystem!"
          cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
          return 0
        fi
      fi
    done
    
    # 3c: 最后的搜索 — 全局搜索 /host 下所有 zen-garden.db（限时 30 秒）
    echo "   Deep scanning for zen-garden.db on host (timeout 30s)..."
    DEEP_FOUND=$(timeout 30 find /host -name "zen-garden.db" -type f -size +100c 2>/dev/null | head -5)
    for DB_FOUND in ${DEEP_FOUND}; do
      FOUND_SIZE=$(ls -lh "${DB_FOUND}" 2>/dev/null | awk '{print $5}')
      echo "🎉 Found database: ${DB_FOUND} (${FOUND_SIZE})"
      cp "${DB_FOUND}" "${DB_FILE}" 2>/dev/null
      if [ -f "${DB_FILE}" ]; then
        echo "✅ Database restored from deep host scan!"
        cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
        return 0
      fi
    done
  fi

  # ============================================================
  # 恢复源 4: Docker 卷扫描
  # ============================================================
  if command -v docker > /dev/null 2>&1; then
    echo "🔍 Scanning Docker volumes for orphaned data..."
    for VOL in $(docker volume ls -q 2>/dev/null); do
      INSPECT_PATH=$(docker volume inspect "${VOL}" --format '{{ .Mountpoint }}' 2>/dev/null)
      if [ -n "${INSPECT_PATH}" ] && [ -f "${INSPECT_PATH}/zen-garden.db" ]; then
        FOUND_SIZE=$(ls -lh "${INSPECT_PATH}/zen-garden.db" 2>/dev/null | awk '{print $5}')
        echo "🎉 Found orphaned data in volume '${VOL}' (${FOUND_SIZE})"
        cp "${INSPECT_PATH}/zen-garden.db" "${DB_FILE}" 2>/dev/null
        if [ -f "${DB_FILE}" ]; then
          echo "✅ Database restored from orphaned Docker volume!"
          cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
          return 0
        fi
      fi
    done
  fi

  echo "📝 No existing data found anywhere — creating fresh database"
  echo ""
  return 1
}

# ============================================================
# 第三步：运行时持续备份（后台进程）
# ============================================================
start_safe_backup_daemon() {
  # 每 3 分钟将 db 同步到镜像层内的安全备份
  while true; do
    sleep 180
    if [ -f "${DB_FILE}" ]; then
      cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
      # 也尝试备份到旧路径（兼容已挂载 /app/.data-backup 的用户）
      if [ -d "/app/.data-backup" ]; then
        cp "${DB_FILE}" "/app/.data-backup/zen-garden.db.safe" 2>/dev/null
      fi
    fi
  done &
  BACKUP_DAEMON_PID=$!
  echo "   Safe backup daemon: PID ${BACKUP_DAEMON_PID} (every 3min)"
}

# ============================================================
# 第四步：优雅停止时保存
# ============================================================
graceful_shutdown() {
  echo ""
  echo "🛑 Shutting down NOWEN..."
  
  # 同步最新数据到安全备份（镜像层内）
  if [ -f "${DB_FILE}" ]; then
    cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
    echo "✅ Final safe backup saved to image layer"
    # 也备份到旧路径
    if [ -d "/app/.data-backup" ]; then
      cp "${DB_FILE}" "/app/.data-backup/zen-garden.db.safe" 2>/dev/null
    fi
  fi
  
  # 停止后台进程
  kill "${BACKUP_DAEMON_PID}" 2>/dev/null
  kill "${BACKEND_PID}" 2>/dev/null
  
  # 停止 nginx
  nginx -s quit 2>/dev/null
  
  echo "👋 NOWEN stopped"
  exit 0
}

# 注册信号处理
trap graceful_shutdown SIGTERM SIGINT

# ============================================================
# 执行启动流程
# ============================================================

echo "--- Data Persistence Check ---"
check_mount
echo ""

echo "--- Database Recovery ---"
recover_database
RECOVERY_RESULT=$?
echo ""

# 显示数据目录内容
echo "📁 Data directory contents:"
ls -la "${DATA_DIR}/" 2>/dev/null
echo ""

# 启动安全备份守护进程
start_safe_backup_daemon

# 启动后端
echo "Starting backend on port 3001..."
cd /app/server && tsx src/index.ts &
BACKEND_PID=$!
sleep 2

# 启动后再次同步（initDatabase 可能创建了新库）
if [ -f "${DB_FILE}" ]; then
  cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
fi

# 启动 nginx（前台运行）
echo "Starting nginx on port 3000..."
nginx -g "daemon off;" &
NGINX_PID=$!

# 等待任意子进程退出
wait ${NGINX_PID} ${BACKEND_PID}
