const express = require('express');
const router = express.Router();

// Example Twilio webhook style: Twilio sends body 'Body' and From
router.post('/inbound', (req,res) => {
  const sms = req.body.Body || req.body.body;
  const from = req.body.From || req.body.from;
  // Very small SMS parser: "SOIL clay PIN 110038" -> extract keywords
  const soilMatch = sms && sms.match(/soil\s+(\w+)/i);
  const pincodeMatch = sms && sms.match(/pin\s+(\d{5,6})/i);
  const soilType = soilMatch ? soilMatch[1] : 'loamy';
  const pincode = pincodeMatch ? pincodeMatch[1] : '000000';

  // Use same advisory logic (simplified) and reply via Twilio API (not shown)
  const reply = `Rec: ${soilType==='clay' ? 'Rice' : 'Wheat'}. Reply STOP to end.`;
  // For webhook demo just return text
  res.send(reply);
});

module.exports = router;
