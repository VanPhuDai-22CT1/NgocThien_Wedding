import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class OrderItem extends Model {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public subtotal!: number;
  public created_at!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: false,
  }
);

export default OrderItem;
