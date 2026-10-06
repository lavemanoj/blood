const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, location } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'Name, email, phone, password and role are required' });
    }

    const validRoles = ['donor', 'recipient', 'hospital', 'admin', 'ngo'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) return res.status(400).json({ message: 'Email already registered' });

    // Check if phone already exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(400).json({ message: 'Phone number already registered' });

    // Create user directly without OTP verification
    const user = await User.create({
      name, 
      email: email.toLowerCase(), 
      phone, 
      password, 
      role,
      isVerified: true, // Auto-verify since no OTP
      location: location || { type: 'Point', coordinates: [0, 0] }
    });

    // Create role-specific profile
    if (role === 'donor') {
      const { bloodType, age, weight, healthInfo, priorityAlertOptIn } = req.body;
      if (!bloodType || !age || !weight) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Donor requires bloodType, age and weight' });
      }
      await Donor.create({ 
        user: user._id, 
        bloodType, 
        age: parseInt(age), 
        weight: parseFloat(weight), 
        healthInfo: healthInfo || {}, 
        priorityAlertOptIn: priorityAlertOptIn || false 
      });
    }

    if (role === 'hospital') {
      const { hospitalName, licenseNumber, address } = req.body;
      if (!hospitalName || !licenseNumber) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Hospital requires hospitalName and licenseNumber' });
      }
      await Hospital.create({ 
        user: user._id, 
        name: hospitalName, 
        licenseNumber, 
        address: address || '', 
        location: location || { type: 'Point', coordinates: [0, 0] } 
      });
    }

    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} already registered` });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Use lean + select only needed fields for speed
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact support.' });
    }
    res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.updateFCMToken = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
