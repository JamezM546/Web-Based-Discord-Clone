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

// Message validation schemas
const messageSchema = Joi.object({
  content: Joi.string().min(1).max(4000).required(),
  channelId: Joi.string().optional(),
  dmId: Joi.string().optional(),
  replyToId: Joi.string().optional(),
  serverInviteId: Joi.string().optional()
}).or('channelId', 'dmId');

// Unified manual summary schema — exactly one of channelId / dmId is required.
// hours and maxMessages are accepted at the top level (simpler API contract).
const summaryRequestSchema = Joi.object({
  channelId: Joi.string(),
  dmId: Joi.string(),
  hours: Joi.number().min(0.1).max(168).optional(),
  maxMessages: Joi.number().integer().min(1).max(200).optional(),
  format: Joi.string().valid('bullets', 'paragraph').optional()
}).xor('channelId', 'dmId');

// Kept for backward compatibility — not currently used by any route.
const dmSummaryRequestSchema = Joi.object({
  options: Joi.object({
    maxMessages: Joi.number().integer().min(1).max(200).optional(),
    timeWindow: Joi.number().integer().min(1).max(24 * 60).optional(),
    format: Joi.string().valid('bullets', 'paragraph').optional()
  }).optional()
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
  messageSchema,
  summaryRequestSchema,
  dmSummaryRequestSchema,
  validate
};
