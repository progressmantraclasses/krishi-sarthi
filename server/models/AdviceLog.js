const mongoose = require('mongoose');
const s = new mongoose.Schema({
  userId: String,
  pincode: String,
  soilType: String,
  query: String,
  response: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AdviceLog', s);
