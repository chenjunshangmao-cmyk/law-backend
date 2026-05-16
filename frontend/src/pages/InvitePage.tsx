/**
 * InvitePage - 邀请好友赚积分
 */
import React, { useState, useEffect } from 'react';
import { Share2, Users, Coins, Copy, CheckCircle, Gift, ExternalLink, TrendingUp } from 'lucide-react';
import { authFetch } from '../services/api';

export default function InvitePage() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadInfo(); }, []);

  async function loadInfo() {
    setLoading(true);
    try {
      const res = await authFetch('/api/referral/info');
      if (res.success) setInfo(res.data);
    } catch {}
    setLoading(false);
  }

  function copyLink() {
    if (info?.inviteLink) {
      navigator.clipboard.writeText(info.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const RATE = info?.rewards?.RATE || 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-7 h-7 text-pink-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">邀请好友赚积分</h1>
            <p className="text-sm text-gray-500">分享邀请链接，好友注册双方都得积分</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : !info ? (
          <div className="text-center py-12 text-gray-400">获取邀请信息失败</div>
        ) : (
          <div className="space-y-5">
            {/* 积分卡片 */}
            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-pink-500">{info.currentPoints}</p>
                  <p className="text-xs text-gray-500 mt-1">当前积分</p>
                  <p className="text-[10px] text-gray-400">≈ ¥{(info.currentPoints / RATE).toFixed(2)}</p>
                </div>
                <div className="border-l border-r border-gray-100">
                  <p className="text-3xl font-bold text-indigo-500">{info.totalInvites}</p>
                  <p className="text-xs text-gray-500 mt-1">已邀请</p>
                  <p className="text-[10px] text-gray-400">已过期{info.expiredPoints || 0}笔</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-500">{info.totalEarned}</p>
                  <p className="text-xs text-gray-500 mt-1">累计获得积分</p>
                </div>
              </div>
            </div>

            {/* 邀请规则 */}
            <div className="bg-white rounded-2xl p-5 border shadow-sm">
              <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-500" />
                邀请规则
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">1</div>
                  <span>分享你的专属邀请链接给好友</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</div>
                  <span>好友通过链接注册 → 你得 <strong className="text-pink-600">+{info.rewards?.INVITER_BONUS || 100}积分</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</div>
                  <span>好友注册成功也得 <strong className="text-indigo-600">+{info.rewards?.INVITEE_BONUS || 50}积分</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</div>
                  <span>积分可抵扣会员套餐：<strong className="text-emerald-600">{RATE}积分 = ¥1</strong></span>
                </div>
                <div className="text-xs text-gray-400 mt-2">每日最多邀请{info.rewards?.MAX_DAILY_INVITES || 50}人</div>
              </div>
              <div className="mt-3 pt-2 border-t text-xs text-amber-600">
                ⏰ 积分有效期为5个月，过期自动清零。
                {info.pointsExpireAt && <span>最早一批将于 {new Date(info.pointsExpireAt).toLocaleDateString('zh-CN')} 过期</span>}
              </div>
            </div>

            {/* 邀请链接 */}
            <div className="bg-white rounded-2xl p-5 border shadow-sm">
              <h2 className="font-bold text-gray-700 mb-3">🔗 你的专属邀请链接</h2>
              <div className="flex gap-2">
                <input readOnly value={info.inviteLink}
                  className="flex-1 p-2.5 border rounded-lg text-xs bg-gray-50 text-gray-600" />
                <button onClick={copyLink}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-1 text-sm">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">发送此链接给好友，好友注册后双方都得积分</p>
            </div>

            {/* 最近邀请 */}
            {info.recentReferrals?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border shadow-sm">
                <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  最近邀请（{info.recentReferrals.length}条）
                </h2>
                <div className="space-y-2">
                  {info.recentReferrals.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                      <span className="text-gray-600">{r.email}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{r.createdAt?.split('T')[0]}</span>
                        <span className="text-xs text-green-600 font-medium">+{r.bonus}积分</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 积分排行榜 */}
            <button onClick={() => authFetch('/api/referral/leaderboard').then(r => {
              if (r.success) alert('排行榜：\n' + r.data.leaderboard.map((l: any) => `#${l.rank} ${l.points}分`).join('\n'));
            })}
              className="w-full py-2.5 border rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">
              🏆 查看积分排行榜
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
