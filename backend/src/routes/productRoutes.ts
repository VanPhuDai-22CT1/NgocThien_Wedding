import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', (req, res) => ProductController.getProducts(req, res));
router.get('/featured', (req, res) => ProductController.getFeaturedProducts(req, res));
router.get('/:id', (req, res) => ProductController.getProductById(req, res));

router.post('/', authMiddleware, adminMiddleware, (req, res) =>
  ProductController.createProduct(req, res)
);
router.put('/:id', authMiddleware, adminMiddleware, (req, res) =>
  ProductController.updateProduct(req, res)
);
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) =>
  ProductController.deleteProduct(req, res)
);

export default router;
