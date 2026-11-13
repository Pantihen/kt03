const { Prisma } = require('@prisma/client');

function notFound(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}

// Перехватывает все необработанные ошибки, в том числе ошибки Prisma
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // нарушение уникальности
        return res.status(409).json({
          error: `Значение поля ${[].concat(err.meta?.target || 'unique').join(', ')} уже занято`,
        });
      case 'P2025': // запись не найдена
        return res.status(404).json({ error: 'Запись не найдена' });
      case 'P2003': // нарушение внешнего ключа
        return res.status(400).json({ error: 'Связанная запись не существует' });
      default:
        break;
    }
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: status >= 500 ? 'Внутренняя ошибка сервера' : err.message,
  });
}

module.exports = { notFound, errorHandler };
