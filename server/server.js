require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app first
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const weatherRouter = require('./routes/weather');
const adviceRoutes = require('./routes/advice');
const uploadRoutes = require('./routes/upload');
const miscRoutes = require('./routes/misc');
const smsRoutes = require('./routes/sms');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/weather', weatherRouter); // changed to /api/weather for clarity
app.use('/api/advice', adviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to AgroVision API!');
});

// MongoDB connection
const PORT = process.env.PORT || 8080;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/agrovision';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running on', PORT));
  })
  .catch(err => console.error('DB err', err));