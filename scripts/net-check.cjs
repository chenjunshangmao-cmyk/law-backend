const net = require('net');
const hosts = [
  { name: 'TikTok Seller', host: 'seller.tiktok.com' },
  { name: 'YouTube Studio', host: 'studio.youtube.com' },
  { name: 'OZON Seller', host: 'seller.ozon.ru' },
];

function checkHost(name, host, cb) {
  const client = new net.Socket();
  client.setTimeout(5000);
  client.connect(443, host, () => {
    console.log(`✅ ${name} (${host}): 直连成功`);
    client.destroy();
    cb();
  });
  client.on('timeout', () => {
    console.log(`⏱️  ${name} (${host}): 超时（需要代理）`);
    client.destroy();
    cb();
  });
  client.on('error', (e) => {
    console.log(`❌ ${name} (${host}): 连接失败 - ${e.message}`);
    client.destroy();
    cb();
  });
}

let i = 0;
function next() {
  if (i >= hosts.length) return;
  checkHost(hosts[i].name, hosts[i].host, () => {
    i++;
    setTimeout(next, 500);
  });
}
next();
