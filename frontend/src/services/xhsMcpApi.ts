/**
 * 小红书 MCP 桥接 API 客户端
 * 直连本地 xhs-bridge-server (localhost:8091)
 * CORS 已全开，不需要 auth token
 */

const BRIDGE_URL = 'http://localhost:8091';

async function bridgeFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  return res.json();
}

const xhsMcpApi = {
  /** 获取登录二维码 (forceNew=true 强制登出后获取新二维码) */
  getQrCode: (accountId: string = 'default', forceNew?: boolean) =>
    bridgeFetch('/login/qrcode', {
      method: 'POST',
      body: JSON.stringify({ accountId, forceNew }),
    }),

  /** 登出当前账号 */
  logout: (accountId?: string) =>
    bridgeFetch('/login/logout', {
      method: 'POST',
      body: JSON.stringify({ accountId: accountId || 'default' }),
    }),

  /** 检查登录状态 */
  loginStatus: (accountId: string = 'default') =>
    bridgeFetch(`/login/status?accountId=${encodeURIComponent(accountId)}`),

  /** 发布图文笔记 */
  publishNote: (data: {
    accountId?: string;
    title: string;
    content: string;
    images: string[];   // base64 data URLs
    tags?: string[];
  }) =>
    bridgeFetch('/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 发布视频笔记 */
  publishVideo: (data: {
    accountId?: string;
    title: string;
    content: string;
    videoBase64: string;
    coverBase64?: string;
    tags?: string[];
  }) =>
    bridgeFetch('/publish/video', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 获取笔记列表 */
  listFeeds: (accountId: string = 'default') =>
    bridgeFetch(`/feeds?accountId=${encodeURIComponent(accountId)}`),

  /** 健康检查 */
  health: () => bridgeFetch('/health'),
};

export default xhsMcpApi;
