FROM docker.m.daocloud.io/library/mongo:4.4

COPY --chmod=644 mongod.conf /etc/mongod.conf
COPY --chmod=644 ./init/*.js /docker-entrypoint-initdb.d/

ENV TZ=Asia/Shanghai
EXPOSE 27017
CMD ["mongod", "--config", "/etc/mongod.conf"]
