'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Verificar si ya existe el usuario admin
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM usuarios WHERE username = 'admin' LIMIT 1`
    );

    if (existing.length > 0) {
      console.log('Usuario admin ya existe, saltando seeder.');
      return;
    }

    await queryInterface.bulkInsert('usuarios', [
      {
        username: 'admin',
        email: 'admin@uabc.edu.mx',
        password_hash: await bcrypt.hash('admin123', 10),
        rol: 'editor',
        activo: true,
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      username: 'admin'
    }, {});
  }
};
