#!/bin/sh
echo "=========================================="
echo "  NOWEN - Starting..."
echo "=========================================="
echo "Architecture: $(uname -m)"
echo "Data directory: /app/server/data"
echo ""

# ============================================================
# 🔑 数据持久化检查与恢复
# ============================================================

DATA_DIR="/app/server/data"
DB_FILE="${DATA_DIR}/zen-garden.db"
BACKUP_DIR="${DATA_DIR}/backups"

# 确保备份目录存在
mkdir -p "${BACKUP_DIR}"

if [ -f "${DB_FILE}" ]; then
  DB_SIZE=$(ls -lh "${DB_FILE}" | awk '{print $5}')
  echo "✅ Database found: zen-garden.db (${DB_SIZE})"
  echo "   Data persistence: OK"
  
  # 启动前自动备份（保留最近 5 个）
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  cp "${DB_FILE}" "${BACKUP_DIR}/zen-garden_${TIMESTAMP}.db.bak"
  echo "   Auto backup: zen-garden_${TIMESTAMP}.db.bak"
  
  # 清理旧备份，只保留最近 5 个
  cd "${BACKUP_DIR}" && ls -1t *.db.bak 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
  cd /app
else
  echo "⚠️  No existing database found!"
  echo ""
  
  # 尝试从备份恢复
  LATEST_BACKUP=$(ls -1t "${BACKUP_DIR}"/*.db.bak 2>/dev/null | head -1)
  if [ -n "${LATEST_BACKUP}" ]; then
    echo "🔄 Found backup: ${LATEST_BACKUP}"
    echo "   Restoring from backup..."
    cp "${LATEST_BACKUP}" "${DB_FILE}"
    if [ -f "${DB_FILE}" ]; then
      echo "✅ Database restored successfully!"
    else
      echo "❌ Restore failed, will create new database"
    fi
  else
    echo "📝 No backups found - creating new database"
    echo ""
    echo "┌─────────────────────────────────────────────┐"
    echo "│  ⚠️  数据持久化提示 / Data Persistence Tip  │"
    echo "├─────────────────────────────────────────────┤"
    echo "│                                             │"
    echo "│  如果更新后数据丢失，请确保挂载数据目录：   │"
    echo "│  If data lost after update, mount the       │"
    echo "│  data volume properly:                      │"
    echo "│                                             │"
    echo "│  NAS Docker UI:                             │"
    echo "│    宿主机路径 → /app/server/data             │"
    echo "│    (如: /volume1/docker/nowen/data)          │"
    echo "│                                             │"
    echo "│  Docker CLI:                                │"
    echo "│    -v /your/path:/app/server/data            │"
    echo "│                                             │"
    echo "│  Docker Compose:                            │"
    echo "│    volumes:                                 │"
    echo "│      - ./nowen-data:/app/server/data        │"
    echo "│                                             │"
    echo "└─────────────────────────────────────────────┘"
  fi
fi

echo ""

# 显示数据目录内容
echo "📁 Data directory contents:"
ls -la "${DATA_DIR}/" 2>/dev/null
echo ""

echo "Starting backend on port 3001..."
cd /app/server && tsx src/index.ts &
sleep 2
echo "Starting nginx on port 3000..."
nginx -g "daemon off;"
