#!/bin/sh
echo "=========================================="
echo "  NOWEN - Starting..."
echo "=========================================="
echo "Architecture: $(uname -m)"
echo ""

# ============================================================
# 🔑 数据持久化 — 防呆设计
# ============================================================
# 策略：
#   1. 主数据目录: /app/server/data（VOLUME 挂载点）
#   2. 安全备份目录: /app/.data-backup（镜像层外、VOLUME 声明外的独立路径）
#   3. 每次启动 + 运行中定期将 db 同步到安全备份目录
#   4. 如果主目录 db 丢失，自动从安全备份恢复
#   5. 挂载检测：检查 /app/server/data 是否正确挂载到宿主机
# ============================================================

DATA_DIR="/app/server/data"
DB_FILE="${DATA_DIR}/zen-garden.db"
BACKUP_DIR="${DATA_DIR}/backups"
SAFE_BACKUP_DIR="/app/.data-backup"
SAFE_DB_FILE="${SAFE_BACKUP_DIR}/zen-garden.db.safe"

# 确保目录存在
mkdir -p "${BACKUP_DIR}"
mkdir -p "${SAFE_BACKUP_DIR}"

# ============================================================
# 第一步：挂载检测
# ============================================================
check_mount() {
  # 写入一个标记文件来检测挂载状态
  MOUNT_MARKER="${DATA_DIR}/.mount-marker"
  
  # 检查是否有 bind mount 或 named volume
  if mount | grep -q "/app/server/data"; then
    MOUNT_TYPE=$(mount | grep "/app/server/data" | head -1)
    echo "✅ Data volume detected: mounted"
    echo "   Mount info: ${MOUNT_TYPE}"
    return 0
  else
    # 没有检测到挂载，但 VOLUME 声明可能已经生效（匿名卷）
    # 通过检查标记文件判断是否是同一个卷
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
      echo "│  未检测到数据卷挂载，更新容器可能导致数据丢失！   │"
      echo "│  No volume mount detected. Data may be lost on    │"
      echo "│  container update!                                │"
      echo "│                                                   │"
      echo "│  推荐配置 / Recommended Setup:                    │"
      echo "│                                                   │"
      echo "│  NAS Docker UI:                                   │"
      echo "│    宿主机路径 → /app/server/data                   │"
      echo "│    (如: /volume1/docker/nowen/data)                │"
      echo "│                                                   │"
      echo "│  Docker Compose:                                  │"
      echo "│    volumes:                                       │"
      echo "│      - nowen-data:/app/server/data                │"
      echo "│                                                   │"
      echo "└───────────────────────────────────────────────────┘"
      echo ""
      # 写入标记文件
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
    # 数据库存在，正常流程
    DB_SIZE=$(ls -lh "${DB_FILE}" | awk '{print $5}')
    echo "✅ Database found: zen-garden.db (${DB_SIZE})"
    
    # 启动前备份到 data/backups/
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp "${DB_FILE}" "${BACKUP_DIR}/zen-garden_${TIMESTAMP}.db.bak"
    echo "   Auto backup: zen-garden_${TIMESTAMP}.db.bak"
    
    # 同步到安全备份位置
    cp "${DB_FILE}" "${SAFE_DB_FILE}"
    echo "   Safe backup: synced"
    
    # 清理旧备份，只保留最近 5 个
    cd "${BACKUP_DIR}" && ls -1t *.db.bak 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    cd /app
    return 0
  fi

  echo "⚠️  Database not found in data directory!"
  echo ""

  # 恢复源 1: 安全备份（/app/.data-backup/）
  if [ -f "${SAFE_DB_FILE}" ]; then
    SAFE_SIZE=$(ls -lh "${SAFE_DB_FILE}" | awk '{print $5}')
    echo "🔄 Found safe backup (${SAFE_SIZE}), restoring..."
    cp "${SAFE_DB_FILE}" "${DB_FILE}"
    if [ -f "${DB_FILE}" ]; then
      echo "✅ Database restored from safe backup!"
      return 0
    fi
  fi

  # 恢复源 2: data/backups/ 目录
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

  # 恢复源 3: 扫描宿主机常见 NAS 路径（通过 /host 只读挂载）
  echo "🔍 Scanning host filesystem for existing NOWEN data..."
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
        return 0
      fi
    fi
  done

  # 恢复源 4: 检查 Docker 匿名卷残留（旧容器的数据）
  # 通过 docker 命令列出所有卷，查找包含 zen-garden.db 的
  if command -v docker > /dev/null 2>&1; then
    echo "🔍 Scanning Docker volumes for orphaned data..."
    FOUND_VOLUME=""
    for VOL in $(docker volume ls -q 2>/dev/null); do
      # 检查卷名是否包含 nowen 或检查卷内容
      INSPECT_PATH=$(docker volume inspect "${VOL}" --format '{{ .Mountpoint }}' 2>/dev/null)
      if [ -n "${INSPECT_PATH}" ] && [ -f "${INSPECT_PATH}/zen-garden.db" ]; then
        FOUND_SIZE=$(ls -lh "${INSPECT_PATH}/zen-garden.db" 2>/dev/null | awk '{print $5}')
        echo "🎉 Found orphaned data in volume '${VOL}' (${FOUND_SIZE})"
        cp "${INSPECT_PATH}/zen-garden.db" "${DB_FILE}" 2>/dev/null
        if [ -f "${DB_FILE}" ]; then
          echo "✅ Database restored from orphaned Docker volume!"
          FOUND_VOLUME="${VOL}"
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
  # 每 5 分钟将 db 同步到安全备份位置
  while true; do
    sleep 300
    if [ -f "${DB_FILE}" ]; then
      cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
    fi
  done &
  BACKUP_DAEMON_PID=$!
  echo "   Safe backup daemon: PID ${BACKUP_DAEMON_PID} (every 5min)"
}

# ============================================================
# 第四步：优雅停止时保存
# ============================================================
graceful_shutdown() {
  echo ""
  echo "🛑 Shutting down NOWEN..."
  
  # 同步最新数据到安全备份
  if [ -f "${DB_FILE}" ]; then
    cp "${DB_FILE}" "${SAFE_DB_FILE}" 2>/dev/null
    echo "✅ Final safe backup saved"
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
