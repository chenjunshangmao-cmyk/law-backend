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

  // 响应拦截器 - 统一错误处理（保留原始错误信息）
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // 提取 OZON API 真实错误信息
      const body = error.response?.data;
      let msg = 'OZON API 请求失败';
      if (body) {
        // OZON 错误格式：{ code, message, details: [...] }
        msg = body.message || (body.details?.[0]?.message) || JSON.stringify(body).slice(0, 200);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        msg = `网络不通：无法连接 OZON API (${error.code})`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        msg = `连接超时：OZON API 无响应 (${error.code})`;
      } else if (error.message) {
        msg = error.message;
      }
      console.error('OZON API 错误:', error.response?.status, msg);
      throw new Error(msg);
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

/**
 * 导入商品（创建或更新）
 * POST /v3/product/import
 * @param {Object} client - axios 客户端
 * @param {Object} item - 商品数据
 * @param {string} item.name - 商品名称
 * @param {string} item.offer_id - 卖家SKU
 * @param {string} item.price - 当前价格（字符串，如 "1990"）
 * @param {string} item.old_price - 原价（可选）
 * @param {string} item.currency_code - 货币代码（默认 "RUB"）
 * @param {string} item.vat - 增值税率（默认 "0"）
 * @param {number} item.description_category_id - 类别ID
 * @param {Array} item.images - 图片URL数组
 * @param {string} item.primary_image - 主图URL（可选）
 * @param {Array} item.attributes - 商品属性数组
 * @param {number} item.weight - 重量
 * @param {string} item.weight_unit - 重量单位（默认 "g"）
 * @param {number} item.height - 高度
 * @param {number} item.width - 宽度
 * @param {number} item.depth - 深度
 * @param {string} item.dimension_unit - 尺寸单位（默认 "mm"）
 */
export const importProduct = async (client, item) => {
  const payload = {
    items: [{
      name: item.name,
      offer_id: item.offer_id,
      price: String(item.price),
      old_price: item.old_price ? String(item.old_price) : undefined,
      currency_code: item.currency_code || 'RUB',
      vat: item.vat || '0',
      description_category_id: item.description_category_id,
      type_id: item.type_id,
      barcode: item.barcode,
      images: item.images || [],
      primary_image: item.primary_image || '',
      images360: item.images360 || [],
      color_image: item.color_image || '',
      attributes: item.attributes || [],
      complex_attributes: item.complex_attributes || [],
      weight: item.weight || 100,
      weight_unit: item.weight_unit || 'g',
      height: item.height || 100,
      width: item.width || 100,
      depth: item.depth || 100,
      dimension_unit: item.dimension_unit || 'mm',
      pdf_list: item.pdf_list || [],
    }],
  };

  // 清理 undefined 字段
  Object.keys(payload.items[0]).forEach(key => {
    if (payload.items[0][key] === undefined) {
      delete payload.items[0][key];
    }
  });

  const response = await client.post('/v3/product/import', payload);
  return response.data;
};

/**
 * 上传商品图片
 * POST /v1/product/import/pictures
 * @param {Object} client - axios 客户端
 * @param {Array} images - 图片URL数组
 */
export const importPictures = async (client, images) => {
  const response = await client.post('/v1/product/import/pictures', {
    images: images.map(url => ({ url })),
  });
  return response.data;
};

/**
 * 查询商品导入状态
 * POST /v1/product/import/info
 * @param {Object} client - axios 客户端
 * @param {number} taskId - 导入任务ID
 */
export const getImportInfo = async (client, taskId) => {
  const response = await client.post('/v1/product/import/info', {
    task_id: taskId,
  });
  return response.data;
};

/**
 * 获取商品类目列表
 * POST /v3/category/tree
 * @param {Object} client - axios 客户端
 * @param {number} categoryId - 父类目ID（0为根类目）
 * @param {string} language - 语言（默认 "ru"）
 */
export const getCategoryTree = async (client, categoryId = 0, language = 'ru') => {
  const response = await client.post('/v3/category/tree', {
    category_id: categoryId,
    language,
  });
  return response.data;
};

/**
 * 获取类目属性
 * POST /v3/category/attribute
 * @param {Object} client - axios 客户端
 * @param {Array} categoryIds - 类目ID数组
 * @param {string} language - 语言（默认 "ru"）
 */
export const getCategoryAttributes = async (client, categoryIds, language = 'ru') => {
  const response = await client.post('/v3/category/attribute', {
    category_id: categoryIds,
    language,
  });
  return response.data;
};

/**
 * 更新商品价格
 * POST /v1/product/update/prices
 * @param {Object} client - axios 客户端
 * @param {Array} prices - 价格更新数组 [{ offer_id, price, old_price, currency_code }]
 */
export const updatePrices = async (client, prices) => {
  const response = await client.post('/v1/product/update/prices', {
    prices: prices.map(p => ({
      offer_id: p.offer_id,
      price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : undefined,
      currency_code: p.currency_code || 'RUB',
    })),
  });
  return response.data;
};

/**
 * 更新商品库存
 * POST /v2/products/stocks
 * @param {Object} client - axios 客户端
 * @param {Array} stocks - 库存更新数组 [{ offer_id, stock }]
 */
export const updateStocks = async (client, stocks) => {
  const response = await client.post('/v2/products/stocks', {
    stocks: stocks.map(s => ({
      offer_id: s.offer_id,
      stock: s.stock,
    })),
  });
  return response.data;
};

export default {
  createOzonClient,
  getProducts,
  getProductDetails,
  getOrders,
  getOrderDetails,
  getSellerInfo,
  syncAccountData,
  importProduct,
  importPictures,
  getImportInfo,
  getCategoryTree,
  getCategoryAttributes,
  updatePrices,
  updateStocks,
};
