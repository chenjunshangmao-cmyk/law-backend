// 请求验证中间件

// 密码强度验证函数
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少1个大写字母');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少1个小写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少1个数字');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少1个特殊字符(!@#$%^&*等)');
  }
  
  // 检查常见弱密码
  const commonPasswords = ['password', '12345678', 'qwertyui', 'admin123', 'claw2026'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('密码太简单，请使用更复杂的密码');
  }
  
  return errors;
};

export const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  // 邮箱验证
  if (!email) {
    errors.push('邮箱不能为空');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('邮箱格式无效');
  } else if (email.length > 100) {
    errors.push('邮箱长度不能超过100个字符');
  }

  // 密码验证 - 增强强度检查
  if (!password) {
    errors.push('密码不能为空');
  } else {
    const passwordErrors = validatePasswordStrength(password);
    errors.push(...passwordErrors);
  }

  // 用户名验证
  if (!name) {
    errors.push('用户名不能为空');
  } else if (name.length < 2) {
    errors.push('用户名长度至少2个字符');
  } else if (name.length > 50) {
    errors.push('用户名长度不能超过50个字符');
  } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-]+$/.test(name)) {
    errors.push('用户名只能包含中文、字母、数字、下划线和横线');
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

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('邮箱不能为空');
  }

  if (!password) {
    errors.push('密码不能为空');
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

export const validateProduct = (req, res, next) => {
  const { name, cost, category } = req.body;
  const errors = [];

  if (!name) {
    errors.push('产品名称不能为空');
  } else if (name.length > 200) {
    errors.push('产品名称不能超过200个字符');
  }

  if (cost !== undefined && (isNaN(cost) || cost < 0)) {
    errors.push('成本必须是非负数字');
  }

  if (category && category.length > 50) {
    errors.push('分类名称不能超过50个字符');
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

export const validateTask = (req, res, next) => {
  const { title, description, priority } = req.body;
  const errors = [];

  if (!title) {
    errors.push('任务标题不能为空');
  } else if (title.length > 100) {
    errors.push('任务标题不能超过100个字符');
  }

  if (description && description.length > 500) {
    errors.push('任务描述不能超过500个字符');
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    errors.push('优先级必须是 low, medium, 或 high');
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

// 浏览器API验证
export const validateBrowserLogin = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) {
    errors.push('邮箱不能为空');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('邮箱格式无效');
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

export const validateTikTokPublish = (req, res, next) => {
  const { email, title, price, stock, images } = req.body;
  const errors = [];

  if (!email) {
    errors.push('邮箱不能为空');
  }

  if (!title) {
    errors.push('产品标题不能为空');
  } else if (title.length > 200) {
    errors.push('产品标题不能超过200个字符');
  }

  if (price !== undefined && (isNaN(price) || price <= 0)) {
    errors.push('价格必须是正数');
  }

  if (stock !== undefined && (isNaN(stock) || stock < 0)) {
    errors.push('库存必须是非负整数');
  }

  if (images && !Array.isArray(images)) {
    errors.push('图片必须是数组');
  } else if (images && images.length > 10) {
    errors.push('最多上传10张图片');
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

export const validateYouTubeUpload = (req, res, next) => {
  const { email, videoPath, title, description } = req.body;
  const errors = [];

  if (!email) {
    errors.push('邮箱不能为空');
  }

  if (!videoPath) {
    errors.push('视频路径不能为空');
  } else if (!videoPath.match(/\.(mp4|avi|mov|wmv|flv)$/i)) {
    errors.push('视频文件格式必须是 mp4, avi, mov, wmv, 或 flv');
  }

  if (!title) {
    errors.push('视频标题不能为空');
  } else if (title.length > 100) {
    errors.push('视频标题不能超过100个字符');
  }

  if (description && description.length > 5000) {
    errors.push('视频描述不能超过5000个字符');
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