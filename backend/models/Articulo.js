import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  url: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  nota: { type: String, default: '' }
}, { _id: false });

const articuloSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      maxlength: 200,
    },
    resumen: {
      type: String,
      required: true,
    },
    // Se conserva para compatibilidad; apunta siempre a la última versión
    documentoUrl: {
      type: String,
      required: true,
    },
    versiones: {
      type: [versionSchema],
      default: [],
    },
    estado: {
      type: String,
      enum: [
        'recibido',
        'en_revision',
        'cambios_menores',
        'cambios_mayores',
        'aceptado',
        'rechazado',
      ],
      required: true,
      default: 'recibido',
    },
    autorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Articulo = mongoose.models.Articulo || mongoose.model('Articulo', articuloSchema);

export default Articulo;
