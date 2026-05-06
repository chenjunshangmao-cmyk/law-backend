/**
 * 收钱吧配置
 * 敏感凭证不提交到 Git！
 * 2026-05-06：新终端 claw-pay-motecg24-0417 激活成功 ✅
 */

const config = {
  // API地址
  apiBase: 'https://vsi-api.shouqianba.com',

  // 开发者参数（测试+正式通用）
  vendorSn: process.env.SHOUQIANBA_VENDOR_SN || '91803325',
  vendorKey: process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2',
  appId: process.env.SHOUQIANBA_APP_ID || '2026041600011122',

  // 主设备ID（2026-05-06 新激活）
  defaultDeviceId: 'claw-pay-motecg24-0417',

  // 激活码（已使用）
  testCode: '40513957',

  storeDevices: {
    'claw-pay-motecg24-0417': {
      code: '40513957',
      merchantId: '18956397746',
      storeSn: '00010101001200200046406',
      terminalSn: '100111220054798199',
      terminalKey: 'aeedfa867be08fd915cfc39f7e281908'
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;
