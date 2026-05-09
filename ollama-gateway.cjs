/**
 * Ollama Gateway Proxy — 将本地 Ollama API 接入 Cloudflare 隧道
 * 启动: node ollama-gateway.js
 * 默认端口: 11435
 * 环境变量: GATEWAY_PORT, GATEWAY_API_KEY, OLLAMA_HOST
 */

const http = require('http');
const { env } = process;

const PORT = env.GATEWAY_PORT || 11435;
const OLLAMA = env.OLLAMA_HOST || 'http://localhost:11434';
const API_KEY = env.GATEWAY_API_KEY || '';

const MODELS = {
  names: ['qwen2.5:7b', 'qwen2.5:1.5b', 'qwen:0.5b', 'llama3.2:1b'],
  default: 'qwen2.5:7b',
};

const startedAt = Date.now();

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
  });
  res.end(JSON.stringify(data, null, 2));
}

function proxy(req, res) {
  const target = new URL(req.url, OLLAMA);
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: { ...req.headers },
  };
  delete options.headers.host;

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    json(res, 502, { error: 'Ollama 服务不可用', detail: err.message });
  });
  req.pipe(proxyReq);
}

function checkAuth(req, res) {
  if (!API_KEY) return true;
  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (key === API_KEY) return true;
  json(res, 401, { error: 'Unauthorized: 需要有效 API Key (Header: X-API-Key 或 Authorization: Bearer)' });
  return false;
}

const server = http.createServer((req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // 健康检查
  if (req.url === '/' || req.url === '/health') {
    return json(res, 200, {
      service: 'Ollama Gateway',
      version: '1.0.0',
      uptime: `${Math.floor((Date.now() - startedAt) / 1000)}s`,
      models: MODELS.names,
      default_model: MODELS.default,
      endpoints: {
        health: '/health',
        chat: 'POST /v1/chat/completions',
        list: 'GET /api/tags',
        generate: 'POST /api/generate',
        models: 'GET /v1/models',
      },
      auth: API_KEY ? 'required (X-API-Key header)' : 'none (configure GATEWAY_API_KEY to enable)',
    });
  }

  if (!checkAuth(req, res)) return;

  // 代理所有其他请求到 Ollama
  proxy(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Ollama Gateway 已启动`);
  console.log(`  本地地址: http://localhost:${PORT}`);
  console.log(`  Ollama 上游: ${OLLAMA}`);
  console.log(`  认证: ${API_KEY ? '已启用 (X-API-Key)' : '未启用 (公网部署请设置 GATEWAY_API_KEY)'}`);
  console.log(`\n📦 可用模型:`);
  MODELS.names.forEach((m) => console.log(`  - ${m}`));
  console.log(`\n💡 示例调用:`);
  console.log(`  curl http://localhost:${PORT}/api/tags`);
  console.log(`  curl http://localhost:${PORT}/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"${MODELS.default}","messages":[{"role":"user","content":"你好"}]}'`);
  console.log(`\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请设置 GATEWAY_PORT 换个端口`);
  } else {
    console.error('❌ 启动失败:', err.message);
  }
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n⏹  Ollama Gateway 已停止');
  process.exit(0);
});
