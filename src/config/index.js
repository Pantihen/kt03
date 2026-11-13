require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || '';

// Один экземпляр PrismaClient на всё приложение
const prisma = new PrismaClient();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  // mode: 'insensitive' поддерживается только PostgreSQL (и MongoDB)
  isPostgres: databaseUrl.startsWith('postgres'),
  pagination: { defaultLimit: 10, maxLimit: 100 },
  prisma,
};
