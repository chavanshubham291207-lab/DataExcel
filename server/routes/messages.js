const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protectCandidate } = require('../middleware/candidateAuth');
const { protect } = require('../middleware/auth');

// Helper: either candidate or recruiter auth
const flexProtect = async (req, res, next) => {
  // Try candidate token first, then recruiter
  const { protectCandidate } = require('../middleware/candidateAuth');
  const { protect } = require('../middleware/auth');

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, error: 'Not authorized' });

  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345');
  } catch {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  const CandidateUser = require('../models/CandidateUser');
  const Recruiter = require('../models/Recruiter');

  const candidate = await CandidateUser.findById(decoded.id);
  if (candidate) {
    req.currentUser = { id: candidate._id.toString(), name: candidate.name, role: 'candidate' };
    return next();
  }
  const recruiter = await Recruiter.findById(decoded.id);
  if (recruiter) {
    req.currentUser = { id: recruiter._id.toString(), name: recruiter.name, role: 'recruiter' };
    return next();
  }
  return res.status(401).json({ success: false, error: 'User not found' });
};

// @route GET /api/messages/conversations
// @desc  Get list of distinct conversations for current user
router.get('/conversations', flexProtect, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort('-createdAt');

    const conversationMap = {};
    messages.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherName = msg.senderId === userId ? msg.receiverName : msg.senderName;
      if (!conversationMap[otherId]) {
        conversationMap[otherId] = {
          otherId,
          otherName,
          otherRole: msg.senderId === userId ? msg.receiverRole : msg.senderRole,
          lastMessage: msg.text,
          lastTime: msg.createdAt,
          unread: 0,
          conversationId: msg.conversationId
        };
      }
      if (!msg.read && msg.receiverId === userId) {
        conversationMap[otherId].unread++;
      }
    });

    res.status(200).json({ success: true, data: Object.values(conversationMap) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/messages/:conversationId
router.get('/:conversationId', flexProtect, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort('createdAt');
    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, receiverId: req.currentUser.id, read: false },
      { read: true }
    );
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/messages
router.post('/', flexProtect, async (req, res) => {
  try {
    const { receiverId, receiverRole, receiverName, text, conversationId } = req.body;

    const convId = conversationId ||
      [req.currentUser.id, receiverId].sort().join('_');

    const message = await Message.create({
      conversationId: convId,
      senderId: req.currentUser.id,
      senderRole: req.currentUser.role,
      senderName: req.currentUser.name,
      receiverId,
      receiverRole,
      receiverName: receiverName || '',
      text
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
