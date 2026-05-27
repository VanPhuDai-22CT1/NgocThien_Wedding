import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class LiveChatMessage extends Model {
  public id!: number;
  public chat_session!: string;
  public sender_type!: 'customer' | 'admin';
  public sender_name!: string;
  public message!: string;
  public created_at!: Date;
}

LiveChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chat_session: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sender_type: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'live_chat_messages',
    timestamps: false,
    indexes: [
      { fields: ['chat_session'] },
    ],
  }
);

export default LiveChatMessage;
