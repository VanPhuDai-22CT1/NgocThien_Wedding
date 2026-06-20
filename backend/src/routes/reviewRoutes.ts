import { Router } from 'express';
import ReviewController from '../controllers/ReviewController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/product/:productId', (req, res) =>
  ReviewController.getProductReviews(req, res)
);

router.post('/', authMiddleware, (req, res) => ReviewController.addReview(req, res));
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) =>
  ReviewController.deleteReview(req, res)
);

export default router;
