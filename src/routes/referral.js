/**
 * Referral System - 会员邀请/积分系统
 * - 会员生成专属邀请链接
 * - 好友通过链接注册，邀请人得积分
 * - 积分可抵扣会员套餐
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool, { useMemoryMode, memoryStore } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/referral_data.json');

// 奖励配置
const REWARDS = {
  INVITER_BONUS: 1000,   // 邀请人得1000积分
  INVITEE_BONUS: 500,    // 被邀请人得500积分
  RATE: 100,             // 100积分=1元（1000分=10元）
  MAX_DAILY_INVITES: 50, // 每天最多50次
  EXPIRY_MONTHS: 5,      // 积分5个月过期
};

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ referrals: [], points: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { referrals: [], points: {} }; }
}

function saveData(d) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// ========================================
// 1. 获取当前用户的邀请信息
// GET /api/referral/info
// ========================================
router.get('/info', authenticateToken, async (req, res) => {
  const data = readData();
  const userId = req.userId;

  // 我的邀请记录
  const myReferrals = (data.referrals || []).filter(r => r.inviterId === userId);
  const totalInvites = myReferrals.length;
  const totalEarned = totalInvites * REWARDS.INVITER_BONUS;

  // ===== 积分过期检查 =====
  const now = new Date();
  const records = data.pointRecords?.[userId] || [];
  const validRecords = records.filter(r => new Date(r.expiresAt) > now);
  const expiredCount = records.length - validRecords.length;
  const validPoints = validRecords.reduce((s, r) => s + (r.amount || 0), 0);
  // 如果有过期积分，更新存储
  if (expiredCount > 0) {
    data.points[userId] = validPoints;
    data.pointRecords[userId] = validRecords;
    saveData(data);
  }
  const currentPoints = data.points[userId] || 0;
  const earliestExpiry = validRecords.length > 0
    ? validRecords.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))[0].expiresAt
    : null;

  // 专属邀请链接
  const inviteCode = Buffer.from(userId).toString('base64').slice(0, 12);
  const inviteLink = `${req.protocol}://${req.get('host')}/register?ref=${inviteCode}`;

  res.json({
    success: true,
    data: {
      inviteCode,
      inviteLink,
      totalInvites,
      totalEarned,
      currentPoints,
      expiredPoints: expiredCount,
      pointsExpireAt: earliestExpiry,
      pointsNote: `积分有效期为${REWARDS.EXPIRY_MONTHS}个月，过期自动清零`,
      rewards: REWARDS,
      recentReferrals: myReferrals.slice(-10).reverse().map(r => ({
        email: r.inviteeEmail || '已注册用户',
        createdAt: r.createdAt,
        bonus: REWARDS.INVITER_BONUS,
      })),
    }
  });
});

// ========================================
// 2. 通过邀请链接注册（注册时调用）
// POST /api/referral/register
// ========================================
router.post('/register', async (req, res) => {
  try {
    const { inviteCode, newUserId, newUserEmail } = req.body;
    if (!inviteCode || !newUserId) return res.status(400).json({ success: false, error: '参数不全' });

    // 解析邀请码
    const inviterId = Buffer.from(inviteCode + '==', 'base64').toString('utf-8');
    if (!inviterId) return res.json({ success: false, error: '无效邀请码' });

    const data = readData();

    // 检查每日限制
    const today = new Date().toISOString().split('T')[0];
    const todayInvites = (data.referrals || []).filter(r =>
      r.inviterId === inviterId && r.createdAt?.startsWith(today)
    );
    if (todayInvites.length >= REWARDS.MAX_DAILY_INVITES) {
      return res.json({ success: false, error: '今日邀请已达上限' });
    }

    // 记录邀请（含过期时间）
    if (!data.referrals) data.referrals = [];
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + REWARDS.EXPIRY_MONTHS);

    data.referrals.push({
      inviterId,
      inviteeId: newUserId,
      inviteeEmail: newUserEmail || '',
      createdAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      bonusInviter: REWARDS.INVITER_BONUS,
      bonusInvitee: REWARDS.INVITEE_BONUS,
    });

    // 加积分（记录积分获得时间）
    if (!data.points) data.points = {};
    if (!data.pointRecords) data.pointRecords = {};
    
    // 邀请人加积分
    data.points[inviterId] = (data.points[inviterId] || 0) + REWARDS.INVITER_BONUS;
    if (!data.pointRecords[inviterId]) data.pointRecords[inviterId] = [];
    data.pointRecords[inviterId].push({
      amount: REWARDS.INVITER_BONUS,
      type: 'invite',
      createdAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
    });

    // 被邀请人加积分
    data.points[newUserId] = (data.points[newUserId] || 0) + REWARDS.INVITEE_BONUS;
    if (!data.pointRecords[newUserId]) data.pointRecords[newUserId] = [];
    data.pointRecords[newUserId].push({
      amount: REWARDS.INVITEE_BONUS,
      type: 'register',
      createdAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
    });

    saveData(data);

    res.json({
      success: true,
      data: {
        inviterBonus: REWARDS.INVITER_BONUS,
        inviteeBonus: REWARDS.INVITEE_BONUS,
        inviterPoints: data.points[inviterId],
        yourPoints: data.points[newUserId],
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 3. 积分转余额（抵扣会员套餐）
// POST /api/referral/convert-points
// ========================================
router.post('/convert-points', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const data = readData();
    const currentPoints = data.points[userId] || 0;

    if (currentPoints < REWARDS.RATE) {
      return res.status(400).json({ success: false, error: `积分不足，至少需要${REWARDS.RATE}积分才能兑换` });
    }

    const convertAmount = Math.floor(currentPoints / REWARDS.RATE) * REWARDS.RATE;
    const cashValue = convertAmount / REWARDS.RATE;

    // 扣除积分
    data.points[userId] = currentPoints - convertAmount;
    saveData(data);

    // TODO: 更新用户余额/赠送优惠券
    res.json({
      success: true,
      data: {
        pointsUsed: convertAmount,
        cashValue: cashValue.toFixed(2),
        remainingPoints: data.points[userId],
        note: `${cashValue.toFixed(2)}元已存入账户，可在购买会员时使用`
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 4. 积分排行榜（可选）
// GET /api/referral/leaderboard
// ========================================
router.get('/leaderboard', async (req, res) => {
  const data = readData();
  const leaderboard = Object.entries(data.points || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, points], index) => ({
      rank: index + 1,
      userId: userId.substring(0, 12) + '...',
      points,
    }));

  res.json({ success: true, data: { leaderboard } });
});

export default router;
