const { User } = require('../models/User.js');

module.exports = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await User.findOne({ _id: userId });
        const role = user.role;

        if (role !== "ADMIN") {
            return res.status(400).json({
                msg: "Не удалось получить доступ"
            });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Не удалось пройти проверку на доступ",
            error: e.message
        })
    }
}