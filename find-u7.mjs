// 诊断性测试：直接查JSON文件内容
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

try {
  const content = readFileSync(DATA_FILE, 'utf8');
  const users = JSON.parse(content);
  console.log('JSON文件用户数:', users.length);
  if (users.length > 0) {
    console.log('最新用户:', JSON.stringify(users[users.length - 1], null, 2));
  } else {
    console.log('JSON文件为空');
  }
} catch (e) {
  console.error('读取失败:', e.message);
}
