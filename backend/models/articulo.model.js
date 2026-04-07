import { DataTypes, Model } from 'sequelize';

class Articulo extends Model {}

export const initArticuloModel = (sequelize) => {
  Articulo.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      titulo: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      resumen: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      documentoUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'documento_url'
      },
      estado: {
        type: DataTypes.ENUM(
          'recibido',
          'en_revision',
          'cambios_menores',
          'cambios_mayores',
          'aceptado',
          'rechazado'
        ),
        allowNull: false,
        defaultValue: 'recibido'
      },
      fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_envio'
      },
      autorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'autor_id'
      }
    },
    {
      sequelize,
      modelName: 'Articulo',
      tableName: 'articulos'
    }
  );

  return Articulo;
};

export default Articulo;
