---
name: mongo-podman-dev
description: Set up a local MongoDB 4.4 dev environment with Podman Compose on macOS ARM64 and launchd auto-start on boot. Use when the user wants a local mongo container, MongoDB dev environment with Podman, podman-compose for MongoDB, or auto-start a local database container on macOS.
---

# mongo-podman-dev

Set up a local MongoDB 4.4 container via Podman Compose on macOS ARM64, with launchd auto-start on boot.

## Steps

### 1. Verify environment

Check three conditions:

| Check | Command | Fail action |
|-------|---------|-------------|
| macOS ARM64 | `uname -m` = `arm64` | Stop — this skill is ARM64-only |
| podman | `podman --version` | Tell user: `brew install podman`, then `podman machine init && podman machine start` |
| podman-compose | `podman-compose --version` | Tell user: `brew install podman-compose` |

Also ensure the podman machine is running: `podman machine start` (no-op if already up).

Detect podman binary paths with `which podman` and `which podman-compose`. Store as `$PODMAN` and `$PODMAN_COMPOSE` for template substitution in step 3.

**Completion**: all three checks pass, podman machine is running, binary paths captured.

### 2. Determine install directory

Ask: "Where should the project files go?"

Default: `/Users/$USER/devutils/mongo_dev`. Use the default unless the user picks a different path.

Store as `$INSTALL_DIR`.

**Completion**: `$INSTALL_DIR` confirmed by user.

### 3. Write project files

Create `$INSTALL_DIR/init/`. Then, for each template in `templates/`, substitute placeholders and write:

| Template | Destination | Substitutions |
|----------|-------------|---------------|
| `Dockerfile` | `$INSTALL_DIR/Dockerfile` | none |
| `compose.yaml` | `$INSTALL_DIR/compose.yaml` | none |
| `init-dev.js` | `$INSTALL_DIR/init/init_dev.js` | none |
| `launchd-start.sh` | `$INSTALL_DIR/launchd-start.sh` | `{{INSTALL_DIR}}`, `{{PODMAN}}`, `{{PODMAN_COMPOSE}}` |
| `dev.mongo.plist` | `$INSTALL_DIR/dev.mongo.plist` | `{{INSTALL_DIR}}` |

After writing, `chmod +x $INSTALL_DIR/launchd-start.sh`.

**Completion**: all 5 files written with correct paths, `launchd-start.sh` is executable.

### 4. Build and start

```shell
cd $INSTALL_DIR && podman-compose up -d
```

Verify with a real authenticated query — do NOT rely on `podman ps` showing `Up`: a crash-looping container flaps through `Up` states between restarts, and its logs can look benign in the tail. Retry up to 30 times, 2s apart:

```shell
for i in {1..30}; do
  podman exec local-mongo-dev mongo --quiet -u dev -p 123456 \
    --authenticationDatabase dev_db \
    --eval 'quit(db.runCommand({ping:1}).ok === 1 ? 0 : 1)' 2>/dev/null && break
  sleep 2
done
```

After the ping succeeds, confirm stability: `podman logs --tail 5 local-mongo-dev` shows `Waiting for connections`, and `podman inspect local-mongo-dev --format '{{.RestartCount}}'` is not growing. The compose file's healthcheck also turns `podman ps` status into `(healthy)` once the first check passes.

If it fails, check logs: `podman logs local-mongo-dev`.

**Completion**: authenticated ping succeeds, logs show `Waiting for connections`, restart count stable.

### 5. Install launchd auto-start

```shell
cp $INSTALL_DIR/dev.mongo.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/dev.mongo.plist
```

Verify: `launchctl list | grep dev.mongo` shows the job (exit code may be non-zero if not explicitly started — that's fine, it loads at boot).

**Completion**: plist copied and loaded, job visible in `launchctl list`.

### 6. Confirm and print info

Run `podman ps --filter name=local-mongo-dev` one final time and print:

```
MongoDB 4.4 dev environment ready.

  Connection: mongodb://dev:123456@127.0.0.1:27017/dev_db?authSource=dev_db
  Root:       root / root123 (admin database)

  Auto-start: enabled (launchd, runs at login)
  Data:       $INSTALL_DIR/podman_data/mongo_dev/
  Logs:       podman logs local-mongo-dev

Commands:
  podman-compose down                     stop container
  launchctl unload ~/Library/LaunchAgents/dev.mongo.plist   disable auto-start
```
