#!/usr/bin/env node
/**
 * Claw 数据库备份脚本
 * 备份所有 JSON 数据文件到一个完整的备份文件
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = 'C:/Users/Administrator/WorkBuddy/Claw/backend/data';
const BACKUP_DIR = 'C:/Users/Administrator/WorkBuddy/Claw/backups/auto';

// 获取当前日期字符串
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 读取 JSON 文件
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
  }
  return null;
}

// 主备份函数
function backupDatabase() {
  console.log('🔄 开始备份 Claw 数据库...');

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'Claw Backend JSON Storage',
    data: {},
    metadata: {
      backupTime: new Date().toISOString(),
      backupType: 'full',
      files: []
    }
  };

  // 要备份的文件列表
  const filesToBackup = [
    'users.json',
    'accounts.json',
    'products.json',
    'tasks.json',
    'quotas.json',
    'shouqianba-orders.json',
    'shouqianba-terminal.json',
    'whatsapp-links.json'
  ];

  let totalRecords = 0;

  // 读取每个文件
  for (const file of filesToBackup) {
    const filePath = path.join(DATA_DIR, file);
    const data = readJsonFile(filePath);
    
    if (data !== null) {
      const key = file.replace('.json', '');
      backupData.data[key] = data;
      backupData.metadata.files.push(file);
      
      // 计算记录数
      if (Array.isArray(data)) {
        totalRecords += data.length;
      } else if (typeof data === 'object') {
        totalRecords += Object.keys(data).length;
      }
      
      console.log(`  ✅ ${file} (${
        Array.isArray(data) ? data.length + ' 条记录' : 
        typeof data === 'object' ? Object.keys(data).length + ' 个键' : 'N/A'
      })`);
    } else {
      console.log(`  ⚠️  ${file} (文件不存在或无法读取)`);
      backupData.data[file.replace('.json', '')] = { error: '文件不存在或无法读取' };
    }
  }

  backupData.metadata.totalRecords = totalRecords;
  backupData.metadata.recordCounts = {
    users: backupData.data.users?.length || 0,
    accounts: backupData.data.accounts?.length || 0,
    products: backupData.data.products?.length || 0,
    tasks: backupData.data.tasks?.length || 0,
  };

  // 确保备份目录存在
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 创建备份目录: ${BACKUP_DIR}`);
  }

  // 保存备份文件
  const dateStr = getDateString();
  const backupFilePath = path.join(BACKUP_DIR, `backup-${dateStr}.json`);
  
  try {
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\n✅ 备份完成！`);
    console.log(`📦 备份文件: ${backupFilePath}`);
    console.log(`📊 总记录数: ${totalRecords}`);
    console.log(`📅 备份时间: ${backupData.timestamp}`);
    
    return {
      success: true,
      backupFile: backupFilePath,
      recordCount: totalRecords,
      filesBackedUp: backupData.metadata.files.length
    };
  } catch (error) {
    console.error(`❌ 保存备份文件失败:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行备份
const result = backupDatabase();
export default result;
