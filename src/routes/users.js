const express = require('express');
const { prisma } = require('../config');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// GET /api/users — список с пагинацией
router.get('/', validate(schemas.userQuery, 'query'), async (req, res) => {
  const { page, limit } = req.validated.query;

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
      include: { _count: { select: { posts: true } } },
    }),
    prisma.user.count(),
  ]);

  res.json({
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// GET /api/users/:id — пользователь с постами (новые сверху)
router.get('/:id', validate(schemas.idParam, 'params'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.validated.params.id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        include: { tags: true },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

// POST /api/users — создать пользователя
router.post('/', validate(schemas.userCreate), async (req, res) => {
  const user = await prisma.user.create({ data: req.validated.body });
  res.status(201).json(user);
});

// PATCH /api/users/:id — обновить пользователя
router.patch(
  '/:id',
  validate(schemas.idParam, 'params'),
  validate(schemas.userUpdate),
  async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.validated.params.id },
      data: req.validated.body,
    });
    res.json(user);
  }
);

// DELETE /api/users/:id — удалить пользователя вместе с его постами
router.delete('/:id', validate(schemas.idParam, 'params'), async (req, res) => {
  const id = req.validated.params.id;

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: 'Пользователь не найден' });

  await prisma.$transaction([
    prisma.post.deleteMany({ where: { authorId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

module.exports = router;
