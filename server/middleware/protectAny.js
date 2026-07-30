const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');
const CandidateUser = require('../models/CandidateUser');

const protectAny = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access AI route. Token missing.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345'
    );

    const userId = decoded.userId || decoded.id;

    // Check Recruiter first
    let user = await Recruiter.findById(userId);
    let role = 'recruiter';

    if (!user) {
      // Check CandidateUser
      user = await CandidateUser.findById(userId);
      role = 'candidate';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized. User profile not found.'
      });
    }

    req.user = user;
    req.role = user.role || role;
    req.userModel = user.role === 'recruiter' || role === 'recruiter' ? 'Recruiter' : 'CandidateUser';
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized. Token invalid or expired.'
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        error: `Role '${req.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = { protectAny, restrictTo };
