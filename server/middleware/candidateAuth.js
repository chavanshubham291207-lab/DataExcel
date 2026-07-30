const jwt = require('jsonwebtoken');
const CandidateUser = require('../models/CandidateUser');

const protectCandidate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ success: false, error: 'Not authorized to access candidate route. Token missing.' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345'
    );

    const userId = decoded.userId || decoded.id;
    const candidate = await CandidateUser.findById(userId);

    if (!candidate) {
      return res.status(401).json({ success: false, error: 'Not authorized. Candidate user not found.' });
    }

    req.candidateUser = candidate;
    req.user = candidate;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized. Token invalid or expired.' });
  }
};

module.exports = { protectCandidate };
