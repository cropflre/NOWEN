#!/usr/bin/env bash
# =============================================================================
# nowen 发布脚本（纯交互式 · 仅 Docker：amd64 / arm64 / multi）
#
# 直接运行：  ./release.sh
# 不需要任何命令行参数，所有选项通过菜单交互选择。
#
# 流程：
#   1. 选模式：发布模式 / 仅本地构建
#   2. 选架构：amd64 / arm64 / multi
#   3. [发布模式] 自动聚合本地+GitHub+DockerHub 历史版本，建议下一版本号
#   4. [构建模式] 选输出方式：load 到本机 / 导出 tar / push 到自定义 registry
#   5. 显示摘要 → 确认 → 开始构建/推送
# =============================================================================

set -euo pipefail

# -------------------- 配置 --------------------
DEFAULT_IMAGE_NAME="cropflre/nowen"
DEFAULT_BRANCH="main"
GITHUB_REPO_URL="https://github.com/cropflre/NOWEN"
GITHUB_REPO_SLUG="cropflre/NOWEN"
BUILDX_BUILDER="nowen-builder"
DEFAULT_TAR_OUT="nowen-arm64.tar"

# -------------------- 彩色输出 --------------------
if [ -t 1 ] && command -v tput >/dev/null 2>&1 && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
    C_RED="$(tput setaf 1)"
    C_GREEN="$(tput setaf 2)"
    C_YELLOW="$(tput setaf 3)"
    C_BLUE="$(tput setaf 4)"
    C_CYAN="$(tput setaf 6)"
    C_BOLD="$(tput bold)"
    C_RESET="$(tput sgr0)"
else
    C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_CYAN=""; C_BOLD=""; C_RESET=""
fi

info()  { echo "${C_BLUE}[*]${C_RESET} $*"; }
ok()    { echo "${C_GREEN}[✓]${C_RESET} $*"; }
warn()  { echo "${C_YELLOW}[!]${C_RESET} $*" >&2; }
die()   { echo "${C_RED}[✗]${C_RESET} $*" >&2; exit 1; }
step()  { echo; echo "${C_BOLD}${C_CYAN}==== $* ====${C_RESET}"; }

# -------------------- 交互辅助 --------------------
# 必须接到 TTY，否则交互无意义
if [ ! -t 0 ]; then
    die "本脚本为交互式，请在终端中直接运行（不要用管道或 < 重定向输入）"
fi

# 选项菜单：ask_choice "提示语" 默认序号 选项1 选项2 ...
# 返回选中的序号到全局变量 CHOICE_IDX（从 1 开始）
ask_choice() {
    local title="$1"; shift
    local default_idx="$1"; shift
    local opts=( "$@" )
    local n=${#opts[@]}
    local i
    echo
    echo "${C_BOLD}${title}${C_RESET}"
    for ((i=0; i<n; i++)); do
        printf "  %d) %s\n" "$((i+1))" "${opts[i]}"
    done
    while :; do
        read -r -p "请输入 [1-${n}]（默认 ${default_idx}）: " _c
        _c="${_c:-$default_idx}"
        if echo "$_c" | grep -Eq '^[0-9]+$' && [ "$_c" -ge 1 ] && [ "$_c" -le "$n" ]; then
            CHOICE_IDX="$_c"
            return
        fi
        warn "无效输入：$_c"
    done
}

# 是否确认：ask_yes_no "提示" 默认(y/n)
# 返回值：0=yes 1=no
ask_yes_no() {
    local prompt="$1" def="${2:-n}" hint
    if [ "$def" = "y" ]; then hint="[Y/n]"; else hint="[y/N]"; fi
    local ans
    read -r -p "${prompt} ${hint} " ans
    ans="${ans:-$def}"
    case "$ans" in
        [yY]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
}

# 输入字符串：ask_input "提示" 默认值
# 结果赋给全局变量 INPUT_VAL
ask_input() {
    local prompt="$1" def="${2:-}" ans
    if [ -n "$def" ]; then
        read -r -p "${prompt}（默认 ${def}）: " ans
        INPUT_VAL="${ans:-$def}"
    else
        read -r -p "${prompt}: " ans
        INPUT_VAL="$ans"
    fi
}

run() {
    eval "$@"
}
run_argv() {
    "$@"
}

# -------------------- 前置检查 --------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/Dockerfile" ]; then
    REPO_ROOT="$SCRIPT_DIR"
else
    REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$REPO_ROOT"

clear 2>/dev/null || true
echo "${C_BOLD}${C_CYAN}"
echo "============================================================"
echo "         NOWEN  Docker 发布脚本（交互式）"
echo "============================================================"
echo "${C_RESET}"
info "工作目录：$REPO_ROOT"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "当前目录不是 git 仓库"
command -v docker >/dev/null 2>&1 || die "未安装 docker"
docker info >/dev/null 2>&1 || die "docker daemon 不可用（请启动 docker）"
[ -f "$REPO_ROOT/Dockerfile" ] || die "仓库根目录未找到 Dockerfile"

# -------------------- 第一步：选运行模式 --------------------
ask_choice "请选择运行模式：" 1 \
    "发布模式  （打 tag → push 到 Docker Hub → 同步 git tag 到 GitHub）" \
    "构建模式  （仅本地构建，不动 git，不推 Docker Hub）"
case "$CHOICE_IDX" in
    1) BUILD_ONLY=0 ;;
    2) BUILD_ONLY=1 ;;
esac

# -------------------- 第二步：选架构 --------------------
ask_choice "请选择构建架构：" 1 \
    "amd64   原生 docker build，最快（适合 x86 服务器/NAS）" \
    "arm64   buildx + QEMU 模拟（适合 ARM 板子 / 树莓派 / Apple Silicon）" \
    "multi   amd64 + arm64 一次出多架构 manifest（必须推送到 registry）"
case "$CHOICE_IDX" in
    1) ARCH="amd64" ;;
    2) ARCH="arm64" ;;
    3) ARCH="multi" ;;
esac

if [ "$ARCH" != "amd64" ]; then
    docker buildx version >/dev/null 2>&1 \
        || die "未检测到 docker buildx；arm64 / multi 模式必须使用 buildx"
fi

# -------------------- 默认值 --------------------
DO_PULL=1
DO_LATEST=1
DO_GIT_TAG=1
VERSION=""
CUSTOM_IMAGE=""
DO_TAR=0
TAR_OUT="$DEFAULT_TAR_OUT"
DO_PUSH_CUSTOM=0

# -------------------- 第三步（构建模式）：选输出方式 --------------------
if [ "$BUILD_ONLY" = "1" ]; then
    if [ "$ARCH" = "multi" ]; then
        # multi 必须 push
        warn "multi 架构必须推送到 registry，自动启用 push 模式"
        DO_PUSH_CUSTOM=1
        ask_input "请输入目标镜像名（含 registry/tag，例如 registry.example.com/nowen:multi）" \
            "${DEFAULT_IMAGE_NAME}:multi"
        CUSTOM_IMAGE="$INPUT_VAL"
    else
        if [ "$ARCH" = "arm64" ]; then
            ask_choice "请选择构建产物输出方式：" 1 \
                "load   加载到本机 docker（默认，可以直接 docker run）" \
                "tar    导出为 .tar 文件，方便 scp 到 ARM 板子离线 docker load" \
                "push   推送到自定义 registry"
        else
            ask_choice "请选择构建产物输出方式：" 1 \
                "load   加载到本机 docker（默认，可以直接 docker run）" \
                "push   推送到自定义 registry"
        fi
        case "$ARCH-$CHOICE_IDX" in
            arm64-1) ;; # load
            arm64-2) DO_TAR=1 ;;
            arm64-3) DO_PUSH_CUSTOM=1 ;;
            amd64-1) ;; # load
            amd64-2) DO_PUSH_CUSTOM=1 ;;
        esac

        if [ "$DO_TAR" = "1" ]; then
            ask_input "tar 输出路径" "$DEFAULT_TAR_OUT"
            TAR_OUT="$INPUT_VAL"
            ask_input "镜像名（仅作为 tar 内 image tag）" "${DEFAULT_IMAGE_NAME}:${ARCH}"
            CUSTOM_IMAGE="$INPUT_VAL"
        elif [ "$DO_PUSH_CUSTOM" = "1" ]; then
            ask_input "目标镜像名（含 registry/tag，例如 registry.example.com/nowen:${ARCH}）" \
                "${DEFAULT_IMAGE_NAME}:${ARCH}"
            CUSTOM_IMAGE="$INPUT_VAL"
        else
            ask_input "镜像名（加载到本机 docker 的 tag）" "${DEFAULT_IMAGE_NAME}:${ARCH}"
            CUSTOM_IMAGE="$INPUT_VAL"
        fi
    fi
fi

# -------------------- 第三步（发布模式）：git 同步 + 版本号 --------------------
if [ "$BUILD_ONLY" != "1" ]; then
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    info "当前分支：$CURRENT_BRANCH"
    if [ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ]; then
        warn "当前不在 $DEFAULT_BRANCH 分支"
        ask_yes_no "确定继续？" "n" || die "已取消"
    fi

    # 工作区脏检查
    if ! git diff-index --quiet HEAD -- || ! git diff --cached --quiet; then
        warn "工作区有未提交的改动，将自动清理（git checkout -- . && git clean -fd）"
        git status --short | head -20
        if ask_yes_no "确认清理？" "y"; then
            git checkout -- .
            git clean -fd
            git reset HEAD -- . >/dev/null 2>&1 || true
            ok "工作区已自动恢复干净"
        else
            die "已取消"
        fi
    fi

    # ----- git pull 选择 -----
    ask_choice "是否执行 git pull 同步远端？" 1 \
        "执行 git pull（推荐）" \
        "跳过 git pull"
    [ "$CHOICE_IDX" = "2" ] && DO_PULL=0

    if [ "$DO_PULL" = "1" ]; then
        info "git fetch origin $CURRENT_BRANCH ..."
        git fetch origin "$CURRENT_BRANCH"

        _LR="$(git rev-list --left-right --count "HEAD...origin/$CURRENT_BRANCH" 2>/dev/null || echo "0	0")"
        _AHEAD="$(echo "$_LR" | awk '{print $1}')"
        _BEHIND="$(echo "$_LR" | awk '{print $2}')"
        info "本地相对 origin/$CURRENT_BRANCH：ahead=${_AHEAD}, behind=${_BEHIND}"

        if [ "$_AHEAD" = "0" ] && [ "$_BEHIND" = "0" ]; then
            ok "代码已是最新：$(git log -1 --pretty=format:'%h  %s')"
        elif [ "$_AHEAD" = "0" ] && [ "$_BEHIND" != "0" ]; then
            info "本地落后 ${_BEHIND} 个 commit，执行 fast-forward ..."
            git merge --ff-only "origin/$CURRENT_BRANCH"
            ok "已快进到：$(git log -1 --pretty=format:'%h  %s')"
        elif [ "$_AHEAD" != "0" ] && [ "$_BEHIND" = "0" ]; then
            warn "本地领先 ${_AHEAD} 个 commit，远端无新提交（这些 commit 会在发布时一并推送）"
        else
            warn "本地与远端 diverged：本地领先 ${_AHEAD}，远端领先 ${_BEHIND}"
            ask_choice "请选择处理方式：" 1 \
                "rebase  把本地 commit 重放到远端最新（推荐）" \
                "merge   生成一个 merge commit" \
                "abort   终止"
            case "$CHOICE_IDX" in
                1)
                    if ! git rebase "origin/$CURRENT_BRANCH"; then
                        git rebase --abort >/dev/null 2>&1 || true
                        die "rebase 出现冲突，已自动 abort。请手动解决后重跑。"
                    fi ;;
                2)
                    if ! git merge --no-ff --no-edit "origin/$CURRENT_BRANCH"; then
                        git merge --abort >/dev/null 2>&1 || true
                        die "merge 出现冲突，已自动 abort。请手动解决后重跑。"
                    fi ;;
                3) die "用户选择 abort，已取消" ;;
            esac
            ok "同步完成：$(git log -1 --pretty=format:'%h  %s')"
        fi
    else
        info "已跳过 git pull"
    fi
fi

# -------------------- 版本号 / 镜像名确定 --------------------
GIT_COMMIT="$(git log -1 --pretty=format:'%h  %s')"
GIT_SHA="$(git rev-parse HEAD)"
BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

if [ "$BUILD_ONLY" = "1" ]; then
    FULL_IMAGE="$CUSTOM_IMAGE"
    VERSION_TAG=""
    IMAGE_NAME=""
else
    IMAGE_NAME="$DEFAULT_IMAGE_NAME"

    normalize_tags() {
        grep -Eo '^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' \
            | sed 's/^v//'
    }
    collect_local_tags() {
        git tag --list 'v[0-9]*.[0-9]*.[0-9]*' 2>/dev/null | normalize_tags || true
    }
    collect_github_tags() {
        timeout 5 git ls-remote --tags --refs origin 2>/dev/null \
            | awk '{print $2}' | sed 's#^refs/tags/##' | normalize_tags || true
    }
    collect_dockerhub_tags() {
        command -v curl >/dev/null 2>&1 || return 0
        local ns="${IMAGE_NAME%%/*}" repo="${IMAGE_NAME##*/}"
        local url="https://hub.docker.com/v2/repositories/${ns}/${repo}/tags/?page_size=100"
        local page=1
        while [ -n "$url" ] && [ "$page" -le 5 ]; do
            local body
            body="$(curl -fsSL --max-time 5 "$url" 2>/dev/null)" || return 0
            echo "$body" \
                | grep -Eo '"name"[[:space:]]*:[[:space:]]*"[^"]+"' \
                | sed -E 's/.*"([^"]+)"$/\1/' \
                | normalize_tags
            url="$(echo "$body" | grep -Eo '"next"[[:space:]]*:[[:space:]]*"[^"]+"' \
                    | sed -E 's/.*"([^"]+)"$/\1/' | head -1)"
            page=$((page + 1))
        done
    }

    suggest_next_version() {
        local all latest
        all="$( { collect_local_tags; collect_github_tags; collect_dockerhub_tags; } | sort -u )"
        latest="$(echo "$all" | { grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' || true; } | sort -V | tail -1)"
        if [ -z "$latest" ]; then
            echo "0.1.0"
            return
        fi
        local major minor patch
        IFS='.' read -r major minor patch <<EOF
$latest
EOF
        patch=$((patch + 1))
        echo "${major}.${minor}.${patch}"
    }

    version_exists_anywhere() {
        local v="$1"
        { collect_local_tags; collect_github_tags; collect_dockerhub_tags; } \
            | sort -u | grep -Fxq "$v"
    }

    validate_version() {
        echo "$1" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'
    }

    info "聚合历史版本（本地 tag / GitHub / Docker Hub）..."
    SUGGEST="$(suggest_next_version)"
    _LOCAL_MAX="$(collect_local_tags    | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)"
    _GH_MAX="$(   collect_github_tags   | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)"
    _DH_MAX="$(   collect_dockerhub_tags| grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)"
    info "  本地 tag 最新   : ${_LOCAL_MAX:-(无)}"
    info "  GitHub 最新    : ${_GH_MAX:-(无/不可达)}"
    info "  Docker Hub 最新 : ${_DH_MAX:-(无/不可达)}"
    info "  建议下一版本    : ${C_GREEN}${SUGGEST}${C_RESET}"

    while :; do
        echo
        echo "${C_BOLD}请输入本次发布版本号${C_RESET}（格式：1.2.3 或 v1.2.3，可带 -rc.1 等后缀）"
        ask_input "版本号" "$SUGGEST"
        VERSION="${INPUT_VAL#v}"
        if ! validate_version "$VERSION"; then
            warn "版本号格式非法：$VERSION（期望 X.Y.Z 或 X.Y.Z-rc.N）"
            continue
        fi
        VERSION_TAG="v${VERSION}"
        if git rev-parse "refs/tags/${VERSION_TAG}" >/dev/null 2>&1; then
            warn "git tag ${VERSION_TAG} 已存在（本地）"
            continue
        fi
        if version_exists_anywhere "$VERSION"; then
            warn "版本 ${VERSION_TAG} 在 本地 / GitHub / Docker Hub 中已存在，拒绝覆盖"
            continue
        fi
        break
    done

    # latest tag
    ask_choice "是否同时打 :latest 标签并推送？" 1 \
        "是（推荐，正式版本）" \
        "否（如预发布版本：rc / beta / alpha）"
    [ "$CHOICE_IDX" = "2" ] && DO_LATEST=0

    # git tag
    ask_choice "是否同步打 git tag 并推送到 GitHub？" 1 \
        "是（推荐）" \
        "否（仅推 Docker Hub）"
    [ "$CHOICE_IDX" = "2" ] && DO_GIT_TAG=0
fi

# -------------------- 同步 package.json 的 version --------------------
sync_root_pkg_version() {
    local target_version="$1"
    local pkg_file="${REPO_ROOT}/package.json"
    [ -f "$pkg_file" ] || return 0

    local current
    current="$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' "$pkg_file" | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
    if [ "$current" = "$target_version" ]; then
        info "package.json version 已是 ${target_version}，无需改写"
        return 0
    fi

    info "更新 package.json version: ${current:-(空)} -> ${target_version}"
    if sed --version >/dev/null 2>&1; then
        sed -i -E "0,/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]+\"/s//\"version\": \"${target_version}\"/" "$pkg_file"
    else
        sed -i '' -E "1,/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]+\"/s//\"version\": \"${target_version}\"/" "$pkg_file"
    fi
}

if [ "$BUILD_ONLY" != "1" ]; then
    sync_root_pkg_version "$VERSION"
fi

# -------------------- 摘要 + 最终确认 --------------------
case "$ARCH" in
    amd64) PLATFORM_DESC="linux/amd64（原生 docker build）" ;;
    arm64) PLATFORM_DESC="linux/arm64（buildx，QEMU 模拟）" ;;
    multi) PLATFORM_DESC="linux/amd64,linux/arm64（buildx --push，多架构 manifest）" ;;
esac

if [ "$BUILD_ONLY" = "1" ]; then
    step "构建摘要"
    echo "  目标镜像      : ${FULL_IMAGE}"
    echo "  构建架构      : ${PLATFORM_DESC}"
    if [ "$DO_TAR" = "1" ]; then
        echo "  输出方式      : 导出 tar → ${TAR_OUT}"
    elif [ "$DO_PUSH_CUSTOM" = "1" ]; then
        echo "  输出方式      : --push（推送到 ${FULL_IMAGE%:*}）"
    else
        echo "  输出方式      : --load（加载到本机 docker）"
    fi
    echo "  git commit    : ${GIT_COMMIT}"
    echo "  构建时间      : ${BUILD_DATE}"
else
    step "发布摘要"
    echo "  版本 tag      : ${VERSION_TAG}"
    echo "  Docker 仓库   : ${IMAGE_NAME}"
    echo "  Docker 架构   : ${PLATFORM_DESC}"
    echo "  Docker latest : $([ "$DO_LATEST" = "1" ] && echo yes || echo no)"
    echo "  同步 git tag  : $([ "$DO_GIT_TAG" = "1" ] && echo yes || echo no)"
    echo "  git commit    : ${GIT_COMMIT}"
    echo "  构建时间      : ${BUILD_DATE}"
    if [ "$ARCH" = "multi" ]; then
        echo "  ${C_YELLOW}注意          : multi 模式会直接 push 多架构 manifest 到 Docker Hub${C_RESET}"
    fi
fi

echo
ask_yes_no "确认开始执行？" "y" || die "已取消"

# -------------------- 构建 tags 与 labels --------------------
START_TS=$(date +%s)

BUILD_TAGS=()
if [ "$BUILD_ONLY" = "1" ]; then
    BUILD_TAGS=( -t "${FULL_IMAGE}" )
else
    BUILD_TAGS=( -t "${IMAGE_NAME}:${VERSION_TAG}" )
    [ "$DO_LATEST" = "1" ] && BUILD_TAGS+=( -t "${IMAGE_NAME}:latest" )
fi

OCI_LABELS=(
    --label "org.opencontainers.image.revision=${GIT_SHA}"
    --label "org.opencontainers.image.created=${BUILD_DATE}"
    --label "org.opencontainers.image.source=${GITHUB_REPO_URL}"
    --label "org.opencontainers.image.title=nowen"
)
[ -n "${VERSION_TAG:-}" ] && OCI_LABELS+=( --label "org.opencontainers.image.version=${VERSION_TAG}" )

ensure_buildx_builder() {
    if ! docker buildx inspect "$BUILDX_BUILDER" >/dev/null 2>&1; then
        info "创建 buildx builder: $BUILDX_BUILDER"
        docker buildx create --name "$BUILDX_BUILDER" --use
    else
        docker buildx use "$BUILDX_BUILDER"
    fi
    docker buildx inspect --bootstrap
}

step "开始构建 Docker 镜像"
BUILD_START=$(date +%s)

# 计算 buildx 输出模式
BUILDX_OUTPUT=()
if [ "$BUILD_ONLY" = "1" ]; then
    if [ "$DO_TAR" = "1" ]; then
        BUILDX_OUTPUT=( --output "type=docker,dest=${TAR_OUT}" )
    elif [ "$DO_PUSH_CUSTOM" = "1" ]; then
        BUILDX_OUTPUT=( --push )
    else
        BUILDX_OUTPUT=( --load )
    fi
else
    if [ "$ARCH" = "multi" ]; then
        BUILDX_OUTPUT=( --push )
    else
        BUILDX_OUTPUT=( --load )
    fi
fi

case "$ARCH" in
    amd64)
        if [ "$BUILD_ONLY" = "1" ] && [ "$DO_PUSH_CUSTOM" = "1" ]; then
            # 自定义 registry push：用 buildx 直接 --push
            ensure_buildx_builder
            BUILD_CMD=(
                docker buildx build
                --platform linux/amd64
                -f "$REPO_ROOT/Dockerfile"
                "${BUILD_TAGS[@]}"
                "${OCI_LABELS[@]}"
                --push
                "$REPO_ROOT"
            )
        else
            BUILD_CMD=( docker build -f "$REPO_ROOT/Dockerfile" "${BUILD_TAGS[@]}" "${OCI_LABELS[@]}" "$REPO_ROOT" )
        fi
        echo "  ${BUILD_CMD[*]}"
        "${BUILD_CMD[@]}"
        ;;
    arm64)
        ensure_buildx_builder
        BUILD_CMD=(
            docker buildx build
            --platform linux/arm64
            -f "$REPO_ROOT/Dockerfile"
            "${BUILD_TAGS[@]}"
            "${OCI_LABELS[@]}"
            "${BUILDX_OUTPUT[@]}"
            "$REPO_ROOT"
        )
        echo "  ${BUILD_CMD[*]}"
        "${BUILD_CMD[@]}"
        ;;
    multi)
        ensure_buildx_builder
        BUILD_CMD=(
            docker buildx build
            --platform linux/amd64,linux/arm64
            -f "$REPO_ROOT/Dockerfile"
            "${BUILD_TAGS[@]}"
            "${OCI_LABELS[@]}"
            "${BUILDX_OUTPUT[@]}"
            "$REPO_ROOT"
        )
        echo "  ${BUILD_CMD[*]}"
        "${BUILD_CMD[@]}"
        ;;
esac

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
ok "Docker 构建完成，用时 ${BUILD_DURATION}s"

# -------------------- 构建模式：到此结束 --------------------
if [ "$BUILD_ONLY" = "1" ]; then
    END_TS=$(date +%s)
    TOTAL=$((END_TS - START_TS))

    step "构建完成"
    if [ "$DO_TAR" = "1" ]; then
        echo "  ${C_GREEN}${TAR_OUT}${C_RESET}  ←  已写入"
        echo
        echo "在板子上离线加载："
        printf "    docker load -i %s\n" "$TAR_OUT"
        printf "    docker run --platform linux/arm64 -p 80:80 %s\n" "$FULL_IMAGE"
    elif [ "$DO_PUSH_CUSTOM" = "1" ]; then
        echo "  ${C_GREEN}${FULL_IMAGE}${C_RESET}  ←  已推送"
        echo
        echo "在板子 / 服务器上："
        printf "    docker pull %s\n" "$FULL_IMAGE"
    else
        echo "  ${C_GREEN}${FULL_IMAGE}${C_RESET}  ←  已加载到本机 docker"
        echo
        echo "本机测试："
        if [ "$ARCH" = "arm64" ]; then
            printf "    docker run --platform linux/arm64 -p 80:80 %s\n" "$FULL_IMAGE"
        else
            printf "    docker run -p 80:80 %s\n" "$FULL_IMAGE"
        fi
    fi
    echo "  构建架构      : ${PLATFORM_DESC}"
    echo "  总耗时        : ${TOTAL}s"
    echo
    ok "完成"
    exit 0
fi

# -------------------- 发布模式：docker push --------------------
PUSH_DURATION=0
if [ "$ARCH" = "multi" ]; then
    info "multi 模式 buildx 已经把镜像直接推送到 Docker Hub，跳过单独 push 步骤"
else
    step "推送镜像"
    PUSH_START=$(date +%s)
    info "推送：${IMAGE_NAME}:${VERSION_TAG}"
    docker push "${IMAGE_NAME}:${VERSION_TAG}"

    if [ "$DO_LATEST" = "1" ]; then
        info "推送：${IMAGE_NAME}:latest"
        docker push "${IMAGE_NAME}:latest"
    fi
    PUSH_END=$(date +%s)
    PUSH_DURATION=$((PUSH_END - PUSH_START))
fi

# 取 digest（multi 模式本地没镜像，拿不到）
DIGEST=""
if [ "$ARCH" != "multi" ]; then
    DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' "${IMAGE_NAME}:${VERSION_TAG}" 2>/dev/null || echo "")"
fi

# -------------------- git tag --------------------
if [ "$DO_GIT_TAG" = "1" ]; then
    step "打 git tag 并推送到 GitHub"

    if [ -n "$(git status --porcelain -- package.json 2>/dev/null)" ]; then
        info "package.json 有变更，先 commit"
        git add package.json
        git commit -m "chore(release): ${VERSION_TAG}"
    fi

    if git rev-parse -q --verify "refs/tags/${VERSION_TAG}" >/dev/null 2>&1; then
        info "本地 tag ${VERSION_TAG} 已存在，跳过创建"
    else
        info "git tag -a ${VERSION_TAG} -m 'Release ${VERSION_TAG}'"
        git tag -a "${VERSION_TAG}" -m "Release ${VERSION_TAG}"
    fi
    info "git push origin HEAD && git push origin ${VERSION_TAG}"
    if git push origin HEAD && git push origin "${VERSION_TAG}"; then
        ok "git commit + tag ${VERSION_TAG} 已推送"
    else
        echo
        echo "${C_YELLOW}[!] git push tag 失败（Docker 镜像已推送，本地 tag 已保留）${C_RESET}"
        echo "    常见原因：GitHub 已禁用密码认证，需使用 PAT 或 SSH key"
        echo "    修复后补推：git push origin ${VERSION_TAG}"
        die "git tag 推送失败"
    fi
else
    info "已跳过 git tag"
fi

# -------------------- 完成 --------------------
END_TS=$(date +%s)
TOTAL=$((END_TS - START_TS))

step "发布完成"
echo "  ${C_GREEN}${IMAGE_NAME}:${VERSION_TAG}${C_RESET}  ←  已推送到 Docker Hub"
[ "$DO_LATEST" = "1" ] && echo "  ${C_GREEN}${IMAGE_NAME}:latest${C_RESET}  ←  已推送到 Docker Hub"
[ "$DO_GIT_TAG" = "1" ] && echo "  ${C_GREEN}git tag ${VERSION_TAG}${C_RESET}  ←  已推送到 GitHub"

echo "  总耗时        : ${TOTAL}s  (docker:${BUILD_DURATION}s push:${PUSH_DURATION}s)"
[ -n "$DIGEST" ] && echo "  docker digest : ${DIGEST}"

echo
ok "发布成功 🎉"
echo
echo "Docker 拉取命令："
printf "    docker pull %s:%s\n" "$IMAGE_NAME" "$VERSION_TAG"
[ "$DO_LATEST" = "1" ] && printf "    docker pull %s:latest\n" "$IMAGE_NAME"
