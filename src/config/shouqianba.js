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

  // 主设备ID（claw-web-new3，2026-05-04 修复：切回已验证可用的终端 ✅）
  // WAP网关实测：claw-web-new3→302成功 / claw-web-new1→错误页
  defaultDeviceId: 'claw-web-new3',

  // 激活码（claw-web-new3用81119079激活）
  testCode: '81119079',

  storeDevices: {
    'claw-web-new3': {
      code: '81119079',           // 有效期至2026-04-30，已激活
      merchantId: '18956397746',
      storeSn: '00010101001200200046406',
      terminalSn: '100111220054389553',    // 当前有效终端 ✅
      terminalKey: '96bfaf401367d934cb10a1cbe9773647'  // 技术文档记录密钥，网关验证通过 ✅
    }
  },

  // 终端缓存（激活后在这里存储 terminal_sn + terminal_key）
  terminals: {}
};

export default config;

