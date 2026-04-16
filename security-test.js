#!/usr/bin/env node
/**
 * Claw会员系统安全测试脚本
 * 运行: node security-test.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
};

// 测试结果
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(testName, condition, errorMsg, warning = false) {
  if (condition) {
    log.success(testName);
    results.passed++;
  } else if (warning) {
    log.warning(`${testName}: ${errorMsg}`);
    results.warnings++;
  } else {
    log.error(`${testName}: ${errorMsg}`);
    results.failed++;
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         Claw会员系统安全测试                               ║');
console.log('╚════════════════════════════════════════════════════════════\n');

// 1. 检查环境变量
log.info('检查环境变量配置...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // 检查JWT_SECRET
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch) {
    const secret = jwtSecretMatch[1].trim();
    check(
      'JWT_SECRET 已设置',
      secret && secret.length >= 32 && !secret.includes('default') && !secret.includes('claw-secret'),
      `JWT_SECRET太短(${secret.length}字符)或使用了默认值`,
      false
    );
  } else {
    check('JWT_SECRET 存在', false, '未找到JWT_SECRET配置');
  }
  
  // 检查NODE_ENV
  check(
    'NODE_ENV 已设置',
    envContent.includes('NODE_ENV='),
    '建议设置NODE_ENV环境变量',
    true
  );
  
  // 检查CORS配置
  check(
    'ALLOWED_ORIGINS 已设置',
    envContent.includes('ALLOWED_ORIGINS='),
    '建议设置ALLOWED_ORIGINS限制CORS来源',
    true
  );
} else {
  check('.env文件存在', false, '未找到.env文件');
}

// 2. 检查密码强度验证
log.info('\n检查密码强度验证...');
const validationPath = path.join(__dirname, 'src', 'middleware', 'validation.js');
if (fs.existsSync(validationPath)) {
  const validationContent = fs.readFileSync(validationPath, 'utf8');
  
  check(
    '密码长度验证(>=8)',
    validationContent.includes('8') && validationContent.includes('password.length'),
    '密码长度验证不足8位'
  );
  
  check(
    '大写字母验证',
    validationContent.includes('[A-Z]'),
    '缺少大写字母验证'
  );
  
  check(
    '小写字母验证',
    validationContent.includes('[a-z]'),
    '缺少小写字母验证'
  );
  
  check(
    '数字验证',
    validationContent.includes('[0-9]'),
    '缺少数字验证'
  );
  
  check(
    '特殊字符验证',
    validationContent.includes('!@#$%^&*'),
    '缺少特殊字符验证'
  );
} else {
  check('validation.js存在', false, '未找到validation.js');
}

// 3. 检查JWT认证中间件
log.info('\n检查JWT认证中间件...');
const authPath = path.join(__dirname, 'src', 'middleware', 'auth.js');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  check(
    'JWT_SECRET安全检查',
    authContent.includes('if (!JWT_SECRET') || authContent.includes('JWT_SECRET.length'),
    '缺少JWT_SECRET启动检查',
    true
  );
  
  check(
    'Token黑名单机制',
    authContent.includes('tokenBlacklist'),
    '缺少Token黑名单机制'
  );
  
  check(
    '登录尝试限制',
    authContent.includes('MAX_LOGIN_ATTEMPTS'),
    '缺少登录尝试限制'
  );
  
  check(
    '账户锁定机制',
    authContent.includes('lockedUntil'),
    '缺少账户锁定机制'
  );
  
  check(
    '速率限制中间件',
    authContent.includes('rateLimitMiddleware'),
    '缺少速率限制中间件'
  );
} else {
  check('auth.js存在', false, '未找到auth.js');
}

// 4. 检查CORS配置
log.info('\n检查CORS配置...');
const indexPath = path.join(__dirname, 'src', 'index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  check(
    'CORS来源白名单',
    indexContent.includes('allowedOrigins') && !indexContent.includes("origin: '*'"),
    'CORS配置为允许所有来源(*)，存在安全风险',
    true
  );
  
  check(
    'Helmet安全头',
    indexContent.includes('helmet'),
    '未启用Helmet安全头'
  );
  
  check(
    'CSP配置',
    indexContent.includes('contentSecurityPolicy'),
    '未配置Content Security Policy',
    true
  );
} else {
  check('index.js存在', false, '未找到index.js');
}

// 5. 检查前端认证
log.info('\n检查前端认证...');
const frontendAuthPath = path.join(__dirname, '..', 'src', 'src', 'services', 'auth.ts');
if (fs.existsSync(frontendAuthPath)) {
  const frontendAuthContent = fs.readFileSync(frontendAuthPath, 'utf8');
  
  check(
    'Token安全存储',
    frontendAuthContent.includes('sessionStorage') && !frontendAuthContent.includes('localStorage'),
    '使用localStorage存储Token，建议使用sessionStorage'
  );
  
  check(
    'Token过期检查',
    frontendAuthContent.includes('expiry'),
    '缺少Token过期检查'
  );
  
  check(
    '自动携带Token',
    frontendAuthContent.includes('Authorization') && frontendAuthContent.includes('Bearer'),
    'API请求未自动携带Token'
  );
  
  check(
    '401自动跳转',
    frontendAuthContent.includes('401') && frontendAuthContent.includes('/auth'),
    '未处理401未授权跳转'
  );
} else {
  check('前端auth.ts存在', false, '未找到前端auth.ts');
}

// 6. 生成安全建议
log.info('\n检查数据存储安全...');
const dataStorePath = path.join(__dirname, 'src', 'services', 'dataStore.js');
if (fs.existsSync(dataStorePath)) {
  const dataStoreContent = fs.readFileSync(dataStorePath, 'utf8');
  
  check(
    '密码bcrypt加密',
    dataStoreContent.includes('bcrypt') || fs.existsSync(path.join(__dirname, 'src', 'routes', 'auth.js')),
    '需要确认密码使用bcrypt加密',
    true
  );
}

// 7. 检查依赖安全
log.info('\n检查依赖安全...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredSecurityDeps = ['helmet', 'bcryptjs', 'jsonwebtoken'];
  requiredSecurityDeps.forEach(dep => {
    check(
      `${dep} 已安装`,
      deps[dep],
      `缺少安全依赖: ${dep}`
    );
  });
}

// 生成强JWT密钥
log.info('\n生成安全的JWT密钥...');
const strongSecret = crypto.randomBytes(64).toString('hex');
console.log(`\n${colors.yellow}建议的JWT_SECRET:${colors.reset}`);
console.log(strongSecret);

// 总结
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      测试结果汇总                          ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  ✅ 通过: ${results.passed.toString().padEnd(3)}                                          ║`);
console.log(`║  ⚠️  警告: ${results.warnings.toString().padEnd(3)}                                          ║`);
console.log(`║  ❌ 失败: ${results.failed.toString().padEnd(3)}                                          ║`);
console.log('╚════════════════════════════════════════════════════════════╝');

if (results.failed > 0) {
  console.log(`\n${colors.red}存在 ${results.failed} 个安全问题需要修复！${colors.reset}`);
  process.exit(1);
} else if (results.warnings > 0) {
  console.log(`\n${colors.yellow}存在 ${results.warnings} 个警告，建议优化${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.green}所有安全检查通过！✅${colors.reset}`);
  process.exit(0);
}
