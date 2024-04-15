const { User } = require('../models/User.js');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config.js');

module.exports = async (token) => {
    try {
        const userId = jwt.verify(token, secretKey).userId;
        const user = await User.findById(userId);
        return user.role == 'ADMIN'
    } catch (error) {
        console.log(error);
        return false;
    }
}