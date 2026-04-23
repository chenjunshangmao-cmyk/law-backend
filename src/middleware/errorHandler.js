// 统一错误处理中间件

// 应用错误类
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(errors = [], message = '验证失败') {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// 认证错误类
export class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// 授权错误类
export class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 资源未找到错误类
export class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// 请求限制错误类
export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// 日志记录器
const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};

// 全局错误处理中间件
export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const path = req.path;
  const method = req.method;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // 默认错误
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors || [];

  // 如果是应用错误（可预期的）
  if (err.isOperational) {
    logger.warn('应用错误', {
      timestamp,
      path,
      method,
      statusCode,
      code: errorCode,
      message,
      ip,
      userAgent
    });
  } else {
    // 系统错误（不可预期的）
    logger.error('系统错误', err);
    
    // 生产环境隐藏详细错误信息
    if (process.env.NODE_ENV === 'production') {
      message = '服务器内部错误';
      errors = [];
    }
  }

  // JSON格式错误响应
  const errorResponse = {
    success: false,
    error: message,
    code: errorCode,
    timestamp,
    path
  };

  // 调试用：附加原始错误详情（detail），区分字符串错误和对象错误
  const rawMsg = typeof err === 'string' ? err : (err.message || '');
  if (rawMsg && rawMsg !== message) {
    errorResponse.detail = rawMsg;
    errorResponse.error = message; // 保持 sanitized 消息在前端显示
  }
  // 原始 error 对象（用于调试）
  if (process.env.NODE_ENV !== 'production' || rawMsg) {
    if (typeof err !== 'string' && err.stack) {
      errorResponse.debugStack = err.stack;
    }
  }

  // 如果有详细错误信息
  if (errors.length > 0) {
    errorResponse.errors = errors;
  }

  // 如果是开发环境，添加堆栈跟踪
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404处理中间件
export const notFoundHandler = (req, res, next) => {
  const err = new NotFoundError(`API端点 ${req.method} ${req.path} 不存在`);
  next(err);
};

// 请求日志中间件
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('请求开始', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // 响应结束后记录
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('请求完成', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous'
    });
  });

  next();
};

// 安全中间件
export const securityHeaders = (req, res, next) => {
  // 设置安全相关的HTTP头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// 数据库连接健康检查
export const healthCheck = async (req, res, next) => {
  try {
    // 这里可以添加数据库连接检查
    // 暂时返回简单健康状态
    res.json({
      status: 'healthy',
      service: 'claw-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('健康检查失败', error);
    res.status(500).json({
      status: 'unhealthy',
      error: '服务不可用',
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  healthCheck,
  logger
};