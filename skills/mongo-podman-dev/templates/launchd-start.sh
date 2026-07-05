#!/bin/zsh

# 确保 podman machine 在运行（已运行则无操作）
{{PODMAN}} machine start 2>/dev/null

# 等待 podman socket 就绪，最多等 30 秒
for i in {1..30}; do
    if {{PODMAN}} info &>/dev/null; then
        break
    fi
    sleep 1
done

# 启动容器
cd {{INSTALL_DIR}} || exit 1
{{PODMAN_COMPOSE}} up -d
