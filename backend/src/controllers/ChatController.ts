import { Response } from 'express';
import { LiveChatSession, LiveChatMessage } from '../models';
import { AuthRequest } from '../middleware/auth';

class ChatController {
  async getLiveChatSessions(req: AuthRequest, res: Response) {
    try {
      const sessions = await LiveChatSession.findAll({
        order: [['updated_at', 'DESC']],
      });

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error('Get chat sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat sessions',
      });
    }
  }

  async getLiveChatMessages(req: AuthRequest, res: Response) {
    try {
      const { chat_session } = req.query;

      const messages = await LiveChatMessage.findAll({
        where: { chat_session },
        order: [['created_at', 'ASC']],
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get messages',
      });
    }
  }

  async saveLiveChatMessage(req: AuthRequest, res: Response) {
    try {
      const { chat_session, sender_type, sender_name, message } = req.body;

      if (!chat_session || !message) {
        return res.status(400).json({
          success: false,
          message: 'chat_session and message are required',
        });
      }

      // Ensure session exists
      let session = await LiveChatSession.findOne({ where: { chat_session } });
      if (!session) {
        session = await LiveChatSession.create({
          chat_session,
          customer_name: sender_name || 'Guest',
          status: 'active',
        });
      }

      const msg = await LiveChatMessage.create({
        chat_session,
        sender_type: sender_type || 'customer',
        sender_name: sender_name || 'Anonymous',
        message,
      });

      // Update session updated_at
      await session.update({ updated_at: new Date() });

      res.status(201).json({
        success: true,
        message: 'Message saved',
        data: msg,
      });
    } catch (error) {
      console.error('Save chat message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save message',
      });
    }
  }

  async markLiveChatRead(req: AuthRequest, res: Response) {
    try {
      const { chat_session } = req.body;

      const session = await LiveChatSession.findOne({ where: { chat_session } });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      await session.update({ is_read_by_admin: true });

      res.json({
        success: true,
        message: 'Marked as read',
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark as read',
      });
    }
  }

  async closeChat(req: AuthRequest, res: Response) {
    try {
      const chat_session = Array.isArray(req.params.chat_session) ? req.params.chat_session[0] : req.params.chat_session;

      const session = await LiveChatSession.findOne({ where: { chat_session } });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      await session.update({ status: 'closed' });

      res.json({
        success: true,
        message: 'Chat closed',
      });
    } catch (error) {
      console.error('Close chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to close chat',
      });
    }
  }
}

export default new ChatController();
