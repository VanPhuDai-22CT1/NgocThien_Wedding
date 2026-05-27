import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Consultation extends Model {
  public id!: number;
  public user_id!: number | null;
  public name!: string;
  public email!: string;
  public phone!: string;
  public service!: string;
  public event_date!: Date;
  public note!: string;
  public status!: string;
  public is_read!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Consultation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    service: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'delivering', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'consultations',
    timestamps: false,
  }
);

export default Consultation;
