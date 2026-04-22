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

  // 主设备ID（claw-web-new1/new2 都已被绑定，改用全新设备）
  defaultDeviceId: 'claw-web-prod-01',

  // 激活码（⚠️ 明天联系客户经理获取新码，设备ID: claw-web-prod-01）
  testCode: 'PLACEHOLDER',

  storeDevices: {
    'claw-web-prod-01': {
      code: 'PLACEHOLDER',  // ⚠️ 待客户经理提供新码
      merchantId: null,
      storeSn: null
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;
