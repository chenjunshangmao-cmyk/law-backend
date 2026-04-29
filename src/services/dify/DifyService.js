/**
 * Dify AI 文案生成服务
 * 基于 Dify 工作流自动生成商品营销文案
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

class DifyService {
  constructor() {
    this.apiKey = process.env.DIFY_API_KEY;
    this.apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
    this.appId = process.env.DIFY_APP_ID;
    
    if (!this.apiKey) {
      console.warn('[DifyService] DIFY_API_KEY 未配置，文案生成功能将不可用');
    }
  }

  /**
   * 生成商品营销文案
   * @param {Object} params - 参数
   * @param {string} params.platform - 目标平台 (tiktok|xiaohongshu|youtube)
   * @param {string} params.imageUrl - 商品图片 URL
   * @param {string} params.userId - 用户 ID
   * @returns {Promise<Object>} 生成的文案
   */
  async generateCopywriting({ platform, imageUrl, userId = 'default-user' }) {
    try {
      if (!this.apiKey) {
        throw new Error('Dify API Key 未配置');
      }

      console.log('[DifyService] 开始生成文案:', { platform, imageUrl });

      const response = await axios.post(
        `${this.apiUrl}/chat-messages`,
        {
          query: `请为这个商品生成${platform}平台的营销文案`,
          inputs: {
            platform: platform
          },
          files: [{
            type: 'image',
            transfer_method: 'remote_url',
            url: imageUrl
          }],
          response_mode: 'blocking',
          user: userId,
          auto_generate_name: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 秒超时
        }
      );

      const data = response.data;
      console.log('[DifyService] 文案生成完成:', data.message_id);

      // 解析 AI 返回的文案
      const copywriting = this.parseCopywriting(data.answer);
      
      return {
        success: true,
        data: copywriting,
        messageId: data.message_id,
        conversationId: data.conversation_id,
        usage: data.metadata?.usage
      };

    } catch (error) {
      console.error('[DifyService] 文案生成失败:', error.response?.data || error.message);
      
      // 如果 Dify 不可用，返回降级方案
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        fallback: this.getFallbackCopywriting(platform)
      };
    }
  }

  /**
   * 解析 AI 返回的文案（支持多种格式）
   * @param {string} answer - AI 返回的文本
   * @returns {Object} 结构化文案
   */
  parseCopywriting(answer) {
    try {
      // 尝试解析 JSON 格式
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || parsed.headline || '',
          description: parsed.description || parsed.content || parsed.text || '',
          hashtags: parsed.hashtags || parsed.tags || parsed.labels || [],
          priceUsd: parsed.price_usd || parsed.price || parsed.suggested_price || null,
          raw: answer
        };
      }
    } catch (e) {
      // 非 JSON 格式，按文本解析
      console.log('[DifyService] 非 JSON 格式，使用文本解析');
    }

    // 文本格式解析
    const lines = answer.split('\n').filter(line => line.trim());
    const result = {
      title: '',
      description: '',
      hashtags: [],
      priceUsd: null,
      raw: answer
    };

    let currentSection = 'description';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 检测标题
      if (trimmed.startsWith('#') || trimmed.startsWith('标题：') || trimmed.startsWith('Title:')) {
        result.title = trimmed.replace(/^#*\s*|^(标题：|Title:)\s*/g, '');
        currentSection = 'title';
      }
      // 检测标签
      else if (trimmed.startsWith('#') && trimmed.includes(' ')) {
        const tags = trimmed.match(/#\w+/g) || [];
        result.hashtags.push(...tags);
      }
      // 检测价格
      else if (trimmed.match(/\$[\d.]+|USD[\d.]+|\d+美元/)) {
        const priceMatch = trimmed.match(/[\d.]+/);
        if (priceMatch) {
          result.priceUsd = parseFloat(priceMatch[0]);
        }
      }
      // 其他内容归入描述
      else if (currentSection === 'title' && result.title) {
        result.description += (result.description ? '\n' : '') + trimmed;
        currentSection = 'description';
      }
      else {
        result.description += (result.description ? '\n' : '') + trimmed;
      }
    }

    return result;
  }

  /**
   * 降级方案 - 当 Dify 不可用时返回基础文案
   */
  getFallbackCopywriting(platform) {
    const templates = {
      xiaohongshu: {
        title: '✨ 好物推荐 | 超值必备',
        description: '这款商品真的太好用了！质量超棒，性价比超高，强烈推荐给大家～',
        hashtags: ['#好物推荐', '#种草', '#必买清单', '#性价比之王', '#生活好物'],
        priceUsd: 29.9
      },
      tiktok: {
        title: '🔥 Must-Have Product Alert!',
        description: 'This is absolutely amazing! You need this in your life. Link in bio!',
        hashtags: ['#tiktokshop', '#musthave', '#productreview', '#shopping', '#deals'],
        priceUsd: 24.9
      },
      youtube: {
        title: '📦 Product Review - Worth Buying?',
        description: 'In this video, I\'ll share my honest thoughts about this product. Check it out!',
        hashtags: ['#productreview', '#unboxing', '#review', '#shopping', '#recommendation'],
        priceUsd: 34.9
      }
    };

    return templates[platform] || templates.xiaohongshu;
  }

  /**
   * 上传本地文件到 Dify
   * @param {string} filePath - 本地文件路径
   * @param {string} userId - 用户 ID
   * @returns {Promise<string>} 上传后的文件 ID
   */
  async uploadFile(filePath, userId = 'default-user') {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('user', userId);

      const response = await axios.post(
        `${this.apiUrl}/files/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 120000 // 120 秒超时（大文件）
        }
      );

      return response.data.id;
    } catch (error) {
      console.error('[DifyService] 文件上传失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取应用信息
   * @returns {Promise<Object>} 应用信息
   */
  async getAppInfo() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/parameters`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('[DifyService] 获取应用信息失败:', error.message);
      throw error;
    }
  }
}

export default new DifyService();
