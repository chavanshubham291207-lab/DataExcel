const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const CandidateUser = require('../models/CandidateUser');
const Job = require('../models/Job');
const { sendRecruitmentInvitations } = require('../services/actionExecutionEngine');

/**
 * @desc    Send recruitment invitations
 * @route   POST /api/invitations/send
 * @access  Private (Recruiter)
 */
exports.sendInvitations = async (req, res, next) => {
  try {
    const { candidatesList, jobId, message } = req.body;
    const result = await sendRecruitmentInvitations({
      recruiter: req.user,
      candidatesList: candidatesList || [],
      jobId,
      customMessage: message
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get candidate's received invitations
 * @route   GET /api/invitations/candidate
 * @access  Private (Candidate)
 */
exports.getCandidateInvitations = async (req, res, next) => {
  try {
    const user = req.user;

    const invitations = await Invitation.find({
      $or: [
        { candidateUser: user._id },
        { candidateEmail: user.email }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('recruiter', 'name companyName email companyWebsite')
      .populate('job', 'title location salaryRange experience')
      .lean();

    return res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get recruiter's sent invitations
 * @route   GET /api/invitations/recruiter
 * @access  Private (Recruiter)
 */
exports.getRecruiterInvitations = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    const invitations = await Invitation.find({ recruiter: recruiterId })
      .sort({ createdAt: -1 })
      .populate('candidateUser', 'name email phone location headline')
      .populate('job', 'title location department')
      .lean();

    return res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Respond to an invitation (Accept / Reject)
 * @route   PATCH /api/invitations/:id/respond
 * @access  Private (Candidate)
 */
exports.respondToInvitation = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Accepted or Rejected.' });
    }

    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation record not found.' });
    }

    invitation.status = status;
    await invitation.save();

    // Create notification for recruiter
    try {
      await Notification.create({
        recruiter: invitation.recruiter,
        title: `Invitation ${status}: ${invitation.candidateName}`,
        message: `${invitation.candidateName} has ${status.toLowerCase()} the recruitment invitation for ${invitation.jobTitle}.`,
        type: status === 'Accepted' ? 'success' : 'warning'
      });
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Invitation successfully ${status.toLowerCase()}.`,
      data: invitation
    });
  } catch (err) {
    next(err);
  }
};
