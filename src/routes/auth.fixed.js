/**
 * Google OAuth 修复版
 * 主要问题：回调URL生成逻辑错误
 * 修复：使用正确的后端URL作为回调基础
 */

// 获取正确的回调基础URL
function getCallbackBaseUrl(req) {
  const host = req.get('host') || '';
  const protocol = req.protocol === 'http' ? 'http' : 'https';
  
  // 生产环境
  if (host.includes('chenjuntrading.cn')) {
    return 'https://api.chenjuntrading.cn';
  }
  
  // Render环境
  if (host.includes('.onrender.com')) {
    return `${protocol}://${host}`;
  }
  
  // 开发环境
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:8089';
  }
  
  // 默认使用环境变量
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // 兜底
  return 'https://claw-backend-2026.onrender.com';
}

// 获取前端URL（用于重定向回前端）
function getFrontendUrl(req) {
  // 优先级1：环境变量
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // 优先级2：Referer
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refUrl = new URL(referer);
      return `${refUrl.protocol}//${refUrl.host}`;
    } catch {}
  }
  
  // 优先级3：已知前端域名
  const knownFrontends = [
    'https://chenjuntrading.cn',
    'https://claw-app-2026.pages.dev',
    'https://claw.pages.dev',
  ];
  
  const origin = req.headers.origin;
  if (origin && knownFrontends.includes(origin)) {
    return origin;
  }
  
  // 兜底
  return 'https://chenjuntrading.cn';
}

// Google OAuth配置
const GOOGLE_OAUTH_CONFIG = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
  token_url: 'https://oauth2.googleapis.com/token',
  userinfo_url: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scopes: 'email profile',
};

// 发起Google授权
function initiateGoogleAuth(req, res) {
  const clientId = GOOGLE_OAUTH_CONFIG.client_id;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      error: 'Google 登录未配置',
      hint: '请配置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET'
    });
  }

  const callbackBase = getCallbackBaseUrl(req);
  const redirectUri = `${callbackBase}/api/auth/google/callback`;
  
  console.log('[OAuth] 回调URL:', redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes,
    access_type: 'online',
    prompt: 'select_account',
  });

  const authUrl = `${GOOGLE_OAUTH_CONFIG.auth_url}?${params.toString()}`;
  console.log('[OAuth] 发起 Google 登录');
  res.redirect(authUrl);
}

// 处理Google回调
async function handleGoogleCallback(req, res) {
  const { code, error } = req.query;
  const frontendUrl = getFrontendUrl(req);

  if (error) {
    console.error('[OAuth] Google 授权错误:', error);
    return res.redirect(`${frontendUrl}/login?auth_error=google_denied`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?auth_error=no_code`);
  }

  try {
    const callbackBase = getCallbackBaseUrl(req);
    const redirectUri = `${callbackBase}/api/auth/google/callback`;
    
    console.log('[OAuth] 处理回调，使用重定向URI:', redirectUri);

    // 用code换取access_token
    const tokenRes = await axios.post(GOOGLE_OAUTH_CONFIG.token_url, new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.client_id,
      client_secret: GOOGLE_OAUTH_CONFIG.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = tokenRes.data;

    // 获取用户信息
    const userInfoRes = await axios.get(GOOGLE_OAUTH_CONFIG.userinfo_url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = {
      email: userInfoRes.data.email,
      name: userInfoRes.data.name || userInfoRes.data.email.split('@')[0],
      picture: userInfoRes.data.picture,
    };

    console.log('[OAuth] Google 登录成功:', googleUser.email);

    // 这里应该查找或创建用户，生成JWT token
    // 简化处理：重定向回前端，携带用户信息
    const token = 'generated-jwt-token-placeholder'; // 实际应该生成JWT
    const userData = {
      id: 'user-' + Date.now(),
      email: googleUser.email,
      name: googleUser.name,
      role: 'user',
      plan: 'free'
    };

    res.redirect(`${frontendUrl}/login?google_token=${token}&google_user=${encodeURIComponent(JSON.stringify(userData))}`);

  } catch (err) {
    console.error('[OAuth] 回调处理失败:', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/login?auth_error=google_callback_failed`);
  }
}

module.exports = {
  getCallbackBaseUrl,
  getFrontendUrl,
  initiateGoogleAuth,
  handleGoogleCallback
};