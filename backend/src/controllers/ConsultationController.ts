import { Response } from 'express';
import { Consultation } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

class ConsultationController {
  async getConsultations(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = ((page as unknown as number) - 1) * (limit as unknown as number);

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Consultation.findAndCountAll({
        where,
        limit: limit as unknown as number,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / (limit as unknown as number)),
        },
      });
    } catch (error) {
      console.error('Get consultations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get consultations',
      });
    }
  }

  async createConsultation(req: AuthRequest, res: Response) {
    try {
      const { user_id, name, email, phone, service, event_date, note } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and phone are required',
        });
      }

      const consultation = await Consultation.create({
        user_id: user_id || null,
        name,
        email,
        phone,
        service: service || '',
        event_date: event_date || null,
        note: note || '',
        status: 'pending',
        is_read: false,
      });

      res.status(201).json({
        success: true,
        message: 'Consultation request created',
        data: consultation,
      });
    } catch (error) {
      console.error('Create consultation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create consultation',
      });
    }
  }

  async updateConsultationStatus(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;

      const consultation = await Consultation.findByPk(id as any);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found',
        });
      }

      await consultation.update({ status });

      res.json({
        success: true,
        message: 'Consultation status updated',
        data: consultation,
      });
    } catch (error) {
      console.error('Update consultation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update consultation',
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const consultation = await Consultation.findByPk(id as any);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found',
        });
      }

      await consultation.update({ is_read: true });

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

  async getBookedEventDates(req: AuthRequest, res: Response) {
    try {
      const consultations = await Consultation.findAll({
        where: {
          status: { [Op.in]: ['confirmed', 'processing', 'delivering', 'completed'] },
          event_date: { [Op.ne]: null },
        },
        attributes: ['event_date'],
      });

      const dates = consultations.map((c) => ({
        event_date: c.event_date?.toISOString().split('T')[0],
      }));

      res.json({
        success: true,
        data: dates,
      });
    } catch (error) {
      console.error('Get booked dates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get booked dates',
      });
    }
  }
}

export default new ConsultationController();
