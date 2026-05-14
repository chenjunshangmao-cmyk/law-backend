/**
 * OZON 自动发布路由
 * - POST /api/ozon-publish/auto-publish  一键从选品发布到OZON
 * - 兼容 1688 链接拉取 + AI生成详情 + 直接发布
 */
import express from 'express';
import { createOzonClient, importProduct, importPictures, getImportInfo } from '../services/ozonApi.js';
import { authenticateToken } from '../middleware/auth.js';
import { getGateway } from '../services/ai/AIGateway.js';

const router = express.Router();
const gateway = getGateway();

// OZON 账号映射
const OZON_ACCOUNTS = {
  'chenjun-trading':  { clientId: '253100',   apiKey: '97cbc32c-5a85-405e-8bf0-d45cb943acf1', name: 'Chenjun Trading' },
  'chenjun-mall':     { clientId: '2838302',  apiKey: '3652be69-0a0b-4e3e-8510-83ad7b082529', name: 'Chenjun Mall' },
  'qiming-trading':   { clientId: '3101652',  apiKey: '90356528-af82-42c1-81af-86fddec89224', name: 'qiming Trading' },
};

// 品类 → OZON类目ID映射（常用）
const CATEGORY_MAP = {
  '童装':     { description_category_id: 17027632, type_id: 9525966,  name: 'Одежда для мальчиков' },
  '女装':     { description_category_id: 17027610, type_id: 94609139, name: 'Женская одежда' },
  '男装':     { description_category_id: 17027618, type_id: 94609139, name: 'Мужская одежда' },
  '鞋类':     { description_category_id: 7034039,  type_id: 94609553, name: 'Обувь' },
  '家居':     { description_category_id: 7070727,  type_id: 95256467, name: 'Товары для дома' },
  '宠物':     { description_category_id: 7129367,  type_id: 95067030, name: 'Зоотовары' },
  '玩具':     { description_category_id: 7260637,  type_id: 94609539, name: 'Игрушки' },
  '电子':     { description_category_id: 7058867,  type_id: 94610055, name: 'Электроника' },
  '运动':     { description_category_id: 7181901,  type_id: 94609543, name: 'Спорт' },
  '美妆':     { description_category_id: 7079696,  type_id: 95067003, name: 'Красота' },
  '婴幼儿':    { description_category_id: 7153416,  type_id: 94609535, name: 'Детские товары' },
  'led灯泡':  { description_category_id: 7242220,  type_id: 94610055, name: 'Освещение' },
};

/**
 * POST /api/ozon-publish/auto-publish
 * 一键从选品发布到OZON
 * 接收选品结果，自动生成OZON格式的发布数据并调用API
 */
router.post('/auto-publish', authenticateToken, async (req, res) => {
  try {
    const {
      accountId,  // 'qiming-trading' | 'chenjun-trading' | 'chenjun-mall'
      product,    // 选品结果对象
      sourceUrl,  // 1688链接（可选）
      images: overrideImages,  // 手动指定图片（可选）
      overrideName,  // 手动指定名称（可选）
      overridePrice, // 手动指定价格（可选）
    } = req.body || {};

    // 1. 验证账号
    const account = OZON_ACCOUNTS[accountId];
    if (!account) {
      return res.status(400).json({
        success: false,
        error: `未知账号 ${accountId}，可选: ${Object.keys(OZON_ACCOUNTS).join(', ')}`
      });
    }

    // 2. 从选品数据提取产品信息
    const productName = overrideName || product?.productName || '';
    const productDesc = product?.description || product?.summary || '';
    const rawPrice = overridePrice || product?.price?.overseasPrice;const productPrice = rawPrice || (product?.price?.costCNY ? product.price.costCNY * 2.5 : 1000);
    const productCategory = product?.category || '其他';
    const productImages = overrideImages || (product?.image ? [product.image] : []);
    const productSku = product?.sourceUrl?.split('/').pop()?.slice(0, 20) || `AUTO-${Date.now()}`;

    if (!productName && !sourceUrl) {
      return res.status(400).json({ success: false, error: '请提供产品名称或1688链接' });
    }

    // 3. 品类ID映射
    const catInfo = findCategory(productCategory);
    if (!catInfo) {
      return res.status(400).json({
        success: false,
        error: `未找到品类"${productCategory}"的OZON类目映射，请手动选择`
      });
    }

    // 4. 生成OZON SKU
    const offerId = `CLAW-${account.name.replace(/\s/g,'')}-${Date.now().toString(36).toUpperCase()}`;

    // 5. 转价格（RUB）
    const priceRUB = Math.round(Number(productPrice));
    const oldPriceRUB = Math.round(priceRUB * 1.3);

    // 6. 用AI生成俄语标题和描述
    console.log(`[OZON自动发布] 正在生成俄语内容: "${productName.substring(0,30)}..."`);
    let russianName = productName;
    let russianDesc = productDesc;

    try {
      const aiContent = await gateway.chat([
        { role: 'user', content: `将以下产品信息翻译为俄语（OZON平台使用），返回JSON：
{
  "name": "俄语产品标题（尽量SEO优化，不超过150字符）",
  "description": "俄语产品描述（包括材质、尺寸、适用场景、卖点，200-500字符）"
}

中文信息：
产品名: ${productName}
描述: ${productDesc}
品类: ${productCategory}` }
      ], 'ozon-auto');

      const text = aiContent.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        russianName = parsed.name || russianName;
        russianDesc = parsed.description || russianDesc;
      }
    } catch (e) {
      console.warn('[OZON自动发布] AI翻译失败，使用原始名称:', e.message);
    }

    // 7. 构建发布负载
    const publishPayload = {
      clientId: account.clientId,
      apiKey: account.apiKey,
      name: russianName,
      offer_id: offerId,
      price: String(priceRUB),
      old_price: String(oldPriceRUB),
      currency_code: 'RUB',
      vat: '0',
      description_category_id: catInfo.description_category_id,
      type_id: catInfo.type_id,
      images: productImages.length > 0 ? productImages : ['https://placehold.co/400x400?text=OZON+Product'],
      description: russianDesc,
      weight: '300',
      weight_unit: 'g',
      height: '5',
      width: '25',
      depth: '20',
      dimension_unit: 'cm',
      stock: '50',
      attributes: [
        { id: 85, value: getGender(catInfo.name) },
      ],
    };

    // 8. 调用OZON发布
    const client = createOzonClient(account.clientId, account.apiKey);
    const result = await importProduct(client, publishPayload);

    console.log(`[OZON自动发布] ✅ 发布成功! task_id=${result.task_id}, 账号=${account.name}`);

    res.json({
      success: true,
      data: {
        task_id: result.task_id,
        message: `商品已提交到 OZON 账号「${account.name}」，等待审核（通常1-3天）`,
        offer_id: offerId,
        name: russianName,
        price: `${priceRUB} RUB`,
        account: account.name,
      }
    });
  } catch (error) {
    console.error('[OZON自动发布] 失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 选品中的已发布商品列表（可查看4个OZON账号的发布记录）
 */
router.get('/published', authenticateToken, async (req, res) => {
  // 返回本地记录（JSON文件存储）
  try {
    const { readDataStore } = await import('../services/dataStore.js');
    const records = readDataStore('ozon_published.json') || [];
    res.json({ success: true, data: records });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

function findCategory(category) {
  // 精确匹配
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];

  // 模糊匹配
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (category.includes(key) || key.includes(category)) return val;
  }
  return null;
}

function getGender(catName) {
  if (catName.includes('Мальчик') || catName.includes('Мужск')) return 'Мужской';
  if (catName.includes('Девочк') || catName.includes('Женск')) return 'Женский';
  return 'Унисекс';
}

export default router;
