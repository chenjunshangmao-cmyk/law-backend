/**
 * initAgentTables.js — AI Agent 数据库表初始化
 * 
 * 创建：
 * 1. ai_qa_records    — 问答记录表（每个Agent独立记忆的基础）
 * 2. ai_knowledge_tips — 知识笔记表（Agent自行学习的经验）
 * 3. ai_agent_config   — Agent配置表（持久化人格设定）
 */

import { pool, useMemoryMode } from '../../config/database.js';

export async function initAgentTables() {
  if (useMemoryMode) {
    console.log('[AgentDB] 内存模式，跳过表创建');
    return true;
  }

  try {
    // 1. 问答记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_qa_records (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(32) NOT NULL,
        room_id VARCHAR(128) NOT NULL DEFAULT '',
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        source VARCHAR(20) DEFAULT 'live',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_qa_agent ON ai_qa_records(agent_id, room_id, created_at DESC)
    `).catch(() => {});

    // 2. 知识笔记表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_knowledge_tips (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_tips_agent ON ai_knowledge_tips(agent_id, created_at DESC)
    `).catch(() => {});

    // 3. Agent配置表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_agent_config (
        agent_id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        max_rooms INTEGER DEFAULT 20,
        auto_optimize BOOLEAN DEFAULT true,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. 直播间信息表（记录每个Agent管理的直播间）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_live_rooms (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(32) NOT NULL,
        room_name VARCHAR(128),
        platform VARCHAR(32),
        stream_key VARCHAR(256),
        status VARCHAR(20) DEFAULT 'active',
        viewer_count INTEGER DEFAULT 0,
        last_live_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_rooms_agent ON ai_live_rooms(agent_id, status)
    `).catch(() => {});

    console.log('[AgentDB] ✅ AI Agent 数据表初始化完成');
    return true;
  } catch (e) {
    console.error('[AgentDB] ❌ 表创建失败:', e.message);
    return false;
  }
}
