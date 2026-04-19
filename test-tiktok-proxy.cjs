const net = require('net');

const proxyHost = '127.0.0.1';
const proxyPort = 6789;

function testConnect(host, port, label) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
    socket.setTimeout(10000);

    socket.on('connect', () => {
      socket.write(
        `CONNECT ${host}:${port} HTTP/1.1\r\n` +
        `Host: ${host}:${port}\r\n` +
        `\r\n`
      );
    });

    let data = '';
    socket.on('data', (chunk) => { data += chunk.toString(); });
    socket.on('end', () => {
      const firstLine = data.split('\r\n')[0];
      console.log(`${label}: ${firstLine}`);
      socket.destroy();
      resolve(firstLine && firstLine.includes('200'));
    });

    socket.on('timeout', () => { console.log(`${label}: TIMEOUT`); socket.destroy(); resolve(false); });
    socket.on('error', (e) => { console.log(`${label}: ERROR - ${e.message}`); resolve(false); });
  });
}

(async () => {
  const results = await Promise.all([
    testConnect('www.google.com', 443, 'Google'),
    testConnect('www.tiktok.com', 443, 'TikTok'),
    testConnect('seller-accounts.tiktok.com', 443, 'TikTok Seller'),
  ]);
  console.log('\n总结:');
  console.log('Google:', results[0] ? '✅' : '❌');
  console.log('TikTok:', results[1] ? '✅' : '❌');
  console.log('TikTok Seller:', results[2] ? '✅' : '❌');
})();
