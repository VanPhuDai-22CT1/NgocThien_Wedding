import { Response } from 'express';
import { ProductReview, Product, Order, OrderItem } from '../models';
import { AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';

const COMPLETED_ORDER_STATUSES = ['delivered', 'completed'];

class ReviewController {
  async getProductReviews(req: AuthRequest, res: Response) {
    try {
      const productId = req.params.productId || req.query.productId;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const offset = (page - 1) * limit;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
      }

      const reviews = await ProductReview.findAll({
        where: { product_id: productId },
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      const summary = await ProductReview.findOne({
        where: { product_id: productId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'review_count'],
        ],
        raw: true,
      });

      res.json({
        success: true,
        data: reviews,
        summary: {
          average_rating: summary?.['average_rating'] || 0,
          review_count: summary?.['review_count'] || 0,
        },
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reviews',
      });
    }
  }

  async addReview(req: AuthRequest, res: Response) {
    try {
      const { productId, reviewer_name, rating, comment } = req.body;
      const userId = req.user?.id;

      if (!productId || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and rating are required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Please login before reviewing this service',
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const completedOrder = await Order.findOne({
        where: {
          user_id: userId,
          status: COMPLETED_ORDER_STATUSES,
        },
        include: [
          {
            model: OrderItem,
            where: { product_id: productId },
            required: true,
          },
        ],
      });

      if (!completedOrder) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có thể đánh giá sau khi đã sử dụng và đơn dịch vụ đã hoàn tất.',
        });
      }

      const existingReview = await ProductReview.findOne({
        where: {
          product_id: productId,
          user_id: userId,
        },
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'Bạn đã đánh giá dịch vụ này rồi.',
        });
      }

      const review = await ProductReview.create({
        product_id: productId,
        user_id: userId,
        reviewer_name: reviewer_name || req.user?.username || 'Khách hàng',
        rating,
        comment: comment || '',
      });

      // Update product average rating
      const avgRating = await ProductReview.findOne({
        where: { product_id: productId },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average_rating']],
        raw: true,
      });

      const reviewCount = await ProductReview.count({
        where: { product_id: productId },
      });

      await Product.update(
        { average_rating: avgRating?.['average_rating'] || 0, review_count: reviewCount },
        { where: { id: productId } }
      );

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: review,
      });
    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add review',
      });
    }
  }

  async deleteReview(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const review = await ProductReview.findByPk(id as any);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      const productId = review.product_id;
      await review.destroy();

      // Recalculate product rating
      const avgRating = await ProductReview.findOne({
        where: { product_id: productId },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average_rating']],
        raw: true,
      });

      const reviewCount = await ProductReview.count({
        where: { product_id: productId },
      });

      await Product.update(
        { average_rating: avgRating?.['average_rating'] || 0, review_count: reviewCount },
        { where: { id: productId } }
      );

      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
      });
    }
  }
}

export default new ReviewController();
