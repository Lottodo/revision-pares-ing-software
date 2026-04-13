import { connectDB } from '../config/mongodb.js';
import Usuario from './Usuario.js';
import Articulo from './Articulo.js';
import AsignacionRevision from './AsignacionRevision.js';
import Evaluacion from './Evaluacion.js';

export {
  connectDB,
  Usuario,
  Articulo,
  AsignacionRevision,
  Evaluacion
};
