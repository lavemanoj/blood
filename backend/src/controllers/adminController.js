const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const ChatbotLog = require('../models/ChatbotLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalDonors, totalHospitals, totalRequests, pendingRequests, fulfilledRequests] =
      await Promise.all([
        User.countDocuments(),
        Donor.countDocuments(),
        Hospital.countDocuments(),
        BloodRequest.countDocuments(),
        BloodRequest.countDocuments({ status: 'pending' }),
        BloodRequest.countDocuments({ status: 'fulfilled' })
      ]);

    res.json({ totalUsers, totalDonors, totalHospitals, totalRequests, pendingRequests, fulfilledRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.json({ message: 'User verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyHospital = async (req, res) => {
  try {
    await Hospital.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.json({ message: 'Hospital verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('recipient', 'name phone')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatbotAudit = async (req, res) => {
  try {
    const logs = await ChatbotLog.find().populate('user', 'name email').sort('-createdAt').limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFlaggedRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ isFlagged: true })
      .populate('recipient', 'name phone email')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.dismissFlag = async (req, res) => {
  try {
    await BloodRequest.findByIdAndUpdate(req.params.id, { isFlagged: false, fraudScore: 0, fraudReasons: [] });
    res.json({ message: 'Flag dismissed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelFlaggedRequest = async (req, res) => {
  try {
    await BloodRequest.findByIdAndUpdate(req.params.id, { status: 'cancelled', isFlagged: false });
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
