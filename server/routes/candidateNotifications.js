const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protectCandidate } = require('../middleware/candidateAuth');

// @route GET /api/candidate/notifications
router.get('/', protectCandidate, async (req, res) => {
  try {
    // Notifications addressed to this candidate by email
    const notifications = await Notification.find({
      $or: [
        { recipientEmail: req.candidateUser.email },
        { recipientId: req.candidateUser._id.toString() }
      ]
    }).sort('-createdAt').limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route PATCH /api/candidate/notifications/:id/read
router.patch('/:id/read', protectCandidate, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate/notifications/read-all
router.post('/read-all', protectCandidate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientEmail: req.candidateUser.email },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
