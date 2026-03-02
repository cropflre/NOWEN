#!/bin/sh
echo "=== NOWEN Starting ==="
echo "Architecture: $(uname -m)"
echo "Data directory: /app/server/data"

# 检查数据卷挂载状态
if [ -f /app/server/data/zen-garden.db ]; then
  DB_SIZE=$(ls -lh /app/server/data/zen-garden.db | awk '{print $5}')
  echo "Database found: zen-garden.db (${DB_SIZE})"
  echo "Data persistence: OK"
else
  echo "WARNING: No existing database found - creating new one"
  echo "IMPORTANT: If you lost data after updating, please ensure"
  echo "  the data volume is mounted: /app/server/data"
  echo ""
  echo "  NAS Docker UI: Mount a host path to /app/server/data"
  echo "  Docker CLI:    docker run -v nowen-data:/app/server/data ..."
  echo "  Compose:       volumes: nowen-data:/app/server/data"
fi

echo ""
echo "Starting backend on port 3001..."
cd /app/server && tsx src/index.ts &
sleep 2
echo "Starting nginx on port 3000..."
nginx -g "daemon off;"
