const AdviceLog = require('../models/AdviceLog');

// Simple rules-based placeholder
function simpleAdvisory({ soilType, month, pincode }) {
  // season from month
  const m = parseInt(month,10);
  let season = 'Rabi';
  if ([6,7,8,9].includes(m)) season = 'Kharif';
  // soil->crop stub
  const soilMap = {
    clay: 'Rice',
    sandy: 'Pearl millet / Maize',
    loamy: 'Wheat / Vegetables',
    silt: 'Sugarcane / Rice'
  };
  const crop = soilMap[soilType?.toLowerCase()] || 'Wheat';
  const fertilizer = crop==='Rice' ? 'Urea (split application)' : 'General NPK as per soil test';
  return {
    recommendedCrop: crop,
    season,
    fertilizer,
    notes: `Based on ${soilType || 'loamy'} soil and ${season} season. Check local market & soil test.`
  };
}

exports.getAdvice = async (req,res) => {
  const { userId, pincode, soilType, month } = req.body;
  try {
    const result = simpleAdvisory({ soilType, month, pincode });
    await AdviceLog.create({ userId, pincode, soilType, query: req.body, response: result });
    return res.json({ success: true, advisory: result });
  } catch(err){
    console.error(err);
    return res.status(500).json({ success:false, error: err.message });
  }
};

exports.feedback = async (req,res) => {
  // store feedback; simple ack
  const { userId, feedback } = req.body;
  // ideally save to DB
  return res.json({ success: true, msg: 'Feedback recorded. Thank you.'});
};
