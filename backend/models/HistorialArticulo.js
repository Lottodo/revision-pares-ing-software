import mongoose from 'mongoose';

const historialArticuloSchema = new mongoose.Schema(
  {
    articuloId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Articulo',
      required: true,
      index: true,
    },
    evento: {
      type: String,
      required: true,
    },
    detalle: {
      type: String,
      default: '',
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const HistorialArticulo = mongoose.models.HistorialArticulo || mongoose.model('HistorialArticulo', historialArticuloSchema);

export default HistorialArticulo;
