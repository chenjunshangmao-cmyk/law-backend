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

  // 主设备ID（claw-web-new1 已解绑，可以重新激活）
  defaultDeviceId: 'claw-web-new1',

  // 激活码（2026-04-22 客户经理已解绑旧设备，可重新使用）
  testCode: '81119079',

  storeDevices: {
    'claw-web-new1': {
      code: '81119079',  // 有效期至 2026-04-30
      merchantId: null,  // 激活后填入
      storeSn: null
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;
