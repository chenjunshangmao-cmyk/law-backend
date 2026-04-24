/**
 * Claw API 服务层
 * - 统一错误处理
 * - 自动携带 JWT token
 * - 超时处理（解决 Render 冷启动 Bug5）
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com';
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
    throw new Error(data?.error || data?.message || `请求失败 (${response.status})`);
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
  // 收钱吧 API
  // ============================================================
  shouqianba: {
    activate: () => authFetch('/api/shouqianba/activate', { method: 'POST' }),
    checkin: () => authFetch('/api/shouqianba/checkin', { method: 'POST' }),
    status: () => authFetch('/api/shouqianba/status'),
    // 使用原生 fetch 而非 authFetch，因为 authFetch 会剥离外层 {success, data} 结构
    createOrder: async (planId: string, price: number, subject?: string) => {
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
          deviceId: 'claw-web-new3'
        })
      }, 90000);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || '创建收钱吧订单失败');
      return result;
    },
    query: (sn: string) => authFetch(`/api/shouqianba/query?sn=${sn}`),
  },

  // ============================================================
  // Membership API
  // ============================================================
  membership: {
    info: () => authFetch('/api/membership'),
    quota: () => authFetch('/api/quota'),
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
  },

  // ============================================================
  // Calculate API
  // ============================================================
  calculate: {
    profit: (data: any) =>
      authFetch('/api/calculate/profit', { method: 'POST', body: JSON.stringify(data) }),
    
    quick: (data: any) =>
      authFetch('/api/calculate/quick', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ============================================================
  // Scraper API (Bug1/Bug2 - 目前返回模拟数据)
  // ============================================================
  scraper: {
    fetch: (url: string) =>
      publicFetch('/api/scraper/fetch', { method: 'POST', body: JSON.stringify({ url }) }),
    
    searchCompetitor: (keyword: string, category?: string) =>
      publicFetch('/api/competitor/search', {
        method: 'POST',
        body: JSON.stringify({ keyword, category }),
      }),
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
    },
    ozon: {
      login: (email: string) =>
        authFetch('/api/browser/ozon/login', { method: 'POST', body: JSON.stringify({ email }) }),
      status: (email: string) =>
        authFetch(`/api/browser/ozon/status?email=${encodeURIComponent(email)}`),
    },
    systemStatus: () => authFetch('/api/browser/system-status'),
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
};

export default api;
