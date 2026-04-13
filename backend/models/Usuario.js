import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      enum: ['autor', 'revisor', 'editor'],
      required: true,
      default: ['autor'],
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt
  }
);

// Asegurarse de que no haya un modelo preexistente cargado (útil en dev servers)
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

export default Usuario;
