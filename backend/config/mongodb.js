import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/peerreview';
    await mongoose.connect(uri);
    console.log(`[MongoDB] Base de datos conectada exitosamente a: ${uri}`);
  } catch (error) {
    console.error('[MongoDB] Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
