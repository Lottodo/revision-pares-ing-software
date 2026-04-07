import { DataTypes, Model } from 'sequelize';

class Evaluacion extends Model {}

export const initEvaluacionModel = (sequelize) => {
  Evaluacion.init(
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
      veredicto: {
        type: DataTypes.ENUM('aceptar', 'cambios_menores', 'cambios_mayores', 'rechazar'),
        allowNull: false
      },
      comentarios: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      fechaEvaluacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_evaluacion'
      }
    },
    {
      sequelize,
      modelName: 'Evaluacion',
      tableName: 'evaluaciones'
    }
  );

  return Evaluacion;
};

export default Evaluacion;
