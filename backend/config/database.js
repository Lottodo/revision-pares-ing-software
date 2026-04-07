import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: envPath });

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'peerreview',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_LOG_SQL = 'false'
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: DB_LOG_SQL === 'true' ? console.log : false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  }
});

export const testDatabaseConnection = async () => {
  await sequelize.authenticate();
};
