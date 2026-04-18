import mongoose from 'mongoose';

const evaluacionSchema = new mongoose.Schema(
  {
    articuloId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Articulo',
      required: true,
    },
    revisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    veredicto: {
      type: String,
      enum: ['aceptar', 'cambios_menores', 'cambios_mayores', 'rechazar'],
      required: true,
    },
    // ── Rúbrica Estructurada (1-5) ──
    originalidad: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    rigorMetodologico: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    calidadRedaccion: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    relevancia: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comentarios: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Evaluacion = mongoose.models.Evaluacion || mongoose.model('Evaluacion', evaluacionSchema);

export default Evaluacion;
