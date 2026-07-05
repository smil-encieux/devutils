# mongo-podman-dev

macOS ARM64 本地 MongoDB 4.4 开发环境，基于 Podman Compose，支持 launchd 开机自启。

同时是一个 Claude Code [skill](.claude/skills/mongo-podman-dev/SKILL.md)——在 Claude Code 中提及 "搭建 mongo 本地环境" 即可自动触发。

## 前置条件

- macOS ARM64 (Apple Silicon)
- [Podman](https://podman.io/) + `podman-compose`：`brew install podman podman-compose`
- Podman machine 已初始化：`podman machine init && podman machine start`

## 快速开始

```shell
# 克隆仓库
git clone <repo-url> mongo-dev && cd mongo-dev

# 启动
podman-compose up -d

# 验证
podman ps --filter name=local-mongo-dev
```

连接信息：

```
mongodb://dev:123456@127.0.0.1:27017/dev_db?authSource=dev_db
```

| 用户 | 密码 | 数据库 | 角色 |
|------|------|--------|------|
| `dev` | `123456` | `dev_db` | readWrite |
| `root` | `root123` | `admin` | root |

## 文件结构

```
├── Dockerfile              # 基于 mongo:4.4，打入配置和初始化脚本
├── compose.yaml            # 端口 27017，数据挂载到 ./podman_data/
├── mongod.conf             # 开启认证，日志走 stdout
├── init/init_dev.js        # 首次启动创建用户和种子数据
├── launchd-start.sh        # 开机自启脚本（先等 podman machine 就绪）
├── dev.mongo.plist         # launchd 配置
└── .claude/skills/         # Claude Code skill（AI 辅助搭建）
```

## 开机自启

```shell
# 安装
cp dev.mongo.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/dev.mongo.plist

# 验证
launchctl list | grep dev.mongo

# 卸载
launchctl unload ~/Library/LaunchAgents/dev.mongo.plist
```

自启脚本 `launchd-start.sh` 会先执行 `podman machine start`（幂等，已运行则跳过），等待 socket 就绪后再拉起容器。

## 踩坑记录

### COPY 文件权限

Docker `COPY` 默认权限 `600`，容器内 mongodb 用户无法读取。解决：`COPY --chmod=644`。

### systemLog.destination 不支持 console

MongoDB 4.4 只接受 `file` / `syslog`。想输出到 stdout 直接省略 `systemLog` 配置段即可（默认行为）。

### launchd PATH 问题

launchd 不 source shell profile，`PATH` 不含 `/opt/homebrew/bin`，导致 `podman-compose` 内部找不到 `podman`。解决：在 plist 中显式设置 `EnvironmentVariables.PATH`。

### launchd 启动时机

`RunAtLoad` 在登录时触发，此时 podman machine 未必就绪。解决：`launchd-start.sh` 中先 `podman machine start` + 轮询 `podman info`，最多等 30 秒。

### chown /proc 警告

`chown: changing ownership of '/proc/1/fd/1': Permission denied` 是 Podman on macOS 的已知无害警告，忽略即可。

### Volume 日志目录权限

macOS 文件系统通过 Podman VM 共享给容器，容器内 mongodb 用户 (UID 999) 无法写入。两种解法：`chmod 777` 目录，或不用文件日志走 stdout（本项目采用后者）。
