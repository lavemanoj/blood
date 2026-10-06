const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const Campaign = require('../models/Campaign');
const { notifyUsers, sendSMS } = require('../utils/notifications');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totalDonors, activeDonors, totalRequests, fulfilledRequests, pendingRequests, campaigns] =
      await Promise.all([
        Donor.countDocuments(),
        Donor.countDocuments({ isAvailable: true, isBusy: { $ne: true } }),
        BloodRequest.countDocuments(),
        BloodRequest.countDocuments({ status: 'fulfilled' }),
        BloodRequest.countDocuments({ status: 'pending' }),
        Campaign.countDocuments({ ngo: req.user._id })
      ]);

    // Blood type breakdown
    const bloodTypeStats = await BloodRequest.aggregate([
      { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly fulfillment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trend = await BloodRequest.aggregate([
      { $match: { status: 'fulfilled', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ totalDonors, activeDonors, totalRequests, fulfilledRequests, pendingRequests, campaigns, bloodTypeStats, trend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Campaigns ────────────────────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ ngo: req.user._id }).sort('-createdAt');
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, ngo: req.user._id });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, ngo: req.user._id },
      req.body, { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, ngo: req.user._id });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Donor Outreach ───────────────────────────────────────────────────────────
exports.sendOutreach = async (req, res) => {
  try {
    const { bloodTypes, message, title } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const filter = { isAvailable: true, $or: [{ isBusy: false }, { isBusy: null }] };
    if (bloodTypes?.length) filter.bloodType = { $in: bloodTypes };

    const donors = await Donor.find(filter).populate('user', 'name phone fcmToken');
    const users = donors.map(d => d.user).filter(Boolean);

    await notifyUsers(users, title || '🩸 BloodConnect Campaign', message, message);

    res.json({ message: `Outreach sent to ${users.length} donors`, count: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Flag / Review Requests ───────────────────────────────────────────────────
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('recipient', 'name phone')
      .sort('-createdAt')
      .limit(100);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.flagRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Add to NGO's flagged list in campaign or just mark it
    await Campaign.updateMany(
      { ngo: req.user._id },
      { $addToSet: { flaggedRequests: request._id } }
    );
    res.json({ message: 'Request flagged for review' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Donor List ───────────────────────────────────────────────────────────────
exports.getDonors = async (req, res) => {
  try {
    const donors = await Donor.find()
      .populate('user', 'name email phone location isVerified')
      .sort('-reliabilityScore');
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
