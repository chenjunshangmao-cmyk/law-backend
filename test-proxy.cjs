const net = require('net');
const proxyHost = '127.0.0.1';
const proxyPort = 6789;

function testConnect(host, port) {
  return new Promise((resolve) => {
    console.log(`Connecting to ${host}:${port} via ${proxyHost}:${proxyPort}...`);
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
    socket.setTimeout(12000);

    socket.on('connect', () => {
      const req = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n\r\n`;
      socket.write(req);
    });

    let data = '';
    socket.on('data', (chunk) => { data += chunk.toString(); });
    socket.on('end', () => {
      const firstLine = data.trim().split('\r\n')[0];
      if (firstLine && firstLine.includes('200')) {
        console.log(`✅ ${host}: ${firstLine}`);
        socket.destroy();
        resolve(true);
      } else {
        console.log(`❌ ${host}: ${firstLine || 'no response'}`);
        socket.destroy();
        resolve(false);
      }
    });

    socket.on('timeout', () => { console.log(`❌ ${host}: timeout`); socket.destroy(); resolve(false); });
    socket.on('error', (e) => { console.log(`❌ ${host}: ${e.message}`); resolve(false); });
  });
}

(async () => {
  console.log('=== 代理连通性测试 ===\n');
  const r1 = await testConnect('www.google.com', 443);
  const r2 = await testConnect('www.tiktok.com', 443);
  const r3 = await testConnect('seller-accounts.tiktok.com', 443);
  console.log('\n=== 结果 ===');
  console.log('Google: ' + (r1 ? '✅ 可达' : '❌ 不可达'));
  console.log('TikTok: ' + (r2 ? '✅ 可达' : '❌ 不可达'));
  console.log('TikTok Seller: ' + (r3 ? '✅ 可达' : '❌ 不可达'));
})();
