const { processVoiceGenieAgent } = require('../services/ai-agent.service');
const Conversation = require('../models/Conversation');
const crypto = require('crypto');

exports.handleChat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid message string.'
      });
    }

    const userText = message.trim();
    console.log('VOICEGENIE USER MESSAGE:', userText);

    const result = await processVoiceGenieAgent({
      message: userText,
      user: req.user || null,
      role: req.role || null,
      conversationId
    });

    return res.status(200).json({
      success: true,
      reply: result.reply,
      toolUsed: result.toolUsed
    });

  } catch (error) {
    console.error('[AIController] Error handling VoiceGenie chat:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error processing AI chat request.'
    });
  }
};

exports.handleGetConversation = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { conversationId } = req.query;

    if (conversationId) {
      const conversation = await Conversation.findOne({ userId, conversationId }).lean();
      return res.status(200).json({
        success: true,
        conversation: conversation || { messages: [] }
      });
    }

    return res.status(200).json({
      success: true,
      conversation: null
    });
  } catch (error) {
    console.error('[AIController] Error getting conversation:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleDeleteConversation = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const conversationId = req.query.conversationId || req.body.conversationId;

    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'conversationId is required' });
    }

    await Conversation.deleteOne({ userId, conversationId });
    console.log('Conversation Cleared');
    return res.status(200).json({
      success: true,
      message: 'Conversation history cleared successfully.'
    });

  } catch (error) {
    console.error('[AIController] Error clearing conversation:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleListConversations = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || null;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const result = conversations.map(c => ({
      conversationId: c.conversationId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages ? c.messages.length : 0
    }));

    return res.status(200).json({ success: true, conversations: result });
  } catch (error) {
    console.error('[AIController] Error listing conversations:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleNewChat = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || null;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    let userModel = 'CandidateUser';
    if (req.role === 'recruiter' || req.user?.companyName || req.user?.designation) {
      userModel = 'Recruiter';
    }

    await Conversation.updateMany({ userId }, { $set: { isActive: false } });

    const newConv = new Conversation({
      conversationId: crypto.randomUUID(),
      userId,
      userModel,
      title: 'New Chat',
      isActive: true,
      messages: []
    });

    await newConv.save();

    return res.status(201).json({ success: true, conversationId: newConv.conversationId });
  } catch (error) {
    console.error('[AIController] Error creating new chat:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleRenameConversation = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || null;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    await Conversation.updateOne({ userId, conversationId }, { $set: { title: title.trim() } });
    return res.status(200).json({ success: true, message: 'Conversation renamed.' });
  } catch (error) {
    console.error('[AIController] Error renaming conversation:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
