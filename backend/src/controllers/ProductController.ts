import { Response } from 'express';
import { Product, ProductReview } from '../models';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth';

class ProductController {
  async getProducts(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, category_id, search } = req.query;
      const offset = ((page as unknown as number) - 1) * (limit as unknown as number);

      const where: any = {};
      if (category_id) {
        where.category_id = category_id;
      }
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: limit as unknown as number,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / (limit as unknown as number)),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
      });
    }
  }

  async getProductById(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const product = await Product.findByPk(id as any, {
        include: [
          {
            model: ProductReview,
            separate: true,
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
      });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const { name, description, price, stock, category_id, is_featured, service_details } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Product name is required',
        });
      }

      const product = await Product.create({
        name,
        description: description || '',
        price: price || 0,
        stock: stock || 0,
        category_id: category_id || 1,
        is_featured: is_featured || false,
        service_details: service_details || '',
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
      });
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, description, price, stock, category_id, is_featured, service_details } = req.body;

      const product = await Product.findByPk(id as any);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      await product.update({
        name: name || product.name,
        description: description ?? product.description,
        price: price ?? product.price,
        stock: stock ?? product.stock,
        category_id: category_id ?? product.category_id,
        is_featured: is_featured ?? product.is_featured,
        service_details: service_details ?? product.service_details,
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
      });
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const product = await Product.findByPk(id as any);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      await product.destroy();

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
      });
    }
  }

  async getFeaturedProducts(req: AuthRequest, res: Response) {
    try {
      const products = await Product.findAll({
        where: { is_featured: true },
        limit: 4,
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured products',
      });
    }
  }
}

export default new ProductController();
