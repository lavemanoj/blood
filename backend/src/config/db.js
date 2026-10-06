const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to resolve Atlas hostnames
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('MongoDB: MONGO_URI not configured yet');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    family: 4,
    maxPoolSize: 10
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.warn('Retrying in 15 seconds...');
    setTimeout(connectDB, 15000);
  }
};

module.exports = connectDB;
