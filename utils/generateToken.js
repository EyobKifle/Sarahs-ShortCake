
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const payload = {
    id: user._id,
    userType: user.role || 'customer',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });
};

module.exports = generateToken;
