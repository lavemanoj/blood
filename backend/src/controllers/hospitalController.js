const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');

exports.getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { inventory } = req.body;
    const hospital = await Hospital.findOneAndUpdate(
      { user: req.user._id },
      { inventory },
      { new: true }
    );
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fulfillRequest = async (req, res) => {
  try {
    const { requestId, bloodType, units } = req.body;
    const hospital = await Hospital.findOne({ user: req.user._id });

    // Deduct from inventory
    const item = hospital.inventory.find(i => i.bloodType === bloodType);
    if (!item || item.units < units) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }
    item.units -= units;
    hospital.fulfilledRequests.push(requestId);
    await hospital.save();

    await BloodRequest.findByIdAndUpdate(requestId, {
      status: 'fulfilled',
      fulfilledBy: req.user._id,
      fulfilledAt: new Date(),
      matchedHospital: hospital._id
    });

    res.json({ message: 'Request fulfilled', remainingUnits: item.units });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isVerified: true }).populate('user', 'name phone location');
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
