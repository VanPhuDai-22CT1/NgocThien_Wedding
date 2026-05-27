import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Order extends Model {
  public id!: number;
  public user_id!: number;
  public order_code!: string;
  public total_amount!: number;
  public status!: string;
  public delivery_address!: string;
  public phone!: string;
  public email!: string;
  public payment_method!: string;
  public payment_status!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    total_amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: false,
  }
);

export default Order;
