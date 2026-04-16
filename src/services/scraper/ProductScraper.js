// ==========================================
// 商品抓取服务 - 支持1688/淘宝/拼多多
// ==========================================

import { chromium } from 'playwright';
import logger from '../../utils/logger.js';

class ProductScraper {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // 判断链接类型
  detectSource(url) {
    if (url.includes('1688.com')) return '1688';
    if (url.includes('taobao.com') || url.includes('tmall.com')) return 'taobao';
    if (url.includes('pinduoduo.com') || url.includes('yangkeduo.com')) return 'pdd';
    return 'unknown';
  }

  // 主抓取方法
  async fetchProduct(url) {
    await this.init();
    const source = this.detectSource(url);
    
    logger.info(`开始抓取商品: ${url}, 来源: ${source}`);

    try {
      switch (source) {
        case '1688':
          return await this.fetch1688(url);
        case 'taobao':
          return await this.fetchTaobao(url);
        case 'pdd':
          return await this.fetchPdd(url);
        default:
          throw new Error('不支持的链接类型');
      }
    } catch (error) {
      logger.error('抓取失败:', error);
      throw error;
    }
  }

  // 1688抓取
  async fetch1688(url) {
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    try {
      // 访问页面
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // 等待页面加载
      await page.waitForTimeout(3000);

      // 提取商品信息
      const product = await page.evaluate(() => {
        const result = {
          title: '',
          price: 0,
          originalPrice: 0,
          images: [],
          specs: [],
          description: '',
          source: '1688',
          sourceUrl: window.location.href
        };

        // 标题
        const titleSelectors = [
          'h1[data-spm="title"]',
          '.d-title',
          'h1.title',
          '[class*="title"] h1',
          'h1'
        ];
        for (const selector of titleSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            result.title = el.textContent.trim();
            break;
          }
        }

        // 价格
        const priceSelectors = [
          '.price .value',
          '.offer-price',
          '[class*="price"] [class*="value"]',
          '.price-now'
        ];
        for (const selector of priceSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            const priceText = el.textContent.replace(/[^\d.]/g, '');
            if (priceText) {
              result.price = parseFloat(priceText);
              break;
            }
          }
        }

        // 图片
        const imageSelectors = [
          '.main-image img',
          '.gallery img',
          '[class*="image"] img',
          '.tab-content img'
        ];
        for (const selector of imageSelectors) {
          const images = document.querySelectorAll(selector);
          if (images.length > 0) {
            result.images = Array.from(images)
              .map(img => img.src || img.dataset.src)
              .filter(src => src && src.startsWith('http'))
              .slice(0, 10);
            break;
          }
        }

        // 规格
        const skuSelectors = [
          '.sku-item',
          '.prop-item',
          '[class*="sku"]',
          '[class*="prop"]'
        ];
        for (const selector of skuSelectors) {
          const items = document.querySelectorAll(selector);
          if (items.length > 0) {
            // 尝试获取规格名称和选项
            const specNames = document.querySelectorAll('.sku-name, .prop-name, [class*="name"]');
            specNames.forEach((nameEl, idx) => {
              const name = nameEl.textContent.trim();
              const options = [];
              
              // 找对应的选项
              const optionsContainer = nameEl.nextElementSibling || nameEl.parentElement?.querySelector('[class*="value"], [class*="option"]');
              if (optionsContainer) {
                const optionEls = optionsContainer.querySelectorAll('span, a, div');
                optionEls.forEach(opt => {
                  const text = opt.textContent.trim();
                  if (text && text.length < 20) options.push(text);
                });
              }
              
              if (name && options.length > 0) {
                result.specs.push({ name, options: [...new Set(options)] });
              }
            });
            break;
          }
        }

        // 如果规格为空，尝试其他方式
        if (result.specs.length === 0) {
          const specRows = document.querySelectorAll('tr, .spec-row');
          specRows.forEach(row => {
            const cells = row.querySelectorAll('td, .spec-name, .spec-value');
            if (cells.length >= 2) {
              const name = cells[0].textContent.trim();
              const value = cells[1].textContent.trim();
              if (name && value && name.length < 20) {
                result.specs.push({ name, options: value.split(/[,，/]/).map(s => s.trim()) });
              }
            }
          });
        }

        // 描述
        const descSelectors = [
          '.offer-desc',
          '[class*="desc"]',
          '.detail-content'
        ];
        for (const selector of descSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim().length > 10) {
            result.description = el.textContent.trim().slice(0, 500);
            break;
          }
        }

        return result;
      });

      // 清理图片URL
      product.images = product.images.map(url => {
        // 移除尺寸参数，获取原图
        return url.replace(/\.\d+x\d+\./, '.').replace(/_\d+x\d+/, '');
      });

      logger.info(`1688抓取成功: ${product.title}, 价格: ${product.price}, 图片: ${product.images.length}张`);
      
      await context.close();
      return product;

    } catch (error) {
      await context.close();
      throw error;
    }
  }

  // 淘宝抓取
  async fetchTaobao(url) {
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const product = await page.evaluate(() => {
        const result = {
          title: '',
          price: 0,
          originalPrice: 0,
          images: [],
          specs: [],
          description: '',
          source: 'taobao',
          sourceUrl: window.location.href
        };

        // 标题
        const titleEl = document.querySelector('h1[data-spm], .tb-detail-hd h1, .item-title');
        if (titleEl) result.title = titleEl.textContent.trim();

        // 价格
        const priceEl = document.querySelector('.tb-rmb-num, .notranslate, [class*="price"]');
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^\d.]/g, '');
          if (priceText) result.price = parseFloat(priceText);
        }

        // 图片
        const images = document.querySelectorAll('#J_UlThumb li img, .tb-pic img');
        result.images = Array.from(images)
          .map(img => {
            const src = img.src || img.dataset.src;
            return src?.replace(/_\d+x\d+/, '');
          })
          .filter(src => src && src.startsWith('http'));

        // 规格
        const skuGroups = document.querySelectorAll('.tb-sku, .J_Prop');
        skuGroups.forEach(group => {
          const nameEl = group.querySelector('.tb-property-type, .dt');
          const optionEls = group.querySelectorAll('li, .tb-img, .tb-txt');
          
          if (nameEl && optionEls.length > 0) {
            const name = nameEl.textContent.replace(/[：:]/g, '').trim();
            const options = Array.from(optionEls)
              .map(el => el.textContent.trim())
              .filter(t => t && t.length < 20);
            
            if (name && options.length > 0) {
              result.specs.push({ name, options: [...new Set(options)] });
            }
          }
        });

        return result;
      });

      logger.info(`淘宝抓取成功: ${product.title}`);
      await context.close();
      return product;

    } catch (error) {
      await context.close();
      throw error;
    }
  }

  // 拼多多抓取
  async fetchPdd(url) {
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const product = await page.evaluate(() => {
        const result = {
          title: '',
          price: 0,
          originalPrice: 0,
          images: [],
          specs: [],
          description: '',
          source: 'pdd',
          sourceUrl: window.location.href
        };

        // 标题
        const titleEl = document.querySelector('h1, .goods-name, [data-testid="goods-title"]');
        if (titleEl) result.title = titleEl.textContent.trim();

        // 价格（拼多多价格需要特殊处理，通常是分）
        const priceEl = document.querySelector('.goods-price, [data-testid="price"]');
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^\d.]/g, '');
          if (priceText) {
            const price = parseFloat(priceText);
            // 如果价格大于1000，可能是分，需要转换
            result.price = price > 1000 ? price / 100 : price;
          }
        }

        // 图片
        const images = document.querySelectorAll('.goods-img img, [data-testid="goods-image"] img');
        result.images = Array.from(images)
          .map(img => img.src || img.dataset.src)
          .filter(src => src && src.startsWith('http'));

        return result;
      });

      logger.info(`拼多多抓取成功: ${product.title}`);
      await context.close();
      return product;

    } catch (error) {
      await context.close();
      throw error;
    }
  }
}

export default ProductScraper;
