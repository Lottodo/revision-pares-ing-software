import { DataTypes, Model } from 'sequelize';

class AsignacionRevision extends Model {}

export const initAsignacionRevisionModel = (sequelize) => {
  AsignacionRevision.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      articuloId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'articulo_id'
      },
      revisorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'revisor_id'
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'en_progreso', 'evaluado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      fechaAsignacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_asignacion'
      },
      fechaLimite: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'fecha_limite'
      }
    },
    {
      sequelize,
      modelName: 'AsignacionRevision',
      tableName: 'asignaciones_revision',
      indexes: [
        {
          unique: true,
          fields: ['articulo_id', 'revisor_id']
        }
      ]
    }
  );

  return AsignacionRevision;
};

export default AsignacionRevision;
