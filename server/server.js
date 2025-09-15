require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const adviceRoutes = require('./routes/advice');
const uploadRoutes = require('./routes/upload');
const miscRoutes = require('./routes/misc');
const smsRoutes = require('./routes/sms');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/advice', adviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/sms', smsRoutes);

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/agrovision';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log('Server running on', PORT));
  })
  .catch(err=> console.error('DB err', err));

  app.get('/', (req, res) => {
  res.send('Welcome to AgroVision API!');
});
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
