/**
 * OZON API 客户端
 * 文档: https://api-seller.ozon.ru/
 */

import axios from 'axios';

const OZON_API_BASE = 'https://api-seller.ozon.ru';

/**
 * 创建 OZON API 客户端
 * @param {string} clientId - Client ID
 * @param {string} apiKey - API Key
 */
export const createOzonClient = (clientId, apiKey) => {
  const client = axios.create({
    baseURL: OZON_API_BASE,
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // 响应拦截器 - 统一错误处理
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('OZON API 错误:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'OZON API 请求失败');
    }
  );

  return client;
};

/**
 * 获取产品列表
 * @param {Object} client - axios 客户端
 * @param {Object} params - 查询参数
 */
export const getProducts = async (client, params = {}) => {
  const defaultParams = {
    page: 1,
    page_size: 100,
    ...params,
  };

  const response = await client.post('/v3/product/list', defaultParams);
  return response.data;
};

/**
 * 获取产品详情
 * @param {Object} client - axios 客户端
 * @param {Array} productIds - 产品 ID 列表
 */
export const getProductDetails = async (client, productIds) => {
  const response = await client.post('/v2/product/info/list', {
    sku_list: productIds.map((id) => ({ sku: id })),
  });
  return response.data;
};

/**
 * 获取订单列表
 * @param {Object} client - axios 客户端
 * @param {Object} params - 查询参数
 */
export const getOrders = async (client, params = {}) => {
  const defaultParams = {
    page: 1,
    page_size: 100,
    ...params,
  };

  const response = await client.post('/v3/order/list', defaultParams);
  return response.data;
};

/**
 * 获取订单详情
 * @param {Object} client - axios 客户端
 * @param {string} orderId - 订单 ID
 */
export const getOrderDetails = async (client, orderId) => {
  const response = await client.post('/v2/order/details', {
    order_id: orderId,
  });
  return response.data;
};

/**
 * 获取卖家信息
 * @param {Object} client - axios 客户端
 */
export const getSellerInfo = async (client) => {
  const response = await client.get('/v1/seller/info');
  return response.data;
};

/**
 * 同步账号数据（产品+订单+统计）
 * @param {string} clientId - Client ID
 * @param {string} apiKey - API Key
 * @returns {{ success, productsCount, ordersCount, products, orders, stats, syncTime }} 
 */
export const syncAccountData = async (clientId, apiKey) => {
  try {
    const client = createOzonClient(clientId, apiKey);

    // 验证连接
    await getSellerInfo(client);

    // 并发获取产品和订单
    const [productsRes, ordersRes] = await Promise.allSettled([
      getProducts(client),
      getOrders(client, { page: 1, page_size: 50 })
    ]);

    // 解析产品
    const productsData = productsRes.status === 'fulfilled' ? productsRes.value : { items: [] };
    const items = productsData.items || [];
    const productsCount = items.length;

    // 产品状态统计
    const stats = { total: 0, active: 0, archived: 0, awaiting_approval: 0, rejected: 0 };
    items.forEach(p => {
      const s = ((p.state?.name || p.status || '') + '').toLowerCase();
      stats.total++;
      if (s.includes('approved') || s.includes('published') || s.includes('active') || s.includes('for_sale')) {
        stats.active++;
      } else if (s.includes('archived') || s.includes('inactive')) {
        stats.archived++;
      } else if (s.includes('pending') || s.includes('moderation') || s.includes('new')) {
        stats.awaiting_approval++;
      } else if (s.includes('rejected') || s.includes('failed') || s.includes('not_approved')) {
        stats.rejected++;
      }
    });

    // 解析订单
    const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value : { orders: [] };
    const orders = ordersData.orders || [];
    const ordersCount = orders.length;

    // 订单状态统计
    const ordersSummary = { total: ordersCount, pending: 0, awaiting_delivery: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (s.includes('pending') || s.includes('awaiting_payment') || s.includes('unpaid')) {
        ordersSummary.pending++;
      } else if (s.includes('awaiting_delivery') || s.includes('shipped') || s.includes('delivering')) {
        ordersSummary.awaiting_delivery++;
      } else if (s.includes('delivered') || s.includes('complete')) {
        ordersSummary.delivered++;
      } else if (s.includes('cancelled') || s.includes('refund')) {
        ordersSummary.cancelled++;
      }
    });

    return {
      success: true,
      productsCount,
      ordersCount,
      products: items,
      orders,
      stats,
      ordersSummary,
      syncTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OZON 同步失败:', error);
    return {
      success: false,
      error: error.message,
      productsCount: 0,
      ordersCount: 0,
    };
  }
};

export default {
  createOzonClient,
  getProducts,
  getProductDetails,
  getOrders,
  getOrderDetails,
  getSellerInfo,
  syncAccountData,
};
