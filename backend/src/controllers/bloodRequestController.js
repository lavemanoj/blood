const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const { notifyUsers } = require('../utils/notifications');
const { detectFraud } = require('../utils/fraudDetection');
const axios = require('axios');

exports.createRequest = async (req, res) => {
  try {
    const { bloodType, units, urgency, priorityMode, location, address, hospital, notes } = req.body;

    // ── Fraud Detection ──────────────────────────────────────────────────────
    const fraud = await detectFraud(
      req.user._id,
      bloodType,
      units,
      req.user.isVerified
    );

    if (fraud.action === 'block') {
      return res.status(429).json({
        message: 'Request blocked by fraud detection',
        reasons: fraud.reasons,
        fraudScore: fraud.score,
        duplicateRequestId: fraud.duplicateId
      });
    }

    // Create request (flagged if suspicious)
    const request = await BloodRequest.create({
      recipient: req.user._id,
      bloodType, units, urgency, priorityMode,
      location, address, hospital, notes,
      isFlagged: fraud.action === 'flag',
      fraudScore: fraud.score,
      fraudReasons: fraud.reasons
    });

    // Warn but allow flagged requests
    if (fraud.action === 'flag') {
      console.warn(`⚠️ Flagged request ${request._id} — score: ${fraud.score} — ${fraud.reasons.join(', ')}`);
    }

    // Trigger matching engine
    await triggerMatching(request);

    res.status(201).json({
      ...request.toObject(),
      fraudWarning: fraud.action === 'flag' ? fraud.reasons : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Blood type compatibility — what types can donate to the requested type
const COMPATIBLE_DONORS = {
  'A+':  ['A+','A-','O+','O-'],
  'A-':  ['A-','O-'],
  'B+':  ['B+','B-','O+','O-'],
  'B-':  ['B-','O-'],
  'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  'AB-': ['A-','B-','AB-','O-'],
  'O+':  ['O+','O-'],
  'O-':  ['O-']
};

const haversineKm = (coord1, coord2) => {
  const R = 6371;
  const [lng1, lat1] = coord1.map(c => c * Math.PI / 180);
  const [lng2, lat2] = coord2.map(c => c * Math.PI / 180);
  const dlat = lat2 - lat1, dlng = lng2 - lng1;
  const a = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

const triggerMatching = async (request) => {
  try {
    const reqCoords = request.location?.coordinates;
    const isCritical = request.urgency === 'critical';
    const NEARBY_KM = isCritical ? 30 : 50; // tighter radius for critical

    // ── Step 1: Find nearby verified hospitals with sufficient stock ──────────
    const allHospitals = await Hospital.find({ isVerified: true }).populate('user', 'name phone fcmToken location');
    const compatibleTypes = COMPATIBLE_DONORS[request.bloodType] || [request.bloodType];

    const nearbyHospitalsWithStock = allHospitals.filter(h => {
      const hCoords = h.user?.location?.coordinates;
      if (!hCoords || (hCoords[0] === 0 && hCoords[1] === 0)) return false;
      if (reqCoords && reqCoords[0] !== 0) {
        const dist = haversineKm(reqCoords, hCoords);
        if (dist > NEARBY_KM) return false;
      }
      // Check if hospital has compatible blood in sufficient quantity
      return h.inventory?.some(inv =>
        compatibleTypes.includes(inv.bloodType) && inv.units >= request.units
      );
    });

    const hospitalsWithoutStock = allHospitals.filter(h => {
      const hCoords = h.user?.location?.coordinates;
      if (!hCoords || (hCoords[0] === 0 && hCoords[1] === 0)) return false;
      if (reqCoords && reqCoords[0] !== 0) {
        const dist = haversineKm(reqCoords, hCoords);
        if (dist > NEARBY_KM) return false;
      }
      return !h.inventory?.some(inv =>
        compatibleTypes.includes(inv.bloodType) && inv.units >= request.units
      );
    });

    console.log(`Matching: ${nearbyHospitalsWithStock.length} hospitals with stock, ${hospitalsWithoutStock.length} without`);

    // ── Step 2: Notify hospitals that HAVE stock ──────────────────────────────
    if (nearbyHospitalsWithStock.length > 0) {
      const hospitalUsers = nearbyHospitalsWithStock.map(h => h.user).filter(Boolean);
      const urgencyLabel = isCritical ? '🚨 CRITICAL' : request.priorityMode ? '⚡ Priority' : '🩸';
      await notifyUsers(
        hospitalUsers,
        `${urgencyLabel} Blood Request — Stock Available`,
        `${request.bloodType} needed (${request.units} units) — You have compatible stock`,
        `${urgencyLabel}: ${request.bloodType} blood needed (${request.units} units). You have compatible stock. Please fulfill immediately.`
      );

      await BloodRequest.findByIdAndUpdate(request._id, {
        matchedHospital: nearbyHospitalsWithStock[0]._id,
        status: 'matched'
      });
    }

    // ── Step 3: If critical/priority and no hospital has stock → notify donors ─
    // Also notify donors if: no hospitals nearby, or urgency is critical (parallel escalation)
    const shouldNotifyDonors =
      nearbyHospitalsWithStock.length === 0 ||  // no hospital has stock
      isCritical ||                              // critical always escalates to donors too
      request.priorityMode;                      // priority mode always notifies donors

    if (shouldNotifyDonors) {
      // If no hospital has stock, also alert hospitals without stock (they may restock)
      if (nearbyHospitalsWithStock.length === 0 && hospitalsWithoutStock.length > 0) {
        const noStockUsers = hospitalsWithoutStock.map(h => h.user).filter(Boolean);
        await notifyUsers(
          noStockUsers,
          '⚠️ Blood Request — Insufficient Stock',
          `${request.bloodType} needed (${request.units} units) — Check your inventory`,
          `Alert: ${request.bloodType} blood needed nearby but no hospital has sufficient stock. Please check your inventory.`
        );
      }

      // Find available donors with compatible blood types
      const donorProfiles = await Donor.find({
        bloodType: { $in: compatibleTypes },
        isAvailable: true,
        $or: [{ isBusy: false }, { isBusy: null }, { busyUntil: { $lt: new Date() } }],
        ...(request.priorityMode || isCritical ? {} : {}) // priority: all donors; normal: available only
      }).select('user priorityAlertOptIn');

      // For non-critical/non-priority, only notify priority opt-in donors
      const filteredDonors = (isCritical || request.priorityMode)
        ? donorProfiles
        : donorProfiles.filter(d => d.priorityAlertOptIn);

      const donorUserIds = filteredDonors.map(d => d.user);

      if (donorUserIds.length > 0) {
        const donorUsers = await User.find({ _id: { $in: donorUserIds } });
        const urgencyLabel = isCritical ? '🚨 CRITICAL' : '🩸';
        const noStockMsg = nearbyHospitalsWithStock.length === 0
          ? ' No nearby blood bank has sufficient stock.' : '';

        await notifyUsers(
          donorUsers,
          `${urgencyLabel} Blood Donor Needed`,
          `${request.bloodType} blood urgently needed nearby.${noStockMsg}`,
          `${urgencyLabel}: ${request.bloodType} blood needed.${noStockMsg} Open app to respond.`
        );

        await BloodRequest.findByIdAndUpdate(request._id, {
          matchedDonors: donorUserIds,
          status: 'matched'
        });

        console.log(`Notified ${donorUsers.length} donors for ${request.urgency} request`);
      }
    }

    // ── Step 4: Log the escalation path ──────────────────────────────────────
    console.log(`Request ${request._id} (${request.urgency}): hospitals_with_stock=${nearbyHospitalsWithStock.length}, donors_notified=${shouldNotifyDonors}`);

  } catch (err) {
    console.error('Matching error:', err.message);
  }
};

exports.getRequests = async (req, res) => {
  try {
    const filter = req.user.role === 'recipient' ? { recipient: req.user._id } : {};
    const requests = await BloodRequest.find(filter)
      .populate('recipient', 'name phone')
      .populate('fulfilledBy', 'name phone role')
      .populate('matchedHospital', 'name address')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('recipient', 'name phone')
      .populate('matchedDonors', 'name phone')
      .populate('matchedHospital');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Check donor is not busy
    const donor = await Donor.findOne({ user: req.user._id });
    if (donor?.isBusy && donor?.busyUntil && new Date() < donor.busyUntil) {
      return res.status(400).json({
        message: `You are currently in a cooldown period until ${donor.busyUntil.toDateString()}. You cannot accept new requests during this time.`
      });
    }

    await BloodRequest.findByIdAndUpdate(req.params.id, {
      status: 'accepted',
      fulfilledBy: req.user._id
    });

    // Mark donor as busy for 90 days (standard donation cooldown)
    const busyUntil = new Date();
    busyUntil.setDate(busyUntil.getDate() + 90);

    await Donor.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: { acceptedRequests: request._id },
        isAvailable: false,
        isBusy: true,
        busyUntil,
        lastDonationDate: new Date()
      }
    );

    // Notify recipient
    const recipient = await User.findById(request.recipient);
    if (recipient) {
      await notifyUsers(
        [recipient],
        '✅ Donor Found',
        'A donor has accepted your blood request',
        'Good news! A donor accepted your blood request. Check the app for details.'
      );
    }

    res.json({ message: 'Request accepted. You will not receive new requests for 90 days.', busyUntil });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fulfillRequest = async (req, res) => {
  try {
    await BloodRequest.findByIdAndUpdate(req.params.id, {
      status: 'fulfilled',
      fulfilledAt: new Date()
    });

    // Increase donor reliability score AND total donations count
    await Donor.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { reliabilityScore: 5, totalDonations: 1 },
        isBusy: false,
        isAvailable: true,
        busyUntil: null
      }
    );

    res.json({ message: 'Request fulfilled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await BloodRequest.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
