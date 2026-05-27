import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class ProductReview extends Model {
  public id!: number;
  public product_id!: number;
  public user_id!: number | null;
  public reviewer_name!: string;
  public rating!: number;
  public comment!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

ProductReview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reviewer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'product_reviews',
    timestamps: false,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['user_id'] },
    ],
  }
);

export default ProductReview;
