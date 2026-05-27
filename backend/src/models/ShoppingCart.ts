import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class ShoppingCart extends Model {
  public id!: number;
  public user_id!: number;
  public product_id!: number;
  public quantity!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

ShoppingCart.init(
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: 'shopping_carts',
    timestamps: false,
    indexes: [
      { fields: ['user_id', 'product_id'], unique: true },
    ],
  }
);

export default ShoppingCart;
