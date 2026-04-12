// 产品管理路由 - 数据库版本
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getProductsByUser,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getQuotaByUserId,
  countUserProducts
} from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products - 获取产品列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category, limit, offset } = req.query;
    const products = await getProductsByUser(req.userId, {
      status,
      category,
      limit: limit || 100,
      offset: offset || 0
    });
    
    res.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// GET /api/products/:id - 获取单个产品
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: '产品不存在'
      });
    }

    // 检查产品是否属于当前用户
    if (product.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: '无权访问此产品'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('获取产品错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// POST /api/products - 创建产品
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, cost, price, sourceUrl, category, images } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '产品名称不能为空'
      });
    }

    // 检查产品数量限制
    const quota = await getQuotaByUserId(req.userId);
    const productCount = await countUserProducts(req.userId);
    
    if (productCount >= quota.productsLimit) {
      return res.status(403).json({
        success: false,
        error: `已达到产品数量上限（${quota.productsLimit}个），请升级套餐`
      });
    }

    // 创建产品
    const product = await createProduct({
      userId: req.userId,
      name,
      description: description || '',
      cost: cost || 0,
      price: price || 0,
      sourceUrl: sourceUrl || '',
      category: category || 'general',
      images: images || [],
      status: 'draft'
    });

    if (!product) {
      return res.status(500).json({
        success: false,
        error: '创建产品失败'
      });
    }

    res.status(201).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// PUT /api/products/:id - 更新产品
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: '产品不存在'
      });
    }

    // 检查产品是否属于当前用户
    if (product.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: '无权修改此产品'
      });
    }

    const { name, description, cost, price, sourceUrl, category, images, status, platformData, generatedContent } = req.body;

    // 更新产品
    const updates = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(cost !== undefined && { cost }),
      ...(price !== undefined && { price }),
      ...(sourceUrl !== undefined && { sourceUrl }),
      ...(category !== undefined && { category }),
      ...(images !== undefined && { images }),
      ...(status !== undefined && { status }),
      ...(platformData !== undefined && { platformData }),
      ...(generatedContent !== undefined && { generatedContent })
    };

    const updatedProduct = await updateProduct(req.params.id, updates);
    
    if (!updatedProduct) {
      return res.status(500).json({
        success: false,
        error: '更新产品失败'
      });
    }

    res.json({
      success: true,
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// DELETE /api/products/:id - 删除产品
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: '产品不存在'
      });
    }

    // 检查产品是否属于当前用户
    if (product.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: '无权删除此产品'
      });
    }

    const deleted = await deleteProduct(req.params.id);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: '删除产品失败'
      });
    }

    res.json({
      success: true,
      message: '产品已删除'
    });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
