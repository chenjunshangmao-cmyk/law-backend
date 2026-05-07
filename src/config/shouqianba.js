/**
 * 收钱吧配置
 * 敏感凭证不提交到 Git！
 * 2026-05-07：正式激活码 64307934 → 终端 claw-pay-prod-0507 ✅
 */

const config = {
  // API地址
  apiBase: 'https://vsi-api.shouqianba.com',

  // 开发者参数（测试+正式通用）
  vendorSn: process.env.SHOUQIANBA_VENDOR_SN || '91803325',
  vendorKey: process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2',
  appId: process.env.SHOUQIANBA_APP_ID || '2026041600011122',

  // 正式终端（2026-05-07 用64307934激活）
  defaultDeviceId: 'claw-pay-prod-0507',

  // 正式激活码
  prodCode: '64307934',

  storeDevices: {
    'claw-pay-prod-0507': {
      code: '64307934',
      storeSn: '1580000011101653',
      terminalSn: '100111220054832254',
      terminalKey: 'b68483ae92623c03d5c41d5b40931209'
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;
