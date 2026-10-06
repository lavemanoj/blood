require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = (process.env.FRONTEND_URL || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);
    // Always allow Vercel deployments and localhost
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS: ' + origin + ' not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/recipients', require('./routes/recipients'));
app.use('/api/requests', require('./routes/bloodRequests'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/matching', require('./routes/matching'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ngo', require('./routes/ngo'));
app.use('/api/profile', require('./routes/profile'));

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('/ping', (req, res) => res.json({ pong: true })); // keep-alive endpoint

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
