// jwt.js
const jwt = require('jsonwebtoken');

const secretKey = '8GmFzl3hQIIf770eIlIC5qiEBcBbkjiYF+3Q9vimlEI='; // Replace with your secret key

const generateToken = (payload) => {
    return jwt.sign(payload, secretKey, { expiresIn: '1d' });
};

const verifyToken = (token) => {
    return jwt.verify(token, secretKey);
};

module.exports = {
    generateToken,
    verifyToken
};
