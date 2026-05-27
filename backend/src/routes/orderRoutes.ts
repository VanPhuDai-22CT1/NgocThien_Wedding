import { Router } from 'express';
import OrderController from '../controllers/OrderController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, (req, res) =>
  OrderController.getOrders(req, res)
);
router.get('/user/:user_id', authMiddleware, (req, res) =>
  OrderController.getUserOrders(req, res)
);
router.get('/:id', authMiddleware, (req, res) => OrderController.getOrderById(req, res));

router.post('/', authMiddleware, (req, res) => OrderController.createOrder(req, res));
router.put('/:id/status', authMiddleware, adminMiddleware, (req, res) =>
  OrderController.updateOrderStatus(req, res)
);

export default router;
