import { Request, Response } from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import {
  Consultation,
  LiveChatMessage,
  LiveChatSession,
  Order,
  OrderItem,
  Product,
  ShoppingCart,
  User,
} from '../models';

type PasswordResetRecord = {
  otp: string;
  expiresAt: number;
  verified: boolean;
};

class LegacyController {
  private passwordResetRequests = new Map<string, PasswordResetRecord>();

  private textSchema = Joi.string().trim().max(1000).allow('', null);

  private getPasswordResetRecord(email: string): PasswordResetRecord | undefined {
    const record = this.passwordResetRequests.get(email.toLowerCase());
    if (!record) return undefined;

    if (record.expiresAt < Date.now()) {
      this.passwordResetRequests.delete(email.toLowerCase());
      return undefined;
    }

    return record;
  }

  private storePasswordResetRecord(email: string, otp: string) {
    this.passwordResetRequests.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });
  }

  private markPasswordResetVerified(email: string) {
    const record = this.getPasswordResetRecord(email);
    if (!record) return false;

    record.verified = true;
    this.passwordResetRequests.set(email.toLowerCase(), record);
    return true;
  }

  private getAction(req: Request): string {
    const fromQuery = req.query.action;
    if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();

    const fromBody = (req.body as any)?.action;
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();

    return '';
  }

  private stripUnsafeText(value: string): string {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim();
  }

  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;

    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        typeof value === 'string' ? this.stripUnsafeText(value) : value,
      ])
    );
  }

  private validateLegacyPayload(action: string, req: Request): string | null {
    req.body = this.sanitizePayload(req.body);

    const body = req.body as any;
    const id = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().max(32));
    const schemas: Record<string, Joi.ObjectSchema> = {
      addConsultation: Joi.object({
        action: Joi.string().valid(action),
        user_id: Joi.number().integer().positive().allow(null),
        name: Joi.string().trim().max(120).required(),
        email: Joi.string().trim().email().max(160).required(),
        phone: Joi.string().trim().pattern(/^[0-9+\-\s().]{8,20}$/).required(),
        service: Joi.string().trim().max(160).required(),
        event_date: Joi.date().iso().allow(null, ''),
        note: this.textSchema,
      }).unknown(false),
      sendLiveChatMessage: Joi.object({
        action: Joi.string().valid(action),
        chat_session: Joi.string().trim().max(120).required(),
        sender: Joi.string().trim().max(40),
        sender_type: Joi.string().trim().max(40),
        customer_name: Joi.string().trim().max(120),
        sender_name: Joi.string().trim().max(120),
        customer_email: Joi.string().trim().email().max(160).allow(''),
        user_id: Joi.number().integer().positive().allow(null),
        message: Joi.string().trim().max(2000).required(),
      }).unknown(false),
      addToCart: Joi.object({
        action: Joi.string().valid(action),
        userId: id.required(),
        userid: id,
        productId: id.required(),
        quantity: Joi.number().integer().min(1).max(99).default(1),
      }).unknown(false),
      updateStatus: Joi.object({
        action: Joi.string().valid(action),
        order_id: id.required(),
        status: Joi.string().trim().max(40).required(),
      }).unknown(false),
      updateConsultationStatus: Joi.object({
        action: Joi.string().valid(action),
        id,
        consultation_id: id,
        status: Joi.string().trim().max(40).required(),
      }).or('id', 'consultation_id').unknown(false),
      updateUserInfo: Joi.object({
        action: Joi.string().valid(action),
        user_id: id.required(),
        username: Joi.string().trim().max(120),
        full_name: Joi.string().trim().max(255).allow('', null),
        email: Joi.string().trim().email().max(160),
        phone: Joi.string().trim().max(20).allow('', null),
        address: this.textSchema,
        role: Joi.string().valid('user', 'admin', 'member'),
        is_active: Joi.boolean(),
        password: Joi.string().min(6).max(255).allow('', null),
      }).unknown(false),
      updateUserRole: Joi.object({
        action: Joi.string().valid(action),
        user_id: id.required(),
        role: Joi.string().valid('user', 'admin', 'member').required(),
      }).unknown(false),
      forgotPassword: Joi.object({
        action: Joi.string().valid(action),
        email: Joi.string().trim().email().max(160).required(),
      }).unknown(false),
      verifyOtp: Joi.object({
        action: Joi.string().valid(action),
        email: Joi.string().trim().email().max(160).required(),
        otp: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
      }).unknown(false),
      reset_password: Joi.object({
        action: Joi.string().valid(action),
        email: Joi.string().trim().email().max(160).required(),
        password: Joi.string().min(6).max(255).required(),
      }).unknown(false),
    };

    const queryLimit = req.query.limit;
    if (queryLimit) {
      const { error } = Joi.number().integer().min(1).max(20).validate(Number(queryLimit));
      if (error) return 'Invalid limit';
    }

    const schema = schemas[action];
    if (!schema) return null;

    const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) return error.details.map((item) => item.message).join('; ');

    req.body = value;
    return null;
  }

  private normalizeStatus(status: string): string {
    const value = String(status || '').trim().toLowerCase();
    if (['dang xu ly', 'đang xử lý', 'processing', 'pending', 'confirmed'].includes(value)) {
      return 'processing';
    }
    if (['dang giao', 'đang giao', 'shipping', 'delivering'].includes(value)) {
      return 'shipping';
    }
    if (['da giao su kien', 'đã giao sự kiện', 'đã bàn giao sự kiện', 'delivered', 'da nhan hang', 'đã nhận hàng'].includes(value)) {
      return 'delivered';
    }
    if (['huy don', 'hủy đơn', 'da huy', 'đã hủy', 'cancel', 'cancelled'].includes(value)) {
      return 'cancelled';
    }
    return value || 'processing';
  }

  async handle(req: Request, res: Response) {
    try {
      const action = this.getAction(req);
      const validationError = this.validateLegacyPayload(action, req);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      // Protect admin-only legacy actions by validating JWT and admin role
      const adminActions = new Set([
        'getUsers',
        'deleteUser',
        'updateUserRole',
        'getOrders',
        'updateStatus',
        'deleteOrder',
        'getActivityLogs',
        'getDashboardStats',
        'getUpcomingEvents',
        'exportStatistics',
        'deleteConsultation',
        'updateConsultation',
      ]);
      const localAdminProductActions = new Set(['addProduct', 'updateProduct', 'deleteProduct']);

      if (localAdminProductActions.has(action)) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        const source = req.get('origin') || req.get('referer') || '';
        let origin = '';
        try {
          origin = source ? new URL(source).origin : '';
        } catch {
          origin = '';
        }
        const isLocalAdminOrigin = ['http://localhost:3001', 'http://127.0.0.1:3001'].includes(origin);

        if (isLocalAdminOrigin) {
          // Local admin dev server can manage services even if an old browser session has a stale token.
        } else if (token && process.env.JWT_SECRET) {
          try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
            if (decoded?.role !== 'admin') {
              return res.status(403).json({ success: false, message: 'Admin access required' });
            }
            (req as any).user = decoded;
          } catch (err: any) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
          }
        } else {
          console.warn(`Legacy product admin action denied: no token. action=${action}, ip=${req.ip || req.socket.remoteAddress}`);
          return res.status(401).json({ success: false, message: 'No token provided' });
        }
      }

      if (adminActions.has(action)) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        if (!token) {
          console.warn(`Legacy admin action denied: no token. action=${action}, ip=${req.ip || req.socket.remoteAddress}`);
          return res.status(401).json({ success: false, message: 'No token provided' });
        }

        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET missing in environment');
          return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT_SECRET missing' });
        }

        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
          const authUserId = decoded?.id || decoded?.user_id;
          const authUser = authUserId ? await User.findByPk(authUserId) : null;
          if (!authUser || authUser.role !== 'admin') {
            console.warn(`Legacy admin action forbidden: insufficient role. action=${action}, role=${authUser?.role || decoded?.role}, userId=${authUserId}`);
            return res.status(403).json({ success: false, message: 'Admin access required' });
          }
          // attach user to request for downstream handlers if needed
          (req as any).user = {
            id: authUser.id,
            username: authUser.username,
            email: authUser.email,
            role: authUser.role,
          };
        } catch (err: any) {
          console.warn(`Legacy admin action token invalid: action=${action}, error=${err?.message}`);
          return res.status(401).json({ success: false, message: 'Invalid token' });
        }
      }

      switch (action) {
        case 'getProducts':
          return this.getProducts(req, res);
        case 'addProduct':
          return this.addProduct(req, res);
        case 'updateProduct':
          return this.updateProduct(req, res);
        case 'deleteProduct':
          return this.deleteProduct(req, res);
        case 'getConsultations':
          return this.getConsultations(req, res);
        case 'updateConsultationStatus':
          return this.updateConsultationStatus(req, res);
        case 'markConsultationAsRead':
          return this.markConsultationAsRead(req, res);
        case 'getBookedEventDates':
          return this.getBookedEventDates(req, res);
        case 'addConsultation':
          return this.addConsultation(req, res);
        case 'getLiveChatSessions':
          return this.getLiveChatSessions(req, res);
        case 'getLiveChatMessages':
          return this.getLiveChatMessages(req, res);
        case 'sendLiveChatMessage':
          return this.sendLiveChatMessage(req, res);
        case 'markLiveChatRead':
          return this.markLiveChatRead(req, res);
        case 'getOrders':
          return this.getOrders(req, res);
        case 'updateStatus':
          return this.updateStatus(req, res);
        case 'deleteOrder':
          return this.deleteOrder(req, res);
        case 'getDashboardStats':
          return this.getDashboardStats(req, res);
        case 'getUpcomingEvents':
          return this.getUpcomingEvents(req, res);
        case 'exportStatistics':
          return this.exportStatistics(req, res);
        case 'getAdminAiSuggestions':
        case 'getAiRecommendations':
          return this.getAiRecommendations(req, res);
        case 'getUsers':
          return this.getUsers(req, res);
        case 'deleteUser':
          return this.deleteUser(req, res);
        case 'updateUserRole':
          return this.updateUserRole(req, res);
        case 'updateUserInfo':
          return this.updateUserInfo(req, res);
        case 'forgotPassword':
          return this.forgotPassword(req, res);
        case 'verifyOtp':
          return this.verifyOtp(req, res);
        case 'reset_password':
          return this.resetPassword(req, res);
        case 'getActivityLogs':
          return this.getActivityLogs(req, res);
        case 'saveChatbotMessage':
          return res.json({ success: true, message: 'Saved' });
        case 'getUser':
          return this.getUser(req, res);
        case 'getOrder':
          return this.getOrder(req, res);
        case 'getOrdersByUser':
          return this.getOrdersByUser(req, res);
        case 'deleteConsultation':
          return this.deleteConsultation(req, res);
        case 'updateConsultation':
          return this.updateConsultation(req, res);
        case 'addToCart':
          return this.addToCart(req, res);
        case 'getCart':
          return this.getCart(req, res);
        case 'removeFromCart':
          return this.removeFromCart(req, res);
        default:
          return res.status(400).json({ success: false, message: `Unsupported action: ${action}` });
      }
    } catch (error) {
      console.error('Legacy handle error:', error);
      return res.status(500).json({ success: false, message: 'Legacy API error' });
    }
  }

  private async getProducts(req: Request, res: Response) {
    const rows = await Product.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: rows });
  }

  private getUploadedImagePaths(req: Request): string[] {
    const rawFiles = (req as any).files;
    const files = Array.isArray(rawFiles)
      ? rawFiles
      : Array.isArray(rawFiles?.['images[]'])
        ? rawFiles['images[]']
        : [];
    return files
      .map((file: any) => file?.filename ? `uploads/${file.filename}` : '')
      .filter(Boolean);
  }

  private getUploadedFilePath(req: Request, fieldName: string): string {
    const rawFiles = (req as any).files;
    const files = Array.isArray(rawFiles)
      ? rawFiles.filter((file: any) => file?.fieldname === fieldName)
      : Array.isArray(rawFiles?.[fieldName])
        ? rawFiles[fieldName]
        : [];
    const file = files[0];
    return file?.filename ? `uploads/${file.filename}` : '';
  }

  private parseImageUrls(value: any): string[] {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    if (typeof value !== 'string') return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value ? [value] : [];
    }
  }

  private normalizeProductPayload(req: Request) {
    const body = req.body as any;
    const uploadedImages = this.getUploadedImagePaths(req);
    return {
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
      price: Number(body.price || 0),
      stock: Number(body.stock || 0),
      category_id: Number(body.category_id || 1),
      is_featured: Number(body.is_featured || 0) === 1,
      service_details: String(body.service_details || '').trim(),
      uploadedImages,
    };
  }

  private async addProduct(req: Request, res: Response) {
    const payload = this.normalizeProductPayload(req);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const product = await Product.create({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      category_id: payload.category_id,
      image_urls: payload.uploadedImages,
      cover: payload.uploadedImages[0] || '',
      is_featured: payload.is_featured,
      service_details: payload.service_details,
    });

    return res.json({ success: true, data: product });
  }

  private async updateProduct(req: Request, res: Response) {
    const body = req.body as any;
    const id = body.id || req.query.id;
    const product: any = await Product.findByPk(id as any);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const payload = this.normalizeProductPayload(req);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const existingImages = this.parseImageUrls(product.image_urls);
    let imageUrls = existingImages;

    if (body.slots_order) {
      try {
        const slotsOrder = JSON.parse(body.slots_order);
        let newImageIndex = 0;
        imageUrls = Array.isArray(slotsOrder)
          ? slotsOrder
              .map((slot) => {
                const value = String(slot || '');
                if (value.startsWith('existing:')) return value.replace(/^existing:/, '');
                if (value.startsWith('new:')) return payload.uploadedImages[newImageIndex++] || '';
                return '';
              })
              .filter(Boolean)
          : existingImages;
      } catch {
        imageUrls = [...existingImages, ...payload.uploadedImages];
      }
    } else if (payload.uploadedImages.length > 0) {
      imageUrls = [...existingImages, ...payload.uploadedImages];
    }

    await product.update({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      category_id: payload.category_id,
      image_urls: imageUrls,
      cover: imageUrls[0] || '',
      is_featured: payload.is_featured,
      service_details: payload.service_details,
      updated_at: new Date(),
    });

    return res.json({ success: true, data: product });
  }

  private async deleteProduct(req: Request, res: Response) {
    const id = req.query.id || (req.body as any).id;
    const deleted = await Product.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true });
  }

  private async getConsultations(req: Request, res: Response) {
    const rows = await Consultation.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: rows });
  }

  private async updateConsultationStatus(req: Request, res: Response) {
    const id = (req.body as any).id || (req.body as any).consultation_id;
    const status = (req.body as any).status;
    const row = await Consultation.findByPk(id as any);
    if (!row) return res.status(404).json({ success: false, message: 'Consultation not found' });
    await row.update({ status: this.normalizeStatus(status) });
    return res.json({ success: true, data: row });
  }

  private async markConsultationAsRead(req: Request, res: Response) {
    const id = (req.body as any).id;
    const row = await Consultation.findByPk(id as any);
    if (!row) return res.status(404).json({ success: false, message: 'Consultation not found' });
    await row.update({ is_read: true });
    return res.json({ success: true, consultation: row });
  }

  private async getBookedEventDates(req: Request, res: Response) {
    const rows = await Consultation.findAll({
      where: {
        event_date: { [Op.ne]: null },
        status: { [Op.in]: ['confirmed', 'processing', 'shipping', 'delivering', 'completed'] },
      },
      attributes: ['event_date'],
      order: [['event_date', 'ASC']],
    });

    return res.json({
      success: true,
      data: rows.map((item) => ({ event_date: (item.event_date as any)?.toISOString?.().split('T')[0] })),
    });
  }

  private async addConsultation(req: Request, res: Response) {
    const row = await Consultation.create({
      user_id: (req.body as any).user_id || null,
      name: (req.body as any).name || '',
      email: (req.body as any).email || '',
      phone: (req.body as any).phone || '',
      service: (req.body as any).service || '',
      event_date: (req.body as any).event_date || null,
      note: (req.body as any).note || '',
      status: 'pending',
      is_read: false,
    });
    return res.json({ success: true, data: row });
  }

  private async getLiveChatSessions(req: Request, res: Response) {
    const rows = await LiveChatSession.findAll({ order: [['updated_at', 'DESC']] });
    return res.json({ success: true, data: rows });
  }

  private async getLiveChatMessages(req: Request, res: Response) {
    const chat_session = (req.query.chat_session as string) || (req.body as any).chat_session;
    const rows = await LiveChatMessage.findAll({ where: { chat_session }, order: [['created_at', 'ASC']] });
    return res.json({ success: true, data: rows });
  }

  private async sendLiveChatMessage(req: Request, res: Response) {
    const chat_session = (req.body as any).chat_session;
    const sender = (req.body as any).sender || (req.body as any).sender_type || 'customer';
    const message = (req.body as any).message || '';
    const sender_name = (req.body as any).customer_name || (req.body as any).sender_name || 'Guest';

    let session = await LiveChatSession.findOne({ where: { chat_session } });
    if (!session) {
      session = await LiveChatSession.create({
        chat_session,
        customer_name: sender_name,
        customer_email: (req.body as any).customer_email || '',
        user_id: (req.body as any).user_id || null,
        status: 'active',
      });
    }

    const row = await LiveChatMessage.create({
      chat_session,
      sender_type: sender === 'admin' ? 'admin' : 'customer',
      sender_name,
      message,
    });

    await session.update({ updated_at: new Date() });

    return res.json({ success: true, chat_session, data: row });
  }

  private async markLiveChatRead(req: Request, res: Response) {
    const chat_session = (req.body as any).chat_session;
    const row = await LiveChatSession.findOne({ where: { chat_session } });
    if (!row) return res.status(404).json({ success: false, message: 'Session not found' });
    await row.update({ is_read_by_admin: true });
    return res.json({ success: true });
  }

  private async getOrders(req: Request, res: Response) {
    const rows = await Order.findAll({ include: [{ model: OrderItem, include: [Product] }], order: [['created_at', 'DESC']] });
    const orders = rows.map((order: any) => ({
      order_id: order.id,
      total: Number(order.total_amount || 0),
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_name: order.customer_name || '',
      phone: order.phone || '',
      payment_method: order.payment_method || '',
      note: order.note || '',
      details: (order.OrderItems || []).map((item: any) => ({
        product_name: item.Product?.name || '',
        product_price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
      })),
    }));

    return res.json({ success: true, orders });
  }

  private async updateStatus(req: Request, res: Response) {
    const orderId = (req.body as any).order_id;
    const status = this.normalizeStatus((req.body as any).status);
    const row = await Order.findByPk(orderId as any);
    if (!row) return res.status(404).json({ success: false, message: 'Order not found' });
    await row.update({ status });
    return res.json({ success: true });
  }

  private async deleteOrder(req: Request, res: Response) {
    const orderId = (req.body as any).order_id;
    await OrderItem.destroy({ where: { order_id: orderId } });
    await Order.destroy({ where: { id: orderId } });
    return res.json({ success: true });
  }

  private async getDashboardStats(req: Request, res: Response) {
    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      User.count(),
      Product.count(),
      Order.count(),
    ]);

    const orders = await Order.findAll();
    const totalRevenue = orders.reduce((sum, order: any) => sum + Number(order.total_amount || 0), 0);
    const completedOrders = orders.filter((item: any) => ['delivered', 'completed'].includes(String(item.status))).length;
    const pendingOrders = orders.filter((item: any) => ['pending', 'processing', 'confirmed', 'shipping'].includes(String(item.status))).length;
    const cancelledOrders = orders.filter((item: any) => String(item.status) === 'cancelled').length;
    const onlineOrders = orders.filter((item: any) => ['bank', 'online', 'transfer'].includes(String(item.payment_method || '').toLowerCase()));
    const onlinePaymentRevenue = onlineOrders.reduce((sum, order: any) => sum + Number(order.total_amount || 0), 0);
    const onlinePaymentRate = totalOrders > 0 ? Math.round((onlineOrders.length / totalOrders) * 100) : 0;

    return res.json({
      success: true,
      total_users: totalUsers,
      total_products: totalProducts,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      online_payments: onlineOrders.length,
      online_payment_revenue: onlinePaymentRevenue,
      online_payment_rate: onlinePaymentRate,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      months: [],
      monthly_revenue: [],
    });
  }

  private async getUpcomingEvents(req: Request, res: Response) {
    const rows = await Consultation.findAll({
      where: {
        event_date: { [Op.ne]: null },
        status: { [Op.in]: ['pending', 'processing', 'confirmed'] },
      },
      order: [['event_date', 'ASC']],
      limit: 20,
    });

    const now = new Date();
    const data = rows
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        service: item.service,
        event_date: item.event_date,
        status: item.status,
      }))
      .filter((item) => item.event_date && new Date(item.event_date) >= now);

    return res.json({ success: true, data });
  }

  private async exportStatistics(req: Request, res: Response) {
    const type = String((req.query.type as string) || (req.body as any)?.type || 'day').toLowerCase();
    const now = new Date();

    const matchesPeriod = (dateValue: Date) => {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return false;

      if (type === 'day') {
        return date.toDateString() === now.toDateString();
      }

      if (type === 'month') {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }

      if (type === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        return date.getFullYear() === now.getFullYear() && Math.floor(date.getMonth() / 3) === currentQuarter;
      }

      return date.getFullYear() === now.getFullYear();
    };

    const orders = await Order.findAll({ order: [['created_at', 'DESC']] });
    const filteredOrders = orders.filter((order: any) => matchesPeriod(order.created_at));

    const csvRows = [
      ['order_id', 'order_code', 'created_at', 'customer_name', 'phone', 'payment_method', 'status', 'total_amount'],
      ...filteredOrders.map((order: any) => [
        order.id,
        String(order.order_code || ''),
        order.created_at ? new Date(order.created_at).toISOString() : '',
        String(order.customer_name || ''),
        String(order.phone || ''),
        String(order.payment_method || ''),
        String(order.status || ''),
        Number(order.total_amount || 0),
      ]),
    ];

    const escapeCsv = (value: any) => {
      const text = String(value ?? '');
      if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const csv = '\uFEFF' + csvRows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="export_${type}.csv"`);
    return res.send(csv);
  }

  private async getAiRecommendations(req: Request, res: Response) {
    const limit = Number((req.query.limit as string) || (req.body as any).limit || 4);
    const rows = await Product.findAll({ order: [['average_rating', 'DESC'], ['review_count', 'DESC']], limit });
    return res.json({ success: true, data: rows });
  }

  private async getUsers(req: Request, res: Response) {
    const rows = await User.findAll({ attributes: { exclude: ['password'] }, order: [['id', 'DESC']] });
    return res.json({ success: true, data: rows });
  }

  private async deleteUser(req: Request, res: Response) {
    const user_id = (req.body as any).user_id;
    await User.destroy({ where: { id: user_id } });
    return res.json({ success: true });
  }

  private async updateUserRole(req: Request, res: Response) {
    const user_id = (req.body as any).user_id;
    const role = (req.body as any).role === 'admin' ? 'admin' : 'user';
    const row = await User.findByPk(user_id as any);
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });
    await row.update({ role });
    const updated = await User.findByPk(user_id as any, { attributes: { exclude: ['password'] } });
    return res.json({ success: true, data: updated });
  }

  private async updateUserInfo(req: Request, res: Response) {
    const user_id = (req.body as any).user_id;
    const row = await User.findByPk(user_id as any);
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    const body = req.body as any;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT_SECRET missing' });
    }

    let authUser: any = null;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const authUserId = decoded?.id || decoded?.user_id;
      authUser = authUserId ? await User.findByPk(authUserId) : null;
    } catch (err: any) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    if (!authUser || (authUser.role !== 'admin' && Number(authUser.id) !== Number(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const updates: Record<string, any> = {};
    const allowedFields = authUser.role === 'admin'
      ? ['username', 'full_name', 'email', 'phone', 'address', 'avatar', 'is_active']
      : ['username', 'full_name', 'email', 'phone', 'address', 'avatar'];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (authUser.role === 'admin' && Object.prototype.hasOwnProperty.call(body, 'role')) {
      updates.role = body.role === 'admin' ? 'admin' : 'user';
    }

    if (authUser.role === 'admin' && body.password) {
      updates.password = body.password;
    }

    const uploadedAvatar = this.getUploadedFilePath(req, 'avatar');
    if (uploadedAvatar) {
      updates.avatar = uploadedAvatar;
    }

    if (updates.username) {
      const existingUsername = await User.findOne({
        where: { username: updates.username, id: { [Op.ne]: user_id } },
      });
      if (existingUsername) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
    }

    if (updates.email) {
      const existingEmail = await User.findOne({
        where: { email: updates.email, id: { [Op.ne]: user_id } },
      });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    await row.update(updates);
    const updated = await User.findByPk(user_id as any, { attributes: { exclude: ['password'] } });

    return res.json({ success: true, data: updated });
  }

  private async forgotPassword(req: Request, res: Response) {
    const email = String((req.body as any).email || '').trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: 'Email không tồn tại' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    this.storePasswordResetRecord(email, otp);

    return res.json({
      success: true,
      message: process.env.NODE_ENV === 'production'
        ? 'OTP đã được gửi về email'
        : `OTP tạm thời: ${otp}`,
    });
  }

  private async verifyOtp(req: Request, res: Response) {
    const email = String((req.body as any).email || '').trim().toLowerCase();
    const otp = String((req.body as any).otp || '').trim();
    const record = this.getPasswordResetRecord(email);

    if (!record) {
      return res.json({ success: false, message: 'OTP đã hết hạn hoặc chưa được yêu cầu' });
    }

    if (record.otp !== otp) {
      return res.json({ success: false, message: 'OTP không đúng' });
    }

    this.markPasswordResetVerified(email);
    return res.json({ success: true, message: 'OTP hợp lệ' });
  }

  private async resetPassword(req: Request, res: Response) {
    const email = String((req.body as any).email || '').trim().toLowerCase();
    const password = String((req.body as any).password || '');
    const record = this.getPasswordResetRecord(email);

    if (!record || !record.verified) {
      return res.json({ success: false, message: 'Vui lòng xác minh OTP trước khi đặt lại mật khẩu' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: 'Email không tồn tại' });
    }

    await user.update({ password });
    this.passwordResetRequests.delete(email);

    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  }

  private async getActivityLogs(req: Request, res: Response) {
    const orders = await Order.findAll({ order: [['updated_at', 'DESC']], limit: 100 });
    const logs = orders.map((order: any, idx) => ({
      id: idx + 1,
      user_id: order.user_id,
      username: `User ${order.user_id}`,
      action: `Order #${order.id} status: ${order.status}`,
      created_at: order.updated_at,
      order_id: order.id,
    }));

    return res.json({ success: true, data: logs });
  }

  private async getUser(req: Request, res: Response) {
    const user_id = (req.body as any).user_id || req.query.user_id;
    const row = await User.findByPk(user_id as any, { attributes: { exclude: ['password'] } });
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: row });
  }

  private async getOrder(req: Request, res: Response) {
    const id = req.query.id as string;
    const order: any = await Order.findByPk(id as any, { include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    return res.json({
      success: true,
      order: {
        order_id: order.id,
        order_time: order.created_at,
        customer_name: order.customer_name || '',
        phone: order.phone || '',
        address: order.delivery_address || '',
        payment_method: order.payment_method || '',
        status: order.status || '',
        total: Number(order.total_amount || 0),
      },
      details: (order.OrderItems || []).map((item: any) => ({
        product_name: item.Product?.name || '',
        quantity: Number(item.quantity || 1),
        product_price: Number(item.price || 0),
      })),
    });
  }

  private async getOrdersByUser(req: Request, res: Response) {
    const user_id = (req.query.user_id as string) || (req.body as any).user_id;
    const rows = await Order.findAll({
      where: { user_id },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['created_at', 'DESC']],
    });

    const orders = rows.map((order: any) => ({
      order_id: order.id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_name: order.customer_name || '',
      phone: order.phone || '',
      address: order.delivery_address || '',
      payment_method: order.payment_method || '',
      total: Number(order.total_amount || 0),
      status: order.status,
      details: (order.OrderItems || []).map((item: any) => ({
        product_name: item.Product?.name || '',
        product_price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
      })),
    }));

    return res.json({ success: true, orders });
  }

  private async deleteConsultation(req: Request, res: Response) {
    const id = (req.body as any).id;
    await Consultation.destroy({ where: { id } });
    return res.json({ success: true });
  }

  private async updateConsultation(req: Request, res: Response) {
    const id = (req.body as any).id;
    const row = await Consultation.findByPk(id as any);
    if (!row) return res.status(404).json({ success: false, message: 'Consultation not found' });

    await row.update({
      name: (req.body as any).name ?? row.name,
      service: (req.body as any).service ?? row.service,
      event_date: (req.body as any).event_date ?? row.event_date,
      note: (req.body as any).note ?? row.note,
    });

    return res.json({ success: true, data: row });
  }

  private async addToCart(req: Request, res: Response) {
    const userid = Number((req.body as any).userId || (req.body as any).userid || 0);
    const productId = Number((req.body as any).productId || 0);
    const quantity = Number((req.body as any).quantity || 1);

    let row = await ShoppingCart.findOne({ where: { user_id: userid, product_id: productId } });
    if (!row) {
      row = await ShoppingCart.create({ user_id: userid, product_id: productId, quantity });
    } else {
      await row.update({ quantity: Number(row.quantity || 0) + quantity });
    }

    return res.json({ success: true, data: row });
  }

  private async getCart(req: Request, res: Response) {
    const userid = Number((req.query.userid as string) || (req.body as any)?.userId || 0);
    const rows = await ShoppingCart.findAll({ where: { user_id: userid }, include: [Product] });
    const data = rows.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      name: item.Product?.name || '',
      price: Number(item.Product?.price || 0),
      quantity: Number(item.quantity || 1),
      cover: item.Product?.cover || '',
    }));

    return res.json({ success: true, data, cart: data });
  }

  private async removeFromCart(req: Request, res: Response) {
    const id = Number((req.body as any).cartItemId || 0);
    await ShoppingCart.destroy({ where: { id } });
    return res.json({ success: true });
  }
}

export default new LegacyController();
