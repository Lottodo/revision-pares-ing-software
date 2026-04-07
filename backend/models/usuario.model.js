import { DataTypes, Model } from 'sequelize';

class Usuario extends Model {}

export const initUsuarioModel = (sequelize) => {
  Usuario.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50]
        }
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
      },
      rol: {
        type: DataTypes.ENUM('autor', 'revisor', 'editor'),
        allowNull: false,
        defaultValue: 'autor'
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'usuarios'
    }
  );

  return Usuario;
};

export default Usuario;
