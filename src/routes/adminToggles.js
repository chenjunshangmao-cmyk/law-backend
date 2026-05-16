/**
 * 会员开关管理 API
 * 
 * 简化设计：5个档位开关，开=可用，关=不可用
 * AI 巡查到付款后，调用此 API 开关
 * 
 * 档位：
 * 1. free     - 免费体验（默认开启）
 * 2. basic    - 基础版 ¥199/月
 * 3. premium  - 专业版 ¥499/月
 * 4. enterprise - 企业版 ¥1599/月
 * 5. flagship - 旗舰版 ¥5888/月
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const TOGGLES_FILE = path.join(__dirname, '../../data/membership_toggles.json');

// 默认开关状态
const DEFAULT_TOGGLES = {
  free: true,
  basic: false,
  premium: false,
  enterprise: false,
  flagship: false,
};

// 管理员操作日志
const LOG_FILE = path.join(__dirname, '../../data/toggle_logs.json');
function appendLog(entry) {
  try {
    let logs = [];
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8') || '[]'); } catch { logs = []; }
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    if (logs.length > 200) logs = logs.slice(-200);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch {}
}

function readToggles() {
  try {
    if (fs.existsSync(TOGGLES_FILE)) {
      return JSON.parse(fs.readFileSync(TOGGLES_FILE, 'utf-8'));
    }
  } catch {}
  return { ...DEFAULT_TOGGLES };
}

function saveToggles(toggles) {
  const dir = path.dirname(TOGGLES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TOGGLES_FILE, JSON.stringify(toggles, null, 2));
}

/**
 * 获取用户的实际会员等级（读开关）
 * 如果用户的 plan 开关已关，降级到下一个可用档位
 */
export function getEffectivePlan(userPlan) {
  const toggles = readToggles();
  if (toggles[userPlan]) return userPlan;
  
  // 从高到低找第一个开启的
  const order = ['free', 'basic', 'premium', 'enterprise', 'flagship'];
  for (const p of order) {
    if (toggles[p]) return p;
  }
  return 'free';
}

/**
 * GET /api/admin/toggles
 * 获取所有开关状态（管理员）
 */
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
  const toggles = readToggles();
  res.json({ success: true, data: toggles });
});

/**
 * GET /api/admin/toggles/public
 * 公开接口：获取开关状态（供 AI 调用，无需认证）
 */
router.get('/public', (req, res) => {
  const toggles = readToggles();
  res.json({ success: true, data: toggles });
});

/**
 * PUT /api/admin/toggles/:plan
 * 管理员：开/关某个档位
 * body: { enabled: true/false }
 */
router.put('/:plan', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
  const { plan } = req.params;
  const { enabled } = req.body;

  if (!DEFAULT_TOGGLES.hasOwnProperty(plan)) {
    return res.status(400).json({ success: false, error: `无效档位: ${plan}，可用: ${Object.keys(DEFAULT_TOGGLES).join(', ')}` });
  }
  if (enabled === undefined || typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: '需要 enabled 参数（布尔值）' });
  }

  const toggles = readToggles();
  toggles[plan] = enabled;
  saveToggles(toggles);

  appendLog({ action: enabled ? '开启' : '关闭', plan, operator: req.userId });

  res.json({ success: true, data: toggles });
});

/**
 * POST /api/admin/toggles/ai-activate
 * AI 调用：给用户激活/降级会员
 * body: { userId, plan?, expiresAt? }
 * - 如果传 plan → 直接给用户激活该档位
 * - 如果不传 plan → 根据开关状态自动计算
 */
router.post('/ai-activate', async (req, res) => {
  try {
    const { userId, plan, expiresAt } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: '缺少 userId' });

    const toggles = readToggles();
    const { readData, writeData } = await import('../services/dataStore.js');
    const users = readData('users') || [];
    const idx = users.findIndex(u => u.id === userId);

    if (idx < 0) return res.json({ success: false, error: '用户不存在' });

    const targetPlan = plan || 'free';

    // 检查开关是否开启
    if (!toggles[targetPlan]) {
      return res.json({ success: false, error: `档位 ${targetPlan} 未开启`, toggles });
    }

    const graceHours = 12;
    const now = Date.now();
    const expiry = expiresAt || (now + 30 * 24 * 60 * 60 * 1000);

    users[idx].plan = targetPlan;
    users[idx].expiresAt = expiry;
    users[idx].updatedAt = new Date().toISOString();
    writeData('users', users);

    appendLog({ action: 'AI激活', plan: targetPlan, userId, operator: 'AI' });

    console.log(`[AI开关] ✅ ${userId} → ${targetPlan}，到期: ${new Date(expiry).toLocaleString()}`);

    res.json({
      success: true,
      data: {
        userId,
        plan: targetPlan,
        expiresAt: expiry,
        toggleEnabled: toggles[targetPlan],
        graceHours,
      }
    });
  } catch (error) {
    console.error('[AI开关] 激活失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/toggles/ai-check
 * AI 调用：巡查所有会员，处理到期降级
 * 
 * 逻辑：
 * - 遍历所有有 plan 且 expiresAt 的用户
 * - 如果超过 expireAt + 12h，开关已关，降级为 free
 */
router.post('/ai-check', async (req, res) => {
  try {
    const { readData, writeData } = await import('../services/dataStore.js');
    const users = readData('users') || [];
    const toggles = readToggles();

    const now = Date.now();
    const GRACE_MS = 12 * 60 * 60 * 1000;
    const changes = [];

    for (const u of users) {
      if (!u.plan || u.plan === 'free') continue;
      if (!u.expiresAt) continue;

      const isExpired = now > (u.expiresAt + GRACE_MS);

      if (isExpired || !toggles[u.plan]) {
        const oldPlan = u.plan;
        u.plan = 'free';
        delete u.expiresAt;
        changes.push({ userId: u.id, oldPlan, reason: isExpired ? '到期' : '开关关闭' });
      }
    }

    if (changes.length > 0) {
      writeData('users', users);
      changes.forEach(c => appendLog({ action: 'AI降级', plan: c.oldPlan, userId: c.userId, reason: c.reason, operator: 'AI' }));
    }

    console.log(`[AI开关] 🔍 巡查完成: ${users.length}人，降级 ${changes.length}人`);

    res.json({ success: true, data: { total: users.length, demoted: changes.length, changes } });
  } catch (error) {
    console.error('[AI开关] 巡查失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/toggles/logs
 * 获取操作日志
 */
router.get('/logs', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
  try {
    let logs = [];
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8') || '[]'); } catch {}
    res.json({ success: true, data: logs.slice(-50).reverse() });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export default router;
