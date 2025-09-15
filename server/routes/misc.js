const express = require('express');
const router = express.Router();

const dummyMarket = {
  wheat: "₹2000/quintal",
  rice: "₹1800/quintal",
  maize: "₹1600/quintal"
};

// GET /api/misc/market-prices
router.get('/market-prices', (req,res) => {
  res.json({ success: true, prices: dummyMarket });
});

// GET /api/misc/weather?pincode=110038
router.get('/weather', (req,res) => {
  const pincode = req.query.pincode;
  // return dummy forecast; later you integrate OpenWeather
  res.json({
    success: true,
    pincode,
    forecast: {
      today: { temp: 30, condition: 'Sunny' },
      next3: [{day:'tomorrow', temp: 29, condition:'Clouds'}]
    }
  });
});

module.exports = router;
