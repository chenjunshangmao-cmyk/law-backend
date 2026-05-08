/**
 * ProxyPool.js — 海外推流代理节点池管理 v1.0
 * 
 * 功能：
 * - 代理节点池管理（CRUD + 健康检查）
 * - 客户代理订阅管理（激活/续费/到期）
 * - 智能路由分配（按区域负载均衡）
 * - 代理流量统计
 * 
 * 套餐定义（独立附加服务，不绑会员）：
 * | 套餐 | 月费 | 区域 | 时长 | 并发平台 | IP类型 |
 * | 入门 | ¥299 | 1个 | 120h | 1个 | 共享 |
 * | 标准 | ¥599 | 3个 | 300h | 2个 | 共享 |
 * | 专业 | ¥1,199 | 5个 | 600h | 3个 | 半独享 |
 * | 企业 | ¥2,499 | 全部 | 不限 | 5个 | 独享 |
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import pool from '../config/database.js';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 区域定义
const REGIONS = {
  hongkong:   { name: '🇭🇰 香港', code: 'HK' },
  taiwan:     { name: '🇹🇼 台湾', code: 'TW' },
  singapore:  { name: '🇸🇬 新加坡', code: 'SG' },
  japan:      { name: '🇯🇵 日本', code: 'JP' },
  usa:        { name: '🇺🇸 美国', code: 'US' },
  uk:         { name: '🇬🇧 英国', code: 'UK' },
  germany:    { name: '🇩🇪 德国', code: 'DE' },
};

// 代理套餐定义
const PROXY_PLANS = {
  starter: {
    id: 'starter',
    name: '🥉 入门代理',
    price: 29900,         // 分（¥299）
    regions: 1,
    monthlyHours: 120,
    concurrentPlatforms: 1,
    maxBitrate: '6000k',
    maxResolution: '1920x1080',
    ipType: 'shared',
    sla: '99.0%',
    support: 'ticket',
    customRules: false,
    features: [
      '1个区域可选',
      '120小时/月直播时长',
      '同时推流1个平台',
      '1080p画质',
      '共享纯净IP',
      '99% SLA保障',
      '工单支持',
    ],
  },
  standard: {
    id: 'standard',
    name: '🥈 标准代理',
    price: 59900,
    regions: 3,
    monthlyHours: 300,
    concurrentPlatforms: 2,
    maxBitrate: '8000k',
    maxResolution: '1920x1080',
    ipType: 'shared',
    sla: '99.5%',
    support: 'ticket_qq',
    customRules: false,
    features: [
      '3个区域可选',
      '300小时/月直播时长',
      '同时推流2个平台',
      '1080p画质',
      '共享纯净IP',
      '99.5% SLA保障',
      '工单+QQ支持',
    ],
  },
  professional: {
    id: 'professional',
    name: '🥇 专业代理',
    price: 119900,
    regions: 5,
    monthlyHours: 600,
    concurrentPlatforms: 3,
    maxBitrate: '12000k',
    maxResolution: '3840x2160',
    ipType: 'semi_dedicated',
    sla: '99.9%',
    support: 'priority',
    customRules: true,
    features: [
      '5个区域可选',
      '600小时/月直播时长',
      '同时推流3个平台',
      '4K画质',
      '半独享IP',
      '99.9% SLA保障',
      '优先响应',
      '自定义代理规则',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: '💎 企业代理',
    price: 249900,
    regions: 99,          // 全部
    monthlyHours: -1,     // 不限
    concurrentPlatforms: 5,
    maxBitrate: '20000k',
    maxResolution: '3840x2160',
    ipType: 'dedicated',
    sla: '99.95%',
    support: '24x7',
    customRules: true,
    features: [
      '全部7+区域可选',
      '直播时长不限',
      '同时推流5个平台',
      '4K画质',
      '独享IP',
      '99.95% SLA保障',
      '7×24专属支持',
      '自定义代理规则',
    ],
  },
};

class ProxyPool extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map();     // 节点缓存：region -> [nodes]
    this.subscriptions = new Map(); // 订阅缓存：userId -> subscription
    this.initialized = false;
  }

  /**
   * 初始化：加载节点 + 创建表
   */
  async init() {
    if (this.initialized) return;
    
    try {
      await this._ensureTables();
      await this._loadNodes();
      this.initialized = true;
      console.log('[ProxyPool] ✅ 代理池初始化完成');
    } catch (e) {
      console.error('[ProxyPool] 初始化失败:', e.message);
    }
  }

  /**
   * 确保数据库表存在
   */
  async _ensureTables() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS proxy_nodes (
          id SERIAL PRIMARY KEY,
          region VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          username VARCHAR(100),
          password VARCHAR(100),
          protocol VARCHAR(10) DEFAULT 'socks5',
          max_streams INTEGER DEFAULT 8,
          active_streams INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          load_score REAL DEFAULT 0,
          last_check TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS proxy_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          plan_id VARCHAR(30) NOT NULL,
          plan_name VARCHAR(100),
          amount INTEGER NOT NULL,
          currency VARCHAR(10) DEFAULT 'CNY',
          status VARCHAR(20) DEFAULT 'pending',
          selected_regions TEXT[],
          assigned_nodes TEXT[],
          hours_used REAL DEFAULT 0,
          hours_limit REAL,
          payment_method VARCHAR(30),
          payment_tx_id VARCHAR(255),
          activated_at TIMESTAMP,
          expires_at TIMESTAMP,
          auto_renew BOOLEAN DEFAULT false,
          discount_applied REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS proxy_usage_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          order_id INTEGER,
          node_id INTEGER,
          region VARCHAR(20),
          platform VARCHAR(30),
          duration_secs REAL DEFAULT 0,
          bytes_sent BIGINT DEFAULT 0,
          started_at TIMESTAMP,
          ended_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('[ProxyPool] 📊 数据库表就绪');
    } catch (e) {
      console.error('[ProxyPool] 建表失败:', e.message);
    }
  }

  /**
   * 从数据库加载节点
   */
  async _loadNodes() {
    try {
      const result = await pool.query(
        "SELECT * FROM proxy_nodes WHERE status = 'active'"
      );
      this.nodes.clear();
      for (const row of result.rows) {
        if (!this.nodes.has(row.region)) {
          this.nodes.set(row.region, []);
        }
        this.nodes.get(row.region).push(row);
      }
      console.log(`[ProxyPool] 加载 ${result.rows.length} 个活跃节点`);
    } catch (e) {
      console.warn('[ProxyPool] 节点加载失败:', e.message);
    }
  }

  // ═══════════════════════════════════════════
  //  节点管理
  // ═══════════════════════════════════════════

  /**
   * 添加代理节点
   */
  async addNode(nodeData) {
    const { region, name, host, port, username, password, protocol = 'socks5', maxStreams = 8 } = nodeData;
    
    const result = await pool.query(
      `INSERT INTO proxy_nodes (region, name, host, port, username, password, protocol, max_streams, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING *`,
      [region, name, host, port, username, password, protocol, maxStreams]
    );

    const node = result.rows[0];
    if (!this.nodes.has(region)) this.nodes.set(region, []);
    this.nodes.get(region).push(node);

    this.emit('node-added', node);
    return node;
  }

  /**
   * 移除节点
   */
  async removeNode(nodeId) {
    await pool.query("UPDATE proxy_nodes SET status='disabled' WHERE id=$1", [nodeId]);
    
    // 从缓存移除
    for (const [region, nodes] of this.nodes) {
      const idx = nodes.findIndex(n => n.id === nodeId);
      if (idx >= 0) {
        nodes.splice(idx, 1);
        break;
      }
    }
    this.emit('node-removed', { id: nodeId });
  }

  /**
   * 获取所有节点状态
   */
  async getNodes() {
    try {
      const result = await pool.query(
        "SELECT * FROM proxy_nodes WHERE status != 'deleted' ORDER BY region, load_score"
      );
      return result.rows;
    } catch (e) {
      return [];
    }
  }

  /**
   * 节点健康检查
   */
  async healthCheck(nodeId) {
    // TODO: 实际TCP连接检测
    try {
      const result = await pool.query(
        "UPDATE proxy_nodes SET last_check=NOW() WHERE id=$1 RETURNING *",
        [nodeId]
      );
      return { success: true, node: result.rows[0] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ═══════════════════════════════════════════
  //  智能路由
  // ═══════════════════════════════════════════

  /**
   * 为指定区域选择最佳节点（负载均衡）
   */
  selectNode(region) {
    const nodes = this.nodes.get(region);
    if (!nodes || nodes.length === 0) return null;

    // 按负载排序，选最空闲的
    const sorted = [...nodes].sort((a, b) => 
      (a.load_score || 0) - (b.load_score || 0)
    );
    return sorted[0];
  }

  /**
   * 获取可用的区域列表（有活跃节点的）
   */
  getAvailableRegions() {
    const regions = [];
    for (const [key, info] of Object.entries(REGIONS)) {
      const nodes = this.nodes.get(key) || [];
      const availableNodes = nodes.filter(n => n.status === 'active');
      regions.push({
        id: key,
        ...info,
        nodeCount: availableNodes.length,
        available: availableNodes.length > 0,
        loadLevel: availableNodes.length > 0 
          ? Math.min(1, availableNodes.reduce((s, n) => s + (n.load_score || 0), 0) / availableNodes.length)
          : 1,
      });
    }
    return regions;
  }

  // ═══════════════════════════════════════════
  //  订阅管理
  // ═══════════════════════════════════════════

  /**
   * 获取所有套餐
   */
  getPlans() {
    return PROXY_PLANS;
  }

  /**
   * 获取单个套餐
   */
  getPlan(planId) {
    return PROXY_PLANS[planId] || null;
  }

  /**
   * 创建代理订阅订单
   */
  async createOrder(userId, planId, options = {}) {
    const plan = PROXY_PLANS[planId];
    if (!plan) throw new Error(`无效的套餐: ${planId}`);

    const { 
      selectedRegions = ['hongkong'],
      paymentMethod = 'shouqianba',
      discount = 0,
      durationMonths = 1,
    } = options;

    // 计算费用
    const baseAmount = plan.price * durationMonths;
    const discountAmount = Math.round(baseAmount * discount);
    const amount = baseAmount - discountAmount;

    // 计算到期时间
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const result = await pool.query(
      `INSERT INTO proxy_orders 
       (user_id, plan_id, plan_name, amount, currency, status, selected_regions, 
        hours_limit, payment_method, discount_applied, expires_at)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10) RETURNING *`,
      [userId, planId, plan.name, amount, 'CNY',
       `{${selectedRegions.join(',')}}`,
       plan.monthlyHours > 0 ? plan.monthlyHours * durationMonths : null,
       paymentMethod, discount, expiresAt.toISOString()]
    );

    const order = result.rows[0];
    this.emit('order-created', order);
    return order;
  }

  /**
   * 激活订阅（支付完成后调用）
   */
  async activateOrder(orderId, paymentTxId = null) {
    const now = new Date();
    const result = await pool.query(
      `UPDATE proxy_orders SET 
        status='active', 
        payment_tx_id=COALESCE($2, payment_tx_id),
        activated_at=COALESCE(activated_at, $3),
        updated_at=$3
       WHERE id=$1 AND status='pending' RETURNING *`,
      [orderId, paymentTxId, now.toISOString()]
    );

    if (result.rows.length === 0) {
      throw new Error('订单不存在或已激活');
    }

    const order = result.rows[0];
    
    // 分配节点
    const selectedRegions = order.selected_regions || [];
    const assignedNodes = [];
    for (const region of selectedRegions) {
      const node = this.selectNode(region);
      if (node) {
        assignedNodes.push(String(node.id));
        // 增加节点负载计数
        await pool.query(
          "UPDATE proxy_nodes SET active_streams=active_streams+1, updated_at=NOW() WHERE id=$1",
          [node.id]
        );
      }
    }

    if (assignedNodes.length > 0) {
      await pool.query(
        "UPDATE proxy_orders SET assigned_nodes=$1, updated_at=NOW() WHERE id=$2",
        [`{${assignedNodes.join(',')}}`, orderId]
      );
      order.assigned_nodes = assignedNodes;
    }

    this.emit('order-activated', order);
    return order;
  }

  /**
   * 获取用户的活跃代理订阅
   */
  async getActiveSubscription(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM proxy_orders 
         WHERE user_id=$1 AND status='active' AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (result.rows[0]) {
        return this._enrichSubscription(result.rows[0]);
      }
      return null;
    } catch (e) {
      console.warn('[ProxyPool] 查询订阅失败:', e.message);
      return null;
    }
  }

  /**
   * 获取用户的所有代理订单
   */
  async getUserOrders(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM proxy_orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
        [userId]
      );
      return result.rows;
    } catch (e) {
      return [];
    }
  }

  /**
   * 订阅详情增强
   */
  _enrichSubscription(sub) {
    const plan = PROXY_PLANS[sub.plan_id];
    return {
      ...sub,
      plan,
      isExpired: sub.expires_at ? new Date(sub.expires_at) < new Date() : false,
      remainingHours: sub.hours_limit > 0 
        ? Math.max(0, sub.hours_limit - (sub.hours_used || 0))
        : -1, // 不限
      daysRemaining: sub.expires_at
        ? Math.max(0, Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000))
        : 0,
    };
  }

  /**
   * 记录使用时长
   */
  async logUsage(userId, orderId, nodeId, region, platform, durationSecs, bytesSent = 0) {
    try {
      await pool.query(
        `INSERT INTO proxy_usage_logs 
         (user_id, order_id, node_id, region, platform, duration_secs, bytes_sent, started_at, ended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()-$8::interval,NOW())`,
        [userId, orderId, nodeId, region, platform, durationSecs, bytesSent, `${durationSecs} seconds`]
      );

      // 更新订阅使用时长
      await pool.query(
        "UPDATE proxy_orders SET hours_used=hours_used+$1, updated_at=NOW() WHERE id=$2",
        [durationSecs / 3600, orderId]
      );
    } catch (e) {
      console.warn('[ProxyPool] 使用记录失败:', e.message);
    }
  }

  /**
   * 检查订阅是否有效
   */
  async validateSubscription(userId) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) {
      return { valid: false, reason: 'no_active_subscription' };
    }
    if (sub.isExpired) {
      return { valid: false, reason: 'expired' };
    }
    if (sub.hours_limit > 0 && sub.hours_used >= sub.hours_limit) {
      return { valid: false, reason: 'hours_exhausted' };
    }
    return { valid: true, subscription: sub };
  }

  /**
   * 获取代理配置（供RTMPPusher使用）
   */
  async getProxyConfig(userId, region, platform) {
    const validation = await this.validateSubscription(userId);
    if (!validation.valid) {
      throw new Error(`代理不可用: ${validation.reason}`);
    }

    const node = this.selectNode(region);
    if (!node) {
      throw new Error(`区域 ${region} 暂无可用节点`);
    }

    return {
      type: node.protocol || 'socks5',
      host: node.host,
      port: node.port,
      username: node.username || '',
      password: node.password || '',
      nodeId: node.id,
      region,
      platform,
    };
  }

  /**
   * 获取代理信息（供 FFmpeg 使用）
   */
  getFFmpegProxyArgs(proxyConfig) {
    if (!proxyConfig || !proxyConfig.host) return [];
    
    const { type = 'socks5', host, port, username, password } = proxyConfig;
    
    // FFmpeg 支持的代理格式
    const proxyUrl = username
      ? `${type}://${username}:${password}@${host}:${port}`
      : `${type}://${host}:${port}`;

    return [
      '-http_proxy', proxyUrl,
      '-proxy', proxyUrl,
    ];
  }

  // ═══════════════════════════════════════════
  //  统计
  // ═══════════════════════════════════════════

  async getStats() {
    try {
      const [activeOrders, totalRevenue, activeNodes] = await Promise.all([
        pool.query("SELECT COUNT(*) as cnt FROM proxy_orders WHERE status='active' AND expires_at > NOW()"),
        pool.query("SELECT COALESCE(SUM(amount),0) as total FROM proxy_orders WHERE status IN ('active','completed')"),
        pool.query("SELECT COUNT(*) as cnt FROM proxy_nodes WHERE status='active'"),
      ]);

      return {
        activeSubscriptions: parseInt(activeOrders.rows[0]?.cnt) || 0,
        totalRevenue: parseInt(totalRevenue.rows[0]?.total) || 0,
        activeNodes: parseInt(activeNodes.rows[0]?.cnt) || 0,
      };
    } catch (e) {
      return { activeSubscriptions: 0, totalRevenue: 0, activeNodes: 0 };
    }
  }

  /**
   * 获取区域列表（静态）
   */
  getRegions() {
    return Object.entries(REGIONS).map(([id, info]) => ({ id, ...info }));
  }
}

// 单例
let instance = null;
function getProxyPool() {
  if (!instance) instance = new ProxyPool();
  return instance;
}

export {
  ProxyPool,
  getProxyPool,
  PROXY_PLANS,
  REGIONS,
};
