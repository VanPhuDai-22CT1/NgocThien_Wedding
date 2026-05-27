import { Router } from 'express';
import ConsultationController from '../controllers/ConsultationController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, (req, res) =>
  ConsultationController.getConsultations(req, res)
);
router.get('/booked-dates', (req, res) =>
  ConsultationController.getBookedEventDates(req, res)
);

router.post('/', (req, res) => ConsultationController.createConsultation(req, res));
router.put('/:id/status', authMiddleware, adminMiddleware, (req, res) =>
  ConsultationController.updateConsultationStatus(req, res)
);
router.put('/:id/read', authMiddleware, adminMiddleware, (req, res) =>
  ConsultationController.markAsRead(req, res)
);

export default router;
