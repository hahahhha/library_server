const { User } = require('../models/User.js');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config.js');

module.exports = async (token) => {
    const userId = jwt.verify(token, secretKey).data;
    const user = await User.findById(userId);
    if (!user) {
        return false;
    }
    return true;
}