/**
 * 收钱吧配置
 * 敏感凭证不提交到 Git！
 * 2026-04-22：claw-web-new1（终端100111220054361978）已绑定其他商户，切换到claw-web-new2
 */

const config = {
  // API地址
  apiBase: 'https://vsi-api.shouqianba.com',

  // 开发者参数（测试+正式通用）
  vendorSn: process.env.SHOUQIANBA_VENDOR_SN || '91803325',
  vendorKey: process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2',
  appId: process.env.SHOUQIANBA_APP_ID || '2026041600011122',

  // 激活码（联系收钱吧客户经理获取，每个设备只能用一次）
  // 2026-04-22：claw-web-new1 绑定冲突，切换到 claw-web-new2
  testCode: '66172491',  // ⚠️ 待替换为客户经理提供的新码

  // 统一使用 claw-web-new2 作为主终端设备ID
  defaultDeviceId: 'claw-web-new2',
  storeDevices: {
    'claw-web-new2': {
      code: '66172491',  // ⚠️ 待替换为客户经理提供的新码
      merchantId: null,  // 激活后填入
      storeSn: null
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  // 格式：{ deviceId: { terminalSn, terminalKey, activatedAt } }
  terminals: {}
};

export default config;
