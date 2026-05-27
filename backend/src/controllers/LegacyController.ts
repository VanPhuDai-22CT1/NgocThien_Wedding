import { Request, Response } from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
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

class LegacyController {
  private textSchema = Joi.string().trim().max(1000).allow('', null);

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
        email: Joi.string().trim().email().max(160),
        phone: Joi.string().trim().max(20),
        address: this.textSchema,
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

      switch (action) {
        case 'getProducts':
          return this.getProducts(req, res);
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

    return res.json({
      success: true,
      total_users: totalUsers,
      total_products: totalProducts,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      months: [],
      monthly_revenue: [],
    });
  }

  private async getAiRecommendations(req: Request, res: Response) {
    const limit = Number((req.query.limit as string) || (req.body as any).limit || 4);
    const rows = await Product.findAll({ order: [['average_rating', 'DESC'], ['review_count', 'DESC']], limit });
    return res.json({ success: true, data: rows });
  }

  private async getUsers(req: Request, res: Response) {
    const rows = await User.findAll({ attributes: { exclude: ['password'] }, order: [['id', 'DESC']] });
    return res.json(rows);
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
    return res.json({ success: true });
  }

  private async updateUserInfo(req: Request, res: Response) {
    const user_id = (req.body as any).user_id;
    const row = await User.findByPk(user_id as any);
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    await row.update({
      username: (req.body as any).username || row.username,
      email: (req.body as any).email || row.email,
      phone: (req.body as any).phone || row.phone,
      address: (req.body as any).address || row.address,
    });

    return res.json({ success: true, data: row });
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
