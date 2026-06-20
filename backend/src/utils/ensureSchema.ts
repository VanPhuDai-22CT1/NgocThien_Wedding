import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import logger from './logger';

export const ensureSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const usersTable = await queryInterface.describeTable('users');

  if (!usersTable.avatar) {
    await queryInterface.addColumn('users', 'avatar', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
    logger.info('✅ Added users.avatar column');
  }
};
