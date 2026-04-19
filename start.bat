@echo off
set DATABASE_URL=postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db
set NODE_ENV=production
set PORT=8089

echo 启动Claw后端服务器...
echo 数据库URL: %DATABASE_URL%
echo 端口: %PORT%

node src/index.db.js