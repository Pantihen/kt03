const Joi = require('joi');
const { pagination } = require('../config');

const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(pagination.maxLimit).default(pagination.defaultLimit),
};

const schemas = {
  idParam: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),

  // ---------- users ----------
  userQuery: Joi.object(paginationFields),

  userCreate: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    name: Joi.string().trim().min(1).max(100).required(),
    role: Joi.string().valid('USER', 'ADMIN'),
  }),

  userUpdate: Joi.object({
    email: Joi.string().trim().lowercase().email(),
    name: Joi.string().trim().min(1).max(100),
    role: Joi.string().valid('USER', 'ADMIN'),
  }).min(1),

  // ---------- posts ----------
  postQuery: Joi.object({
    search: Joi.string().trim().min(1),
    published: Joi.boolean(),
    authorId: Joi.number().integer().min(1),
    ...paginationFields,
  }),

  postCreate: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    content: Joi.string().allow('', null),
    published: Joi.boolean(),
    authorId: Joi.number().integer().min(1).required(),
    tags: Joi.array().items(Joi.string().trim().min(1).max(50)).unique(),
  }),

  postUpdate: Joi.object({
    title: Joi.string().trim().min(1).max(200),
    content: Joi.string().allow('', null),
    published: Joi.boolean(),
    authorId: Joi.number().integer().min(1),
    tags: Joi.array().items(Joi.string().trim().min(1).max(50)).unique(),
  }).min(1),
};

// Фабрика middleware: source — 'body' | 'query' | 'params'
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source] ?? {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => ({
          field: d.path.join('.') || source,
          message: d.message.replace(/"/g, ''),
        })),
      });
    }

    // В Express 5 req.query — только для чтения, поэтому кладём результат отдельно
    req.validated = { ...(req.validated || {}), [source]: value };
    next();
  };
}

module.exports = { validate, schemas };
