const jwt = require('jsonwebtoken');

// Mock login -> returns token
exports.login = async (req,res) => {
  const { phone } = req.body;
  if(!phone) return res.status(400).json({ success:false, message:'Phone required' });
  const user = { id: phone, name: 'Farmer', phone };
  const token = jwt.sign(user, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ success:true, token, user });
};
