import { connectDB } from '../config/mongodb.js';
import Usuario from './usuario.model.js';
import Articulo from './articulo.model.js';
import AsignacionRevision from './asignacionRevision.model.js';
import Evaluacion from './evaluacion.model.js';

export {
  connectDB,
  Usuario,
  Articulo,
  AsignacionRevision,
  Evaluacion
};
