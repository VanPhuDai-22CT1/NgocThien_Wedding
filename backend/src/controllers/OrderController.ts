import { Response } from 'express';
import { Order, OrderItem, Product } from '../models';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

class OrderController {
  async getOrders(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status, user_id } = req.query;
      const offset = ((page as unknown as number) - 1) * (limit as unknown as number);

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (user_id) {
        where.user_id = user_id;
      }

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [{ model: OrderItem, include: [Product] }],
        limit: limit as unknown as number,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        orders: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / (limit as unknown as number)),
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
      });
    }
  }

  async getOrderById(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const order = await Order.findByPk(id as any, {
        include: [{ model: OrderItem, include: [Product] }],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order',
      });
    }
  }

  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { user_id, items, delivery_address, phone, email, payment_method } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order items are required',
        });
      }

      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.product_id} not found`,
          });
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          product_id: product.id,
          quantity: item.quantity,
          price: product.price,
          subtotal,
        });
      }

      const order = await Order.create({
        user_id,
        order_code: `ORD-${Date.now()}`,
        total_amount: totalAmount,
        status: 'pending',
        delivery_address,
        phone,
        email,
        payment_method,
      });

      await OrderItem.bulkCreate(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: order.id,
          order_code: order.order_code,
          total_amount: order.total_amount,
        },
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
      });
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;

      const order = await Order.findByPk(id as any);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      await order.update({ status });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
      });
    }
  }

  async getUserOrders(req: AuthRequest, res: Response) {
    try {
      const { user_id } = req.params;

      const orders = await Order.findAll({
        where: { user_id },
        include: [{ model: OrderItem, include: [Product] }],
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user orders',
      });
    }
  }
}

export default new OrderController();
