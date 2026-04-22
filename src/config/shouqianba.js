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

  // 主设备ID（claw-web-new1/claw-web-new2 已绑定其他商户，使用新设备）
  defaultDeviceId: 'claw-web-new3',

  // 激活码
  testCode: '81119079',

  storeDevices: {
    'claw-web-new3': {
      code: '81119079',  // 有效期至 2026-04-30
      merchantId: '18956397746',
      storeSn: '00010101001200200046406'
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;
