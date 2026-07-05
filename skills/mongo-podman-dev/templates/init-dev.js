// 1. 切换到 admin 数据库
db = db.getSiblingDB("admin");

// 2. 创建 root 超级用户
db.createUser({
  user: "root",
  pwd: "root123",
  roles: ["root"],
});

// 3. 切换到 dev_db 数据库
db = db.getSiblingDB("dev_db");

// 4. 创建 dev 用户，赋予 dev_db 的读写权限
db.createUser({
  user: "dev",
  pwd: "123456",
  roles: [
    {
      role: "readWrite",
      db: "dev_db",
    },
  ],
});

// 5. 插入一条测试数据（种子数据）
db.user.insertOne({
  name: "test",
  createTime: new Date(),
});
