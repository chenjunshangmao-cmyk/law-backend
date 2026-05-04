/**
 * 收钱吧配置
 * 敏感凭证不提交到 Git！
 * 2026-04-22：claw-web-new3 新激活成功 ✅
 */

const config = {
  // API地址
  apiBase: 'https://vsi-api.shouqianba.com',

  // 开发者参数（测试+正式通用）
  vendorSn: process.env.SHOUQIANBA_VENDOR_SN || '91803325',
  vendorKey: process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2',
  appId: process.env.SHOUQIANBA_APP_ID || '2026041600011122',

  // 主设备ID（claw-web-new1，2026-05-04 切回旧终端 ✅ 密钥经签到验证有效）
  defaultDeviceId: 'claw-web-new1',

  // 激活码（claw-web-new1用66172491激活）
  testCode: '66172491',

  storeDevices: {
    'claw-web-new1': {
      code: '66172491',           // 原激活码，2026-04-20激活
      merchantId: '18956397746',
      storeSn: '00010101001200200046406',
      terminalSn: '100111220054361978',    // 旧终端（已验证可用 ✅）
      terminalKey: '114d06c3f7f79d00d2ef022ab3d201af'  // 2026-05-04 签到获取的最新密钥
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;

