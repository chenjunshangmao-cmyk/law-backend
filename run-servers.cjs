const { spawn } = require('child_process');
const http = require('http');

function start(script, name, port) {
  return new Promise((resolve) => {
    const child = spawn('node', [script], {
      cwd: 'c:/Users/Administrator/WorkBuddy/Claw',
      detached: true,
      stdio: 'ignore'
    });
    console.log(`Started ${name}: PID ${child.pid}`);
    child.unref();
    setTimeout(resolve, 2000);
  });
}

async function check(port, path, name) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}${path}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const ok = res.statusCode === 200 && d.includes('<title>');
        console.log(`${ok ? 'OK' : 'FAIL'} ${name} (${port}): ${res.statusCode}`);
        resolve(ok);
      });
    }).on('error', (e) => {
      console.log(`FAIL ${name}: ${e.message}`);
      resolve(false);
    });
  });
}

(async () => {
  console.log('Starting services...\n');
  await start('local-browser-launcher.js', 'Launcher', 3002);
  await start('local-frontend-proxy.cjs', 'FrontendProxy', 8787);
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('\nVerifying...\n');
  await check(3002, '/browser', 'BrowserPage');
  await check(8787, '/', 'FrontendProxy');
  console.log('\nDone!');
})();
