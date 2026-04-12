// ==========================================
// Flux Image Provider with Proxy
// ==========================================

const { fetchWithProxy, checkProxy } = require('../../../utils/proxy');

class FluxProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.bfl.ml/v1';
    this.model = 'flux-1-dev';
  }

  async generateImage(params) {
    const { prompt, width = 1024, height = 1024, num_images = 1 } = params;

    // 检查代理可用性
    const proxyAvailable = await checkProxy();
    if (!proxyAvailable) {
      console.warn('代理不可用，尝试直连...');
    }

    try {
      const response = await fetchWithProxy(`${this.baseURL}/flux-pro`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          width,
          height,
          num_images,
          prompt_upsampling: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Flux API错误: ${error}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: data.result?.sample,
        prompt,
        id: data.id,
      };
    } catch (error) {
      console.error('Flux生成失败:', error);
      throw error;
    }
  }

  async getResult(id) {
    try {
      const response = await fetchWithProxy(`${this.baseURL}/get_result?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('获取结果失败:', error);
      throw error;
    }
  }
}

module.exports = FluxProvider;
