import { Router } from 'express';
import CartController from '../controllers/CartController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req, res) => CartController.getCart(req, res));
router.post('/', authMiddleware, (req, res) => CartController.addToCart(req, res));
router.delete('/:id', authMiddleware, (req, res) => CartController.removeFromCart(req, res));
router.put('/:id', authMiddleware, (req, res) => CartController.updateCartItem(req, res));
router.delete('/user/:userid', authMiddleware, (req, res) => CartController.clearCart(req, res));

export default router;
