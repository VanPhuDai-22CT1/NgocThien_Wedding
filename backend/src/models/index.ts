import User from './User';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';
import ProductReview from './ProductReview';
import Consultation from './Consultation';
import LiveChatSession from './LiveChatSession';
import LiveChatMessage from './LiveChatMessage';
import ShoppingCart from './ShoppingCart';
import HomepageConfig from './HomepageConfig';

// Define associations
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ProductReview, { foreignKey: 'user_id' });
ProductReview.belongsTo(User, { foreignKey: 'user_id' });

Product.hasMany(ProductReview, { foreignKey: 'product_id' });
ProductReview.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

User.hasMany(ShoppingCart, { foreignKey: 'user_id' });
ShoppingCart.belongsTo(User, { foreignKey: 'user_id' });

Product.hasMany(ShoppingCart, { foreignKey: 'product_id' });
ShoppingCart.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Consultation, { foreignKey: 'user_id' });
Consultation.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(LiveChatSession, { foreignKey: 'user_id' });
LiveChatSession.belongsTo(User, { foreignKey: 'user_id' });

LiveChatSession.hasMany(LiveChatMessage, { foreignKey: 'chat_session', sourceKey: 'chat_session' });
LiveChatMessage.belongsTo(LiveChatSession, { foreignKey: 'chat_session', targetKey: 'chat_session' });

export {
  User,
  Product,
  Order,
  OrderItem,
  ProductReview,
  Consultation,
  LiveChatSession,
  LiveChatMessage,
  ShoppingCart,
  HomepageConfig,
};
