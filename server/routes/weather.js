const express = require('express');
const router = express.Router();

// GET /api/weather?lat=28.6139&lon=77.2090
router.get('/', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Please provide latitude and longitude' });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;

  try {
    const response = await fetch(url); // native fetch in Node 20+
    const data = await response.json();

    res.json({
      location: data.name,
      temperature: data.main.temp,
      weather: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;