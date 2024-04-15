const { body } = require('express-validator');

module.exports = [
    body('name', 'Укажите имя').isString().notEmpty(),
    body('surname', 'Укажите фамилию').isString().notEmpty(),
    body('login', 'Длина логина должна быть не менее 3 символов').isString().isLength({ min: 3 }),
    body('password', 'Длина пароля должна быть не менее 5 символов').isString().isLength({ min: 5 }),
    body('role', 'Укажите статус').isString().notEmpty(),
    body('classObj').optional(),
    // body('books', 'Некорректный формат массива книг').optional().isArray()
]