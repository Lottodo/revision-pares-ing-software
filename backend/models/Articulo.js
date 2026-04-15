import mongoose from 'mongoose';

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
    documentoUrl: {
      type: String,
      required: true,
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
