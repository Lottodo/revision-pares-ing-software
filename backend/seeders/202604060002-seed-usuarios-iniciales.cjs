'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const usuarios = [
      {
        username: 'autor1',
        email: 'autor1@peerreview.local',
        password_hash: await bcrypt.hash('1234', 10),
        rol: 'autor',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        username: 'revisor1',
        email: 'revisor1@peerreview.local',
        password_hash: await bcrypt.hash('1234', 10),
        rol: 'revisor',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        username: 'editor1',
        email: 'editor1@peerreview.local',
        password_hash: await bcrypt.hash('1234', 10),
        rol: 'editor',
        activo: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('usuarios', usuarios, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      username: ['autor1', 'revisor1', 'editor1']
    }, {});
  }
};
