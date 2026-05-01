/**
 * 临时管理员直接操作路由（不需要JWT，用专属 admin-key 验证）
 * ⚠️ 仅用于临时数据操作，完成后请删除此文件和路由注册
 */
import express from 'express';
import { createAccount, getAccountsByUser, findUserByEmail } from '../services/dbService.js';

const router = express.Router();

// 临时 admin key（仅限本次使用）
const TEMP_ADMIN_KEY = 'claw-temp-admin-2026-ozon-bind';

function checkAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== TEMP_ADMIN_KEY) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
}

/**
 * POST /api/admin-direct/add-ozon-account
 * 直接向数据库添加 OZON 账号（不需要JWT）
 * Body: { userEmail, name, clientId, apiKey }
 */
router.post('/add-ozon-account', checkAdminKey, async (req, res) => {
  try {
    const { userEmail, name, clientId, apiKey } = req.body;
    if (!userEmail || !name || !clientId || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }

    // 查找用户
    const user = await findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: `用户不存在: ${userEmail}` });
    }

    console.log(`[admin-direct] 用户找到: ${user.email} (id: ${user.id})`);

    // 创建 OZON 账号
    const accountData = {
      clientId,
      apiKey,
      platform: 'ozon',
      authMethod: 'api',
      lastAuthCheck: new Date().toISOString(),
      addedBy: 'admin-direct',
      status: 'active',
    };

    const newAccount = await createAccount({
      user_id: user.id,
      platform: 'ozon',
      account_name: name,
      account_data: accountData,
    });

    if (!newAccount) {
      return res.status(500).json({ success: false, error: '创建账号失败' });
    }

    console.log(`[admin-direct] ✅ OZON账号已创建: ${newAccount.id} - ${name} for ${userEmail}`);

    res.status(201).json({
      success: true,
      message: `OZON账号「${name}」已成功绑定到 ${userEmail}`,
      data: {
        accountId: newAccount.id,
        name,
        clientId,
        userEmail,
      },
    });
  } catch (error) {
    console.error('[admin-direct] 创建账号失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin-direct/list-accounts?email=xxx
 * 查看指定用户的所有账号
 */
router.get('/list-accounts', checkAdminKey, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: '缺少 email 参数' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, error: `用户不存在: ${email}` });

    const accounts = await getAccountsByUser(user.id);
    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        platform: a.platform,
        clientId: a.account_data?.clientId,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
