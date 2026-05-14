/**
 * PostgreSQL 隧道守护进程
 * 
 * 功能：
 *   1. 通过 pinggy.io 创建 TCP 隧道暴露本地 PG
 *   2. 自动更新 Render 后端的数据库连接
 *   3. 隧道断开自动重连
 * 
 * 用法：node scripts/pg-tunnel-daemon.js
 */

const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'https://claw-backend-2026.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'claw-admin-2026';

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function updateBackend(tunnelHost, tunnelPort) {
  const dbUrl = `postgresql://claw_render:ClawRemote2026!@${tunnelHost}:${tunnelPort}/claw?sslmode=disable`;
  const postData = JSON.stringify({ url: dbUrl, secret: ADMIN_SECRET });
  
  const options = {
    hostname: new URL(BACKEND_URL).hostname,
    path: '/api/heartbeat/set-db',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    timeout: 15000,
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        log(`✅ 后端已更新数据库连接: ${tunnelHost}:${tunnelPort} (${res.statusCode})`);
        resolve(true);
      });
    });
    req.on('error', (e) => {
      log(`⚠️ 更新后端失败: ${e.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      log('⚠️ 更新后端超时');
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

function startTunnel() {
  log('🚇 启动 PostgreSQL 隧道...');
  
  const ssh = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ExitOnForwardFailure=yes',
    '-p', '443',
    '-R0:localhost:5432',
    'tcp@a.pinggy.io'
  ]);

  let tunnelUrl = null;

  ssh.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text); // 实时输出
    
    const match = text.match(/tcp:\/\/([^\s]+)/);
    if (match) {
      tunnelUrl = match[1];
      const [host, port] = tunnelUrl.split(':');
      log(`🔗 隧道已建立: ${tunnelUrl}`);
      updateBackend(host, port);
    }
  });

  ssh.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
  });

  ssh.on('close', (code) => {
    log(`⚠️ 隧道断开 (exit ${code}), 5秒后重连...`);
    setTimeout(startTunnel, 5000);
  });

  ssh.on('error', (err) => {
    log(`❌ SSH错误: ${err.message}, 10秒后重连...`);
    setTimeout(startTunnel, 10000);
  });
}

// 启动
log('🚀 PostgreSQL 隧道守护进程启动');
log(`   后端: ${BACKEND_URL}`);
startTunnel();

// 防止进程退出
process.on('SIGINT', () => { log('收到退出信号'); process.exit(0); });
process.on('SIGTERM', () => { log('收到终止信号'); process.exit(0); });
