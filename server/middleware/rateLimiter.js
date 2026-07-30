const rateLimit = require('express-rate-limit');

// Rate limiter for AI routes: 60 requests per 15 minutes per IP
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many requests sent to AI Agent system. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Prompt injection protection middleware
const sanitizePromptInput = (req, res, next) => {
  if (req.body && req.body.message) {
    let msg = req.body.message;
    if (typeof msg === 'string') {
      // Remove malicious prompt injection patterns
      const injectionPatterns = [
        /ignore previous instructions/gi,
        /system prompt override/gi,
        /you are now chatgpt/gi,
        /forget all rules/gi,
        /do anything now/gi,
        /jailbreak mode/gi
      ];

      injectionPatterns.forEach(pattern => {
        msg = msg.replace(pattern, '[filtered]');
      });

      req.body.message = msg.trim();
    }
  }
  next();
};

module.exports = { aiRateLimiter, sanitizePromptInput };
