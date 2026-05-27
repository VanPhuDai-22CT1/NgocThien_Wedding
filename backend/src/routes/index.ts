import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import cartRoutes from './cartRoutes';
import consultationRoutes from './consultationRoutes';
import reviewRoutes from './reviewRoutes';
import chatRoutes from './chatRoutes';
import legacyRoutes from './legacyRoutes';
import homepageConfigRoutes from './homepageConfigRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/consultations', consultationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/legacy', legacyRoutes);
router.use('/homepage-config', homepageConfigRoutes);

export default router;
