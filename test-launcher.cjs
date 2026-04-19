const { spawn } = require('child_process');
const http = require('http');

// 启动launcher
const child = spawn('node', ['local-browser-launcher.js'], {
  cwd: 'c:/Users/Administrator/WorkBuddy/Claw',
  detached: true,
  stdio: 'ignore'
});

console.log('Launcher PID:', child.pid);

// 等待3秒后测试
setTimeout(() => {
  http.get('http://localhost:3002/api/health', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('✅ Launcher 启动正常!');
      console.log('响应:', d);
      child.kill();
      process.exit(0);
    });
  }).on('error', (e) => {
    console.log('❌ 连接失败:', e.message);
    child.kill();
    process.exit(1);
  });
}, 4000);
