// ==========================================
// Proxy Utility - 使用本地Clash代理
// ==========================================

const { HttpsProxyAgent } = require('https-proxy-agent');

// Clash本地代理地址（默认7890端口）
const CLASH_PROXY = process.env.CLASH_PROXY || 'http://127.0.0.1:7890';

/**
 * 获取代理Agent
 */
function getProxyAgent() {
  try {
    return new HttpsProxyAgent(CLASH_PROXY);
  } catch (error) {
    console.warn('代理初始化失败:', error.message);
    return null;
  }
}

/**
 * 带代理的fetch
 */
async function fetchWithProxy(url, options = {}) {
  const agent = getProxyAgent();
  
  const fetchOptions = {
    ...options,
    agent,
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('代理请求失败:', error.message);
    throw error;
  }
}

/**
 * 检查代理是否可用
 */
async function checkProxy() {
  try {
    const agent = getProxyAgent();
    if (!agent) return false;
    
    // 测试访问Google
    const response = await fetch('https://www.google.com/generate_204', {
      agent,
      timeout: 5000,
    });
    
    return response.status === 204;
  } catch (error) {
    console.warn('代理检查失败:', error.message);
    return false;
  }
}

module.exports = {
  getProxyAgent,
  fetchWithProxy,
  checkProxy,
  CLASH_PROXY,
};
