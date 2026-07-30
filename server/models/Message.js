const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    enum: ['recruiter', 'candidate'],
    required: true
  },
  senderName: {
    type: String,
    default: ''
  },
  receiverId: {
    type: String,
    required: true
  },
  receiverRole: {
    type: String,
    enum: ['recruiter', 'candidate'],
    required: true
  },
  receiverName: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);
