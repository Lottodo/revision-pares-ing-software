import { sequelize } from '../config/database.js';
import Usuario, { initUsuarioModel } from './usuario.model.js';
import Articulo, { initArticuloModel } from './articulo.model.js';
import AsignacionRevision, { initAsignacionRevisionModel } from './asignacionRevision.model.js';
import Evaluacion, { initEvaluacionModel } from './evaluacion.model.js';

export const initModels = () => {
  initUsuarioModel(sequelize);
  initArticuloModel(sequelize);
  initAsignacionRevisionModel(sequelize);
  initEvaluacionModel(sequelize);

  Usuario.hasMany(Articulo, {
    foreignKey: 'autorId',
    as: 'articulos'
  });
  Articulo.belongsTo(Usuario, {
    foreignKey: 'autorId',
    as: 'autor'
  });

  Articulo.belongsToMany(Usuario, {
    through: AsignacionRevision,
    foreignKey: 'articuloId',
    otherKey: 'revisorId',
    as: 'revisores'
  });
  Usuario.belongsToMany(Articulo, {
    through: AsignacionRevision,
    foreignKey: 'revisorId',
    otherKey: 'articuloId',
    as: 'asignaciones'
  });

  Articulo.hasMany(Evaluacion, {
    foreignKey: 'articuloId',
    as: 'evaluaciones'
  });
  Evaluacion.belongsTo(Articulo, {
    foreignKey: 'articuloId',
    as: 'articulo'
  });

  Usuario.hasMany(Evaluacion, {
    foreignKey: 'revisorId',
    as: 'evaluacionesRealizadas'
  });
  Evaluacion.belongsTo(Usuario, {
    foreignKey: 'revisorId',
    as: 'revisor'
  });

  AsignacionRevision.belongsTo(Articulo, {
    foreignKey: 'articuloId',
    as: 'articulo'
  });
  AsignacionRevision.belongsTo(Usuario, {
    foreignKey: 'revisorId',
    as: 'revisor'
  });

  return {
    sequelize,
    Usuario,
    Articulo,
    AsignacionRevision,
    Evaluacion
  };
};

export {
  sequelize,
  Usuario,
  Articulo,
  AsignacionRevision,
  Evaluacion
};
