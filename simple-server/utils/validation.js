const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Server validation schemas
const serverSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  // Removed .uri() and added .allow('', null) so empty icons don't crash it
  icon: Joi.string().allow('', null).optional() 
});

// Channel validation schemas
const channelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  serverId: Joi.string().required()
});

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  serverSchema,
  channelSchema,
  validate
};
