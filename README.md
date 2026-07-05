# mongo-podman-dev

Claude Code skill — 在 macOS ARM64 上通过 Podman Compose 搭建本地 MongoDB 4.4 开发环境，并配置 launchd 开机自启。

## 安装

### 方式一：从 GitHub 安装

```shell
claude mcp skills install qifan/devutils/mongo-podman-dev
```

### 方式二：本地安装

```shell
# 克隆仓库
git clone <repo-url> devutils
cd devutils

# 安装 skill
mkdir -p ~/.claude/skills
cp -r skills/mongo-podman-dev ~/.claude/skills/mongo-podman-dev
```

安装完成后重启 Claude Code 即可生效。

## 使用

在 Claude Code 中，用自然语言触发：

```
搭建 mongo 本地环境
```

或者：

```
帮我用 Podman 起一个本地 MongoDB
```

Skill 会自动执行以下步骤：

1. **环境检查** — 验证 macOS ARM64、podman、podman-compose 是否就绪
2. **选择安装目录** — 默认 `/Users/$USER/devutils/mongo_dev`
3. **写入项目文件** — Dockerfile、compose.yaml、mongod.conf、初始化脚本等
4. **构建并启动** — `podman-compose up -d`
5. **配置开机自启** — 安装 launchd plist
6. **输出连接信息**

## 连接信息

启动完成后，MongoDB 可通过以下方式连接：

```
mongodb://dev:123456@127.0.0.1:27017/dev_db?authSource=dev_db
```

| 用户 | 密码 | 数据库 | 角色 |
|------|------|--------|------|
| `dev` | `123456` | `dev_db` | readWrite |
| `root` | `root123` | `admin` | root |

## 前置条件

- macOS ARM64 (Apple Silicon)
- [Podman](https://podman.io/) + `podman-compose`：
  ```shell
  brew install podman podman-compose
  podman machine init && podman machine start
  ```

## 文件结构

```
skills/mongo-podman-dev/
├── SKILL.md                    # Skill 定义（步骤、检查、提示）
└── templates/
    ├── Dockerfile              # 基于 mongo:4.4，打入配置和初始化脚本
    ├── compose.yaml            # 端口 27017，数据挂载到 ./podman_data/
    ├── mongod.conf             # 开启认证，日志走 stdout
    ├── init-dev.js             # 首次启动创建用户和种子数据
    ├── launchd-start.sh        # 开机自启脚本（先等 podman machine 就绪）
    └── dev.mongo.plist         # launchd 配置
```

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
