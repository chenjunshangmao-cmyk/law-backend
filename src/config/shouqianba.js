/**
 * 收钱吧配置
 * 敏感凭证不提交到 Git！
 * 测试激活码有效期：2026-04-24
 */

const config = {
  // API地址
  apiBase: 'https://vsi-api.shouqianba.com',

  // 开发者参数（测试+正式通用）
  vendorSn: process.env.SHOUQIANBA_VENDOR_SN || '91803325',
  vendorKey: process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2',
  appId: process.env.SHOUQIANBA_APP_ID || '2026041600011122',

  // 测试激活码（有效期至 2026-04-24）
  testCode: '66172491',

  // 正式激活码（上线后填入）
  // 格式：{ deviceId: '品牌+场景+门店编号', code: '激活码' }
  // 例如: { deviceId: 'claw-web-main', code: 'XXXXXXXX' }
  storeDevices: {
    default: {
      code: '66172491',  // 测试用，2026-04-24过期
      merchantId: null,  // 激活后填入
      storeSn: null
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  // 格式：{ deviceId: { terminalSn, terminalKey, activatedAt } }
  terminals: {}
};

export default config;
