// 账号管理验证中间件
export const validateAccountCreate = (req, res, next) => {
  const { platform, name, username, credentials, settings } = req.body;
  const errors = [];

  // 平台验证
  if (!platform) {
    errors.push('平台不能为空');
  } else if (!['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee', 'youtube', 'taobao', 'pdd'].includes(platform.toLowerCase())) {
    errors.push(`不支持的平台: ${platform}，支持的平台: 1688, amazon, tiktok, ozon, lazada, shopee, youtube, taobao, pdd`);
  }

  // 名称验证
  if (!name) {
    errors.push('账号名称不能为空');
  } else if (name.length > 100) {
    errors.push('账号名称不能超过100个字符');
  }

  // 用户名验证
  if (username && username.length > 50) {
    errors.push('用户名不能超过50个字符');
  }

  // 凭证验证
  if (credentials) {
    if (typeof credentials !== 'object') {
      errors.push('凭证必须是对象');
    } else {
      if (credentials.username && credentials.username.length > 50) {
        errors.push('凭证用户名不能超过50个字符');
      }
      if (credentials.password && credentials.password.length > 100) {
        errors.push('密码不能超过100个字符');
      }
    }
  }

  // 设置验证
  if (settings && typeof settings !== 'object') {
    errors.push('设置必须是对象');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      errors
    });
  }

  next();
};

export const validateAccountUpdate = (req, res, next) => {
  const { platform, name, username, credentials, settings, status } = req.body;
  const errors = [];

  // 平台验证
  if (platform && !['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee', 'youtube', 'taobao', 'pdd'].includes(platform.toLowerCase())) {
    errors.push(`不支持的平台: ${platform}，支持的平台: 1688, amazon, tiktok, ozon, lazada, shopee, youtube, taobao, pdd`);
  }

  // 名称验证
  if (name && name.length > 100) {
    errors.push('账号名称不能超过100个字符');
  }

  // 用户名验证
  if (username && username.length > 50) {
    errors.push('用户名不能超过50个字符');
  }

  // 状态验证
  if (status && !['active', 'inactive', 'expired', 'error'].includes(status)) {
    errors.push('状态必须是 active, inactive, expired, 或 error');
  }

  // 凭证验证
  if (credentials && typeof credentials !== 'object') {
    errors.push('凭证必须是对象');
  }

  // 设置验证
  if (settings && typeof settings !== 'object') {
    errors.push('设置必须是对象');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      errors
    });
  }

  next();
};

export const validateAccountTest = (req, res, next) => {
  const errors = [];

  // 账号ID验证
  if (!req.params.id) {
    errors.push('账号ID不能为空');
  } else if (!/^[a-f0-9-]+$/i.test(req.params.id)) {
    errors.push('账号ID格式无效');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      errors
    });
  }

  next();
};

// cookies验证
export const validateCookies = (req, res, next) => {
  const { cookies } = req.body;
  const errors = [];

  if (cookies && !Array.isArray(cookies)) {
    errors.push('cookies必须是数组格式');
  } else if (cookies && cookies.length > 0) {
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      if (!cookie.name || !cookie.value) {
        errors.push(`cookies[${i}] 缺少name或value字段`);
      }
      if (cookie.name && cookie.name.length > 100) {
        errors.push(`cookies[${i}].name 不能超过100个字符`);
      }
      if (cookie.value && cookie.value.length > 500) {
        errors.push(`cookies[${i}].value 不能超过500个字符`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      errors
    });
  }

  next();
};