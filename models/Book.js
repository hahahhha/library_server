const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    keeper: {
        type: String,
        required: true
    }
    ,
    genre: String,
    description: String,
    imageUrl: String
})


const Book = mongoose.model('books', bookSchema);

module.exports = {
    Book: Book
}