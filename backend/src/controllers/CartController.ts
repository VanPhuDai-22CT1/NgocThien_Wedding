import { Response } from 'express';
import { ShoppingCart, Product } from '../models';
import { AuthRequest } from '../middleware/auth';

class CartController {
  private parsePositiveInt(value: unknown): number | null {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) return null;
    return num;
  }

  private resolveTargetUserId(req: AuthRequest, requestedUserId?: unknown): number | null {
    const authUserId = req.user?.id;
    if (!authUserId) return null;

    if (req.user?.role === 'admin' && requestedUserId !== undefined) {
      return this.parsePositiveInt(requestedUserId);
    }

    return authUserId;
  }

  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = this.resolveTargetUserId(req, req.query.userid);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user id',
        });
      }

      const cartItems = await ShoppingCart.findAll({
        where: { user_id: userId },
        include: [{ model: Product }],
      });

      const items = cartItems.map((item) => {
        const product = (item as any).Product;
        return {
          id: item.id,
          productId: item.product_id,
          name: product?.name,
          price: product?.price,
          quantity: item.quantity,
          subtotal: (product?.price || 0) * item.quantity,
        };
      });

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart',
      });
    }
  }

  async addToCart(req: AuthRequest, res: Response) {
    try {
      const { userid, productId, quantity } = req.body;
      const userId = this.resolveTargetUserId(req, userid);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user id',
        });
      }

      const parsedProductId = this.parsePositiveInt(productId);
      const parsedQuantity = this.parsePositiveInt(quantity);
      if (!parsedProductId || !parsedQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Invalid productId or quantity',
        });
      }

      let cartItem = await ShoppingCart.findOne({
        where: { user_id: userId, product_id: parsedProductId },
      });

      if (cartItem) {
        await cartItem.update({ quantity: cartItem.quantity + parsedQuantity });
      } else {
        cartItem = await ShoppingCart.create({
          user_id: userId,
          product_id: parsedProductId,
          quantity: parsedQuantity,
        });
      }

      res.json({
        success: true,
        message: 'Added to cart',
        data: cartItem,
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add to cart',
      });
    }
  }

  async removeFromCart(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cartId = this.parsePositiveInt(id);
      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item id',
        });
      }

      const cartItem = await ShoppingCart.findByPk(cartId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      if (req.user?.role !== 'admin' && cartItem.user_id !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
      }

      await cartItem.destroy();

      res.json({
        success: true,
        message: 'Removed from cart',
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove from cart',
      });
    }
  }

  async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { quantity } = req.body;
      const cartId = this.parsePositiveInt(id);
      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item id',
        });
      }

      const parsedQuantity = Number(quantity);
      if (!Number.isFinite(parsedQuantity)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity',
        });
      }

      const cartItem = await ShoppingCart.findByPk(cartId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      if (req.user?.role !== 'admin' && cartItem.user_id !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
      }

      if (parsedQuantity <= 0) {
        await cartItem.destroy();
      } else {
        await cartItem.update({ quantity: Math.floor(parsedQuantity) });
      }

      res.json({
        success: true,
        message: 'Cart updated',
      });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart',
      });
    }
  }

  async clearCart(req: AuthRequest, res: Response) {
    try {
      const { userid } = req.params;
      const userId = this.resolveTargetUserId(req, userid);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user id',
        });
      }

      await ShoppingCart.destroy({ where: { user_id: userId } });

      res.json({
        success: true,
        message: 'Cart cleared',
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
      });
    }
  }
}

export default new CartController();
