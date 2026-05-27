import { Router } from 'express';
import ChatController from '../controllers/ChatController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/sessions', authMiddleware, adminMiddleware, (req, res) =>
  ChatController.getLiveChatSessions(req, res)
);
router.get('/messages', (req, res) => ChatController.getLiveChatMessages(req, res));

router.post('/message', (req, res) => ChatController.saveLiveChatMessage(req, res));
router.put('/read', authMiddleware, (req, res) => ChatController.markLiveChatRead(req, res));
router.put('/:chat_session/close', authMiddleware, adminMiddleware, (req, res) =>
  ChatController.closeChat(req, res)
);

export default router;
