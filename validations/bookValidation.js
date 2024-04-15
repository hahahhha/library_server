const { body } = require('express-validator');

module.exports = [
    body('title', 'Не было указано название книги').notEmpty().isString(),
    body('author', 'Не был указан год издания книги').notEmpty().isString(),
    body('year', 'Не был указан год издания книги').notEmpty().isString(),
    body('genre').optional().isString(),
    body('imageUrl').optional().isURL(),
    body('description').optional().isString()
];