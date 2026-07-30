const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route. Token missing.' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345'
    );

    const userId = decoded.userId || decoded.id;
    const recruiter = await Recruiter.findById(userId);

    if (!recruiter) {
      return res.status(401).json({ success: false, error: 'Not authorized. User not found.' });
    }

    req.recruiter = recruiter;
    req.user = recruiter;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized. Token invalid or expired.' });
  }
};

module.exports = { protect };
