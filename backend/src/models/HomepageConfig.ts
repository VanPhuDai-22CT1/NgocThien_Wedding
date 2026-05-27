import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class HomepageConfig extends Model {
  public id!: number;
  public gallery_images!: string;
  public header_slider_images!: string;
  public hero_background_image!: string;
  public consult_image!: string;
  public image_history!: string;
  public updated_at!: Date;
}

HomepageConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gallery_images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    header_slider_images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    hero_background_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    consult_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image_history: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'homepage_configs',
    timestamps: false,
  }
);

export default HomepageConfig;
