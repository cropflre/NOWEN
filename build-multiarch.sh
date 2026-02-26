#!/bin/bash
# NOWEN 多架构 Docker 镜像构建脚本
# 支持: linux/amd64, linux/arm64 (RK3588/RK3576/RK3566 等 ARM64 设备)
#
# 使用方法:
#   ./build-multiarch.sh                    # 构建并推送多架构镜像
#   ./build-multiarch.sh --load             # 仅构建当前架构并加载到本地
#   ./build-multiarch.sh --tag myrepo/nowen # 自定义镜像名
#
# 前置要求:
#   docker buildx create --use --name multiarch --driver docker-container
#   docker buildx inspect --bootstrap

set -e

IMAGE_NAME="${TAG:-cropflre/nowen}"
PLATFORMS="linux/amd64,linux/arm64"

# 解析参数
LOAD_ONLY=false
for arg in "$@"; do
  case $arg in
    --load)
      LOAD_ONLY=true
      ;;
    --tag)
      shift
      IMAGE_NAME="$1"
      ;;
  esac
done

echo "========================================"
echo "  NOWEN Multi-Architecture Build"
echo "========================================"
echo "Image:     ${IMAGE_NAME}"
echo "Platforms: ${PLATFORMS}"
echo ""

# 确保 buildx builder 存在
if ! docker buildx inspect multiarch > /dev/null 2>&1; then
  echo "Creating buildx builder 'multiarch'..."
  docker buildx create --use --name multiarch --driver docker-container
  docker buildx inspect --bootstrap
else
  docker buildx use multiarch
fi

if [ "$LOAD_ONLY" = true ]; then
  echo "Building for current platform only (--load)..."
  docker buildx build \
    --load \
    -t "${IMAGE_NAME}:latest" \
    .
else
  echo "Building and pushing multi-arch image..."
  docker buildx build \
    --platform "${PLATFORMS}" \
    -t "${IMAGE_NAME}:latest" \
    --push \
    .
fi

echo ""
echo "Done!"
