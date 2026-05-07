/**
 * Claw API 服务层
 * - 统一错误处理
 * - 自动携带 JWT token
 * - 超时处理（解决 Render 冷启动 Bug5）
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.chenjuntrading.cn';
export const API_BASE_URL = BASE_URL;
const DEFAULT_TIMEOUT = 60000; // 60秒，处理 Render 冷启动

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，服务器可能正在启动，请稍后重试');
    }
    throw new Error(`网络错误：${err.message}`);
  }

  // 不再自动 logout，让调用方处理 401
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // ★ 抛出包含 status/code/data 的增强错误对象
    // 这样调用方可以区分 401(认证失败) vs 503(服务器不可用) vs 500(内部错误)
    const enhancedError: any = new Error(data?.error || data?.message || `请求失败 (${response.status})`);
    enhancedError.status = response.status;
    enhancedError.code = data?.code || '';
    enhancedError.data = data;
    throw enhancedError;
  }

  return data;
}

export async function publicFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw new Error(`网络错误：${err.message}`);
  }

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `请求失败 (${response.status})`);
  }

  return data;
}

// ============================================================
// Auth API
// ============================================================
export const api = {
  auth: {
    login: (email: string, password: string) =>
      publicFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (email: string, password: string, name: string) =>
      publicFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    
    logout: () => authFetch('/api/auth/logout', { method: 'POST' }),
    
    profile: () => authFetch('/api/auth/profile'),
    
    quota: () => authFetch('/api/auth/quota'),
  },

  // ============================================================
  // Products API
  // ============================================================
  products: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      return authFetch(`/api/products?${query}`);
    },
    
    get: (id: string) => authFetch(`/api/products/${id}`),
    
    create: (data: any) => authFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    update: (id: string, data: any) => authFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    delete: (id: string) => authFetch(`/api/products/${id}`, { method: 'DELETE' }),
  },

  // ============================================================
  // Accounts API (Bug6 已修复)
  // ============================================================
  accounts: {
    list: () => authFetch('/api/accounts'),
    
    get: (id: string) => authFetch(`/api/accounts/${id}`),
    
    create: (data: {
      platform: string;
      name: string;
      username?: string;
      credentials?: any;
      settings?: any;
    }) => authFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    update: (id: string, data: any) => authFetch(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    delete: (id: string) => authFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
    
    test: (id: string) => authFetch(`/api/accounts/${id}/test`, { method: 'POST' }),
    
    sync: (id: string) => authFetch(`/api/accounts/${id}/sync`, { method: 'POST' }),

    // OZON API 授权（Client ID + API Key → 自动验证+创建账号）
    ozonAuthorize: (data: {
      name: string;
      clientId: string;
      apiKey: string;
    }) => authFetch('/api/accounts/ozon-authorize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    // YouTube OAuth 授权
    youtubeAuthorize: (data: { name: string }) =>
      authFetch('/api/accounts/youtube-authorize', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // 小红书扫码登录
    xiaohongshuQrcode: (accountId?: string) => authFetch('/api/accounts/xiaohongshu-login/qrcode', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    }),
    xiaohongshuWait: (accountId?: string, timeout?: number) => authFetch('/api/accounts/xiaohongshu-login/wait', {
      method: 'POST',
      body: JSON.stringify({ accountId, timeout: timeout || 120000 }),
    }),
    xiaohongshuStatus: (accountId?: string) =>
      authFetch(`/api/accounts/xiaohongshu-login/status${accountId ? `?accountId=${accountId}` : ''}`),

    // Chrome 扩展同步 cookie
    extensionSync: (data: { platform: string; cookies?: any; connectedAt?: string }) =>
      authFetch('/api/accounts/extension-sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // 检测 Chrome 扩展是否安装（通过 DOM 桥接元素 + MutationObserver）
    extensionCheck: () => {
      return new Promise<{ installed: boolean; version?: string }>((resolve) => {
        // 方法1：直接检查桥接元素是否存在（扩展安装后会创建 #claw-bridge 元素）
        const existingBridge = document.getElementById('claw-bridge');
        if (existingBridge) {
          const version = existingBridge.getAttribute('data-extension-version') || undefined;
          resolve({ installed: true, version });
          return;
        }

        // 方法2：等一小段时间，扩展可能还没注入完
        let resolved = false;
        const checkInterval = setInterval(() => {
          const bridge = document.getElementById('claw-bridge');
          if (bridge) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              const version = bridge.getAttribute('data-extension-version') || undefined;
              resolve({ installed: true, version });
            }
          }
        }, 200);

        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            resolve({ installed: false });
          }
        }, 3000);
      });
    },

    // 通过 DOM 桥接与 Chrome 扩展通信
    extensionRequest: (action: string, data: Record<string, any> = {}) => {
      return new Promise<any>((resolve, reject) => {
        // 确保桥接元素存在
        let bridge = document.getElementById('claw-bridge');
        if (!bridge) {
          reject(new Error('Chrome 扩展未安装'));
          return;
        }

        const requestId = action + '-' + Date.now();
        const requestData = { action, requestId, ...data };

        // 监听 data-response 变化
        let resolved = false;
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.attributeName === 'data-response') {
              const responseStr = bridge!.getAttribute('data-response');
              if (responseStr) {
                try {
                  const response = JSON.parse(responseStr);
                  if (response.requestId === requestId) {
                    observer.disconnect();
                    clearTimeout(timeout);
                    if (!resolved) {
                      resolved = true;
                      // 清空响应
                      bridge!.setAttribute('data-response', '');
                      resolve(response);
                    }
                  }
                } catch (e) {
                  console.error('[Claw] 解析扩展响应失败:', e);
                }
              }
            }
          }
        });

        observer.observe(bridge, { attributes: true, attributeFilter: ['data-response'] });

        // 超时
        const timeout = setTimeout(() => {
          observer.disconnect();
          if (!resolved) {
            resolved = true;
            reject(new Error('扩展通信超时'));
          }
        }, 10000);

        // 写入请求
        bridge.setAttribute('data-request', JSON.stringify(requestData));
      });
    },
  },

  // ============================================================
  // Payment API (Bug4 修复：Loading 状态)
  // ============================================================
  payment: {
    createOrder: async (data: {
      plan?: string;
      serviceId?: string;
      serviceName?: string;
      amount?: number;
      returnUrl?: string;
    }) => {
      // Bug4 修复：使用更长超时（收钱吧 API 较慢）
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      let response: Response;
      try {
        response = await fetchWithTimeout(
          `${BASE_URL}/api/payment/create`,
          { method: 'POST', headers, body: JSON.stringify(data) },
          90000 // 90 秒超时
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('支付请求超时，请稍后重试');
        }
        throw new Error(`网络错误：${err.message}`);
      }
      
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || '创建支付订单失败');
      }
      return result;
    },
    
    status: (orderNo: string) => authFetch(`/api/payment/status/${orderNo}`),
    
    orders: (page = 1, limit = 10) => authFetch(`/api/payment/orders?page=${page}&limit=${limit}`),
  },

  // ============================================================
  // Crypto 加密支付 API (USDT)
  // ============================================================
  crypto: {
    createOrder: async (data: { plan?: string; serviceId?: string }) => {
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/crypto/create`,
        { method: 'POST', headers, body: JSON.stringify(data) },
        30000
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || '创建USDT订单失败');
      return result;
    },
    status: (orderNo: string) => authFetch(`/api/crypto/status/${orderNo}`),
    wallet: () => authFetch('/api/crypto/wallet'),
  },

  // ============================================================
  // 收钱吧 API
  // ============================================================
  shouqianba: {
    activate: () => authFetch('/api/shouqianba/activate', { method: 'POST' }),
    checkin: () => authFetch('/api/shouqianba/checkin', { method: 'POST' }),
    status: () => authFetch('/api/shouqianba/status'),
    // 使用原生 fetch 而非 authFetch，因为 authFetch 会剥离外层 {success, data} 结构
    createOrder: async (planId: string, price: number, subject?: string, userId?: string) => {
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetchWithTimeout(`${BASE_URL}/api/shouqianba/create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientSn: `claw-${planId}-${Date.now()}`,
          totalAmount: price,
          subject: subject || `Claw会员-${planId}`,
          // deviceId 交由后端默认值决定，前端不再硬编码
          userId,   // 传入 userId，后端写 payment_orders 表，回调时自动升级会员
        })
      }, 90000);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || '创建收钱吧订单失败');
      return result;
    },
    query: (sn: string) => authFetch(`/api/shouqianba/query?sn=${sn}`),
    // ★ 重新扫码：复用原订单的支付链接
    reopen: (sn: string) => authFetch(`/api/shouqianba/reopen/${sn}`),
    // ★ 删除订单（仅 pending/cancelled 可删）
    deleteOrder: (sn: string) => authFetch(`/api/shouqianba/order/${sn}`, { method: 'DELETE' }),
  },

  // ============================================================
  // Membership API
  // ============================================================
  membership: {
    info: () => authFetch('/api/membership'),
    quota: () => authFetch('/api/quota'),
    // 管理员接口
    admin: {
      listUsers: () => authFetch('/api/membership/admin/users'),
      activate: (userId: string, plan: string) =>
        authFetch('/api/membership/admin/activate', { method: 'POST', body: JSON.stringify({ userId, plan }) }),
      deactivate: (userId: string) =>
        authFetch('/api/membership/admin/deactivate', { method: 'POST', body: JSON.stringify({ userId }) }),
    },
  },

  // ============================================================
  // Generate API
  // ============================================================
  generate: {
    text: (data: {
      prompt?: string; productName?: string; productDescription?: string;
      platform?: string; style?: string; type?: string; language?: string
    }) => authFetch('/api/generate/text', { method: 'POST', body: JSON.stringify(data) }),

    image: (data: {
      description?: string; productName?: string;
      productDescription?: string; style?: string
    }) => authFetch('/api/generate/image', { method: 'POST', body: JSON.stringify(data) }),

    // 多语言翻译
    translate: (data: {
      text: string | object;
      sourceLang?: string;
      targetLang: string;
      platform?: string;
    }) => authFetch('/api/generate/translate', { method: 'POST', body: JSON.stringify(data) }),

    // 批量翻译
    batchTranslate: (data: {
      items: Array<{ title: string; description?: string; features?: string[]; keywords?: string[] }>;
      targetLanguages: string[];
      platform?: string;
    }) => authFetch('/api/generate/batch-translate', { method: 'POST', body: JSON.stringify(data) }),

    // 获取支持的语言
    languages: () => authFetch('/api/generate/languages'),
  },

  // ============================================================
  // Dify 工作流 API（图文自动生成）
  // ============================================================
  dify: {
    // 健康检查
    health: () => authFetch('/api/dify/health'),

    // 生成多平台营销文案
    generate: (data: {
      imageUrl?: string;
      imageUrls?: string[];
      platform?: string;
      productName?: string;
    }) => authFetch('/api/dify/generate', { method: 'POST', body: JSON.stringify(data) }),

    // 查询任务状态
    getTask: (taskId: string) =>
      authFetch(`/api/dify/task/${taskId}`),

    // 获取应用信息
    getInfo: () => authFetch('/api/dify/info'),
  },

  // ============================================================
  // Calculate API
  // ============================================================
  calculate: {
    profit: (data: any) =>
      authFetch('/api/calculate/profit', { method: 'POST', body: JSON.stringify(data) }),
    
    quick: (data: any) =>
      authFetch('/api/calculate/quick', { method: 'POST', body: JSON.stringify(data) }),

    logistics: () =>
      authFetch('/api/calculate/logistics'),

    platforms: () =>
      authFetch('/api/calculate/platforms'),
  },

  // ============================================================
  // Scraper API (1688/淘宝/拼多多商品抓取)
  // ============================================================
  scraper: {
    fetch: (url: string) =>
      authFetch('/api/scraper/fetch', { method: 'POST', body: JSON.stringify({ url }) }),
    
    searchCompetitor: (keyword: string, category?: string) =>
      authFetch('/api/competitor/search', {
        method: 'POST',
        body: JSON.stringify({ keyword, category }),
      }),
  },

  // ============================================================
  // AI 增强 API
  // ============================================================
  ai: {
    // AI生成产品图片
    generateProductImage: (data: {
      productName: string;
      productDesc?: string;
      style?: string;
      referenceImages?: string[];
    }) => authFetch('/api/generate/product-image', { method: 'POST', body: JSON.stringify(data) }),

    // AI生成视频脚本
    generateVideoScript: (data: {
      productName: string;
      productDesc?: string;
      platform?: string;
      duration?: number;
      tone?: string;
    }) => authFetch('/api/generate/video-script', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ============================================================
  // Browser Automation API (Bug5 修复：超时处理)
  // ============================================================
  browser: {
    tiktok: {
      login: (email: string, accountId?: string) =>
        authFetch('/api/browser/tiktok/login', {
          method: 'POST',
          body: JSON.stringify({ email, accountId }),
        }),
      status: (email: string, accountId?: string) =>
        authFetch(`/api/browser/tiktok/status?email=${encodeURIComponent(email)}${accountId ? `&accountId=${encodeURIComponent(accountId)}` : ''}`),
      publish: (data: any) =>
        authFetch('/api/browser/tiktok/publish', { method: 'POST', body: JSON.stringify(data) }),
    },
    youtube: {
      getAuthUrl: () => authFetch('/api/auth/youtube'),
      listAccounts: () => authFetch('/api/auth/youtube/accounts'),
      login: (email: string, accountId?: string) =>
        authFetch('/api/browser/youtube/login', {
          method: 'POST',
          body: JSON.stringify({ email, accountId }),
        }),
      status: (email: string, accountId?: string) =>
        authFetch(`/api/browser/youtube/status?email=${encodeURIComponent(email)}${accountId ? `&accountId=${encodeURIComponent(accountId)}` : ''}`),
      // Bug5 修复：YouTube 上传使用 180 秒超时
      upload: async (data: { email: string; videoPath: string; title: string; description?: string; privacy?: string; accountId?: string }) => {
        const token = getToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        let response: Response;
        try {
          response = await fetchWithTimeout(
            `${BASE_URL}/api/browser/youtube/upload`,
            { method: 'POST', headers, body: JSON.stringify(data) },
            180000 // 3 分钟超时（视频上传较慢）
          );
        } catch (err: any) {
          if (err.name === 'AbortError') throw new Error('视频上传超时，请检查视频大小后重试');
          throw new Error(`上传失败：${err.message}`);
        }
        return response.json();
      },

      /** 发布社区帖子（图文） */
      post: async (data: { email: string; text: string; images?: string[]; title?: string; accountId?: string }) => {
        const token = getToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        let response: Response;
        try {
          response = await fetchWithTimeout(
            `${BASE_URL}/api/browser/youtube/post`,
            { method: 'POST', headers, body: JSON.stringify(data) },
            120000 // 2 分钟超时
          );
        } catch (err: any) {
          if (err.name === 'AbortError') throw new Error('发布超时，请重试');
          throw new Error(`发布失败：${err.message}`);
        }
        return response.json();
      },
    },
    ozon: {
      login: (email: string, accountId?: string) =>
        authFetch('/api/browser/ozon/login', { method: 'POST', body: JSON.stringify({ email, accountId }) }),
      status: (email: string, accountId?: string) =>
        authFetch(`/api/browser/ozon/status?email=${encodeURIComponent(email)}${accountId ? `&accountId=${encodeURIComponent(accountId)}` : ''}`),
      publish: (data: {
        email: string;
        title: string;
        description?: string;
        price?: number;
        stock?: number;
        category?: string;
        images?: string[];
        shopLink?: string;
        accountId?: string;
      }) =>
        authFetch('/api/browser/ozon/publish', { method: 'POST', body: JSON.stringify(data) }),
    },
    systemStatus: () => authFetch('/api/browser/system-status'),
  },

  // ============================================================
  // YouTube Data API v3（无需浏览器）
  // ============================================================
  youtube: {
    accounts: () => authFetch('/api/youtube/accounts'),
    oauthUrl: (mode = 'popup') => authFetch(`/api/youtube/oauth-url?mode=${mode}`),
    channelInfo: (channelId: string) => authFetch(`/api/youtube/channel/${encodeURIComponent(channelId)}`),
    upload: (data: { channelId: string; videoPath: string; title: string; description?: string; tags?: string[]; privacyStatus?: string; thumbnailPath?: string }) =>
      authFetch('/api/youtube/upload', { method: 'POST', body: JSON.stringify(data) }),
    videos: (channelId: string, maxResults = 10) =>
      authFetch(`/api/youtube/videos?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}`),
    videoDetail: (videoId: string, channelId: string) =>
      authFetch(`/api/youtube/video/${encodeURIComponent(videoId)}?channelId=${encodeURIComponent(channelId)}`),
    quota: () => authFetch('/api/youtube/quota'),
  },

  // ============================================================
  // Avatar API (AI数字人)
  // ============================================================
  avatar: {
    generateScript: (data: { productName: string; productDesc?: string; scene?: string }) =>
      authFetch('/api/avatar/generate-script', { method: 'POST', body: JSON.stringify(data) }),

    generate: (data: {
      script: string;
      productName: string;
      productDesc?: string;
      templateId?: string;
      avatarStyle?: string;
      voiceId?: string;
      background?: string;
      music?: string;
    }) => authFetch('/api/avatar/generate', { method: 'POST', body: JSON.stringify(data) }),

    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      return authFetch(`/api/avatar/list?${query}`);
    },

    get: (id: string) => authFetch(`/api/avatar/${id}`),

    deleteVideo: (id: string) => authFetch(`/api/avatar/${id}`, { method: 'DELETE' }),

    upload: (data: { id: string; title: string; description: string; platform: string }) =>
      authFetch('/api/avatar/upload', { method: 'POST', body: JSON.stringify(data) }),

    scripts: {
      list: () => authFetch('/api/avatar/scripts/list'),
      delete: (id: string) => authFetch(`/api/avatar/scripts/${id}`, { method: 'DELETE' }),
    },
  },

  // ============================================================
  // Tasks API
  // ============================================================
  tasks: {
    list: () => authFetch('/api/tasks'),
    create: (data: any) => authFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => authFetch(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => authFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
  },

  // 小红书 API
  xiaohongshu: {
    listAccounts: () => authFetch('/api/xiaohongshu/accounts'),
    loginQrcode: (accountId?: string) => authFetch('/api/xiaohongshu/login/qrcode', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    }),
    loginWait: (accountId?: string, timeout?: number) => authFetch('/api/xiaohongshu/login/wait', {
      method: 'POST',
      body: JSON.stringify({ accountId, timeout: timeout || 120000 }),
    }),
    loginStatus: (accountId?: string) => authFetch(`/api/xiaohongshu/login/status${accountId ? `?accountId=${accountId}` : ''}`),
    deleteAccount: (accountId: string) => authFetch(`/api/xiaohongshu/accounts/${accountId}`, { method: 'DELETE' }),
    publishNote: (data: any) => authFetch('/api/xiaohongshu/publish/note', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    publishVideo: (data: any) => authFetch('/api/xiaohongshu/publish/video', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    shopInfo: () => authFetch('/api/xiaohongshu/shop/info'),
    status: () => authFetch('/api/xiaohongshu/status'),

    // AI 功能
    ai: {
      /** 识别图片 → 返回产品名称/类目/特点 */
      analyzeImage: (imageBase64: string) =>
        authFetch('/api/xiaohongshu/ai/analyze-image', {
          method: 'POST',
          body: JSON.stringify({ imageBase64 }),
        }),

      /** 生成小红书文案（标题/正文/标签） */
      generateContent: (data: {
        imageDescription?: string;
        productName?: string;
        style?: '种草' | '测评' | '日常' | '带货';
        extraInfo?: string;
      }) =>
        authFetch('/api/xiaohongshu/ai/generate-content', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 批量生成4种风格的文案 */
      generateMultiContent: (data: {
        imageDescription?: string;
        productName?: string;
        extraInfo?: string;
      }) =>
        authFetch('/api/xiaohongshu/ai/generate-multi-content', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 图生图 - Wanx 风格迁移 */
      imageToImage: (data: {
        imageBase64: string;
        style?: 'anime' | 'oil' | 'watercolor' | 'sketch' | 'flat' | 'pop';
        prompt?: string;
      }) =>
        authFetch('/api/xiaohongshu/ai/image-to-image', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 文生图 - Wanx */
      textToImage: (data: { prompt: string; style?: string }) =>
        authFetch('/api/xiaohongshu/ai/text-to-image', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 产品链接抓取 → 图片+详情 */
      fetchProduct: (data: { url: string }) =>
        authFetch('/api/xiaohongshu/ai/fetch-product', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 竞品分析 + 生成全套高竞争力发布资料 */
      competitiveAnalysis: (data: { productData: any }) =>
        authFetch('/api/xiaohongshu/ai/competitive-analysis', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 基于竞品分析生成有竞争力的产品图 */
      competitiveImages: (data: {
        imageBase64: string;
        productTitle?: string;
        sellingPoints?: string[];
        style?: string;
      }) =>
        authFetch('/api/xiaohongshu/ai/competitive-images', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },

  // TikTok Shop AI 发布 API（复用小红书抓取逻辑，英文文案）
  tiktokPublish: {
    ai: {
      /** 产品链接抓取（复用通用抓取） */
      fetchProduct: (data: { url: string }) =>
        authFetch('/api/tiktok-publish/ai/fetch-product', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** AI 竞品分析 + 英文 TikTok listing 生成 */
      competitiveAnalysis: (data: { productData: any }) =>
        authFetch('/api/tiktok-publish/ai/competitive-analysis', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** AI 生成 TikTok 文案 */
      generateContent: (data: {
        productName?: string;
        productDescription?: string;
        style?: string;
        category?: string;
      }) =>
        authFetch('/api/tiktok-publish/ai/generate-content', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },

  // OZON AI 发布 API（复用抓取逻辑，俄文文案）
  ozonPublish: {
    ai: {
      /** 产品链接抓取 */
      fetchProduct: (data: { url: string }) =>
        authFetch('/api/ozon-publish/ai/fetch-product', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** AI 竞品分析 + 俄语 OZON listing 生成 */
      competitiveAnalysis: (data: { productData: any }) =>
        authFetch('/api/ozon-publish/ai/competitive-analysis', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** AI 生成 OZON 文案 */
      generateContent: (data: {
        productName?: string;
        productDescription?: string;
        style?: string;
        category?: string;
      }) =>
        authFetch('/api/ozon-publish/ai/generate-content', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },

    /** OZON Seller API 直接发布商品 */
    api: {
      /** 通过 API 直接发布商品到 OZON（支持 accountId 或 clientId+apiKey） */
      publish: (data: {
        accountId?: string;
        clientId?: string;
        apiKey?: string;
        name: string;
        offer_id: string;
        price: string;
        old_price?: string;
        currency_code?: string;
        vat?: string;
        barcode?: string;
        description_category_id?: number;
        type_id?: number;
        images?: string[];
        primary_image?: string;
        attributes?: any[];
        weight?: number;
        weight_unit?: string;
        height?: number;
        width?: number;
        depth?: number;
        dimension_unit?: string;
      }) =>
        authFetch('/api/ozon-publish/api/publish', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 查询商品发布任务状态 */
      publishStatus: (data: { accountId?: string; clientId?: string; apiKey?: string; taskId: number }) =>
        authFetch('/api/ozon-publish/api/publish-status', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 获取 OZON 商品类目树 */
      categories: (params: { accountId?: string; clientId?: string; apiKey?: string; categoryId?: number; language?: string }) => {
        const qp = new URLSearchParams();
        if (params.accountId) qp.set('accountId', params.accountId);
        if (params.clientId) qp.set('clientId', params.clientId);
        if (params.apiKey) qp.set('apiKey', params.apiKey);
        if (params.categoryId) qp.set('categoryId', String(params.categoryId));
        if (params.language) qp.set('language', params.language);
        return authFetch(`/api/ozon-publish/api/categories?${qp.toString()}`);
      },

      /** 更新商品价格 */
      updatePrices: (data: { accountId?: string; clientId?: string; apiKey?: string; prices: Array<{ offer_id: string; price: string; old_price?: string; currency_code?: string }> }) =>
        authFetch('/api/ozon-publish/api/update-prices', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      /** 更新商品库存 */
      updateStocks: (data: { accountId?: string; clientId?: string; apiKey?: string; stocks: Array<{ offer_id: string; stock: number }> }) =>
        authFetch('/api/ozon-publish/api/update-stocks', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },

  // ============================================================
  // YouTube Data API v3（OAuth 直传，无需浏览器）
  // ============================================================
  youtube: {
    /** 用 Data API 直接上传视频 */
    upload: async (data: {
      channelId: string;
      videoPath: string;
      title: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: string;
    }) => {
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/youtube/upload`,
        { method: 'POST', headers, body: JSON.stringify(data) },
        300000 // 5 分钟超时（大视频上传慢）
      );
      return response.json();
    },

    /** 获取授权账号列表 */
    listAccounts: () => authFetch('/api/youtube/accounts'),

    /** 视频列表 */
    listVideos: (channelId: string, maxResults = 10) =>
      authFetch(`/api/youtube/videos?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}`),

    /** 视频详情 */
    getVideo: (videoId: string, channelId: string) =>
      authFetch(`/api/youtube/video/${encodeURIComponent(videoId)}?channelId=${encodeURIComponent(channelId)}`),

    /** 频道信息 */
    getChannel: (channelId: string) =>
      authFetch(`/api/youtube/channel/${encodeURIComponent(channelId)}`),

    /** 配额检查 */
    checkQuota: () => authFetch('/api/youtube/quota'),
  },

  // 发布任务队列（OpenClaw 客服自动执行）
  publishQueue: {
    /** 创建发布任务 → 客服自动领取执行 */
    create: (data: { platform: string; accountId: string; title: string; content: string; tags: string[]; images: string[] }) =>
      authFetch('/api/publish-queue/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    /** 查询任务状态 */
    getStatus: (taskId: number) => authFetch(`/api/publish-queue/tasks/${taskId}`),
    /** 查询所有任务 */
    list: (platform?: string) => authFetch(`/api/publish-queue/tasks${platform ? `?platform=${platform}` : ''}`),
    /** SSE 实时监控任务进度（返回 EventSource + cleanup 函数） */
    stream: (taskId: number, onProgress: (event: any) => void) => {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const baseUrl = apiUrl.replace(/\/$/, '');
      const url = `${baseUrl}/api/publish-queue/tasks/${taskId}/stream?token=${encodeURIComponent(token || '')}`;
      const es = new EventSource(url);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onProgress(data);
        } catch {}
      };
      return {
        close: () => es.close(),
        eventSource: es,
      };
    },
  },

  // AI 工具箱
  aiTools: {
    process: (action: string, formData: FormData) =>
      authFetch(`/api/ai-tools/${action}`, {
        method: 'POST',
        body: formData,
        headers: {}, // 让浏览器自动设置 Content-Type: multipart/form-data
      }),
  },
};

export default api;
