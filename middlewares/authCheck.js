const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');

const { User } = require('../models/User.js');

module.exports = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        console.log(req);
        const data = jwt.verify(token, secretKey);

        const user = await User.findOne({
            _id: data.userId
        });

        if (!user) {
            return res.status(400).json({
                msg: "Пользователь неавторизован"
            });
        }

        req.userId = user._id;
        next();
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Пользователь неавторизован (вероятно, истек токен)",
            error: e
        });
    }
}