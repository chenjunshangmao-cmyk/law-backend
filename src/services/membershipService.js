/**
 * 会员服务
 * 自动激活会员、到期检查降级
 */
import { pool } from '../config/database.js';

// 套餐有效期配置（天）
const DURATION_DAYS = 30;

// 套餐层级（用于降级排序）
const PLAN_RANK = { flagship: 4, enterprise: 3, premium: 2, basic: 1, free: 0 };

/**
 * 根据付费订单激活/续费会员
 * 在支付回调中自动调用
 */
export async function activateMembership(userId) {
  if (!userId) return { success: false, error: '缺少userId' };

  try {
    // 确保 paid_until 字段存在
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMP`);
    } catch (_) {}

    // 查询用户所有已支付订单
    const paidOrders = await pool.query(
      `SELECT order_no, plan_type, plan_name, amount, paid_at
       FROM payment_orders
       WHERE user_id = $1 AND status = 'paid'
       ORDER BY paid_at DESC`,
      [String(userId)]
    );

    if (paidOrders.rows.length === 0) {
      return { success: true, activated: false, plan: 'free', reason: '无付款记录' };
    }

    // 取最新订单激活
    const latestOrder = paidOrders.rows[0];
    const paidAt = new Date(latestOrder.paid_at);
    const paidUntil = new Date(paidAt.getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000);

    // 开关控制：哪些套餐可以激活
    const enabledPlans = ['basic', 'premium', 'enterprise', 'flagship'];
    const plan = enabledPlans.includes(latestOrder.plan_type) ? latestOrder.plan_type : 'free';

    await pool.query(
      `UPDATE users SET
        membership_type = $1,
        membership_expires_at = $2,
        paid_until = $2,
        updated_at = NOW()
       WHERE id::text = $3`,
      [plan, paidUntil, String(userId)]
    );

    console.log(`[会员] ✅ 用户 ${userId} 自动激活: ${plan}，到期: ${paidUntil.toISOString()}`);

    return {
      success: true,
      activated: true,
      plan,
      paidUntil: paidUntil.toISOString(),
      lastOrder: {
        orderNo: latestOrder.order_no,
        planType: latestOrder.plan_type,
        planName: latestOrder.plan_name,
        amount: latestOrder.amount,
        paidAt: latestOrder.paid_at
      }
    };
  } catch (error) {
    console.error('[会员] 激活失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 检查并降级到期会员
 * 遍历所有 paid_until < NOW() 的付费会员，降级为 free
 * 返回本次降级的人数
 */
export async function checkAndDowngradeExpired() {
  try {
    // 确保 paid_until 字段存在
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMP`);
    } catch (_) {}

    // 查找所有已到期或即将到期的付费会员（已过期的 + 未来1分钟内过期的）
    const expiredUsers = await pool.query(
      `SELECT id, email, membership_type, membership_expires_at, paid_until
       FROM users
       WHERE membership_type != 'free'
         AND paid_until IS NOT NULL
         AND paid_until < NOW() + INTERVAL '1 minute'`
    );

    if (expiredUsers.rows.length === 0) {
      return { downgraded: 0, total: 0 };
    }

    const userIds = expiredUsers.rows.map(r => r.id);
    console.log(`[会员] 发现 ${userIds.length} 个到期会员:`, userIds.map(id => id.substring(0, 8) + '...').join(', '));

    // 批量降级
    await pool.query(
      `UPDATE users
       SET membership_type = 'free',
           membership_expires_at = NULL,
           updated_at = NOW()
       WHERE membership_type != 'free'
         AND paid_until IS NOT NULL
         AND paid_until < NOW() + INTERVAL '1 minute'`
    );

    console.log(`[会员] 🔻 已将 ${expiredUsers.rows.length} 个到期会员降级为 free`);

    for (const user of expiredUsers.rows) {
      console.log(`[会员] 🔻 ${user.email || user.id}(${user.membership_type}) → free（到期）`);
    }

    return {
      downgraded: expiredUsers.rows.length,
      users: expiredUsers.rows.map(u => ({
        id: u.id,
        email: u.email,
        oldPlan: u.membership_type,
        paidUntil: u.paid_until
      }))
    };
  } catch (error) {
    console.error('[会员] 到期检查失败:', error.message);
    return { downgraded: 0, error: error.message };
  }
}

/**
 * 获取用户当前会员状态（供AI客服查询）
 */
export async function getMembershipStatus(userId) {
  if (!userId) return { plan: 'free', expired: false };

  try {
    const result = await pool.query(
      `SELECT membership_type, membership_expires_at, paid_until
       FROM users WHERE id::text = $1`,
      [String(userId)]
    );

    if (result.rows.length === 0) return { plan: 'free', expired: false };

    const user = result.rows[0];
    const paidUntil = user.paid_until || user.membership_expires_at;
    const now = new Date();
    const expired = paidUntil ? new Date(paidUntil) < now : true;

    return {
      plan: user.membership_type || 'free',
      paidUntil: paidUntil?.toISOString() || null,
      expired,
      daysLeft: paidUntil ? Math.max(0, Math.floor((new Date(paidUntil) - now) / (24 * 60 * 60 * 1000))) : 0
    };
  } catch (error) {
    console.error('[会员] 查询状态失败:', error.message);
    return { plan: 'free', expired: false };
  }
}
