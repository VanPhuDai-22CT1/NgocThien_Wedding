import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

class LiveChatSession extends Model {
  public id!: number;
  public chat_session!: string;
  public customer_name!: string;
  public customer_email!: string;
  public customer_phone!: string;
  public user_id!: number | null;
  public status!: string;
  public is_read_by_admin!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

LiveChatSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chat_session: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4(),
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'closed'),
      defaultValue: 'active',
    },
    is_read_by_admin: {
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
    tableName: 'live_chat_sessions',
    timestamps: false,
  }
);

export default LiveChatSession;
