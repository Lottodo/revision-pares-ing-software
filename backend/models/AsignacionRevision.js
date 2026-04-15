import mongoose from 'mongoose';

const asignacionRevisionSchema = new mongoose.Schema(
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
    estado: {
      type: String,
      enum: ['pendiente', 'en_progreso', 'evaluado', 'cancelado'],
      required: true,
      default: 'pendiente',
    },
    fechaLimite: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para que un revisor no tenga el mismo artículo dos veces
asignacionRevisionSchema.index({ articuloId: 1, revisorId: 1 }, { unique: true });

const AsignacionRevision = mongoose.models.AsignacionRevision || mongoose.model('AsignacionRevision', asignacionRevisionSchema);

export default AsignacionRevision;
