FROM docker.m.daocloud.io/library/mongo:4.4

COPY --chmod=644 ./init/*.js /docker-entrypoint-initdb.d/

ENV TZ=Asia/Shanghai
EXPOSE 27017

# 不用 --config 配置文件：docker-entrypoint.sh 解析 --config 时会写
# /tmp/docker-entrypoint-config.json，gosu 切到 mongodb 用户后要覆写它，
# 一旦该文件残留为 root 属主就会 Permission denied，容器陷入崩溃重启循环。
# 改用命令行参数表达全部配置，entrypoint 的 _parse_config 只在有 --config 时才执行。
CMD ["mongod", "--auth", "--bind_ip_all", "--port", "27017", "--dbpath", "/data/db"]
