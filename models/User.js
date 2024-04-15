const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    login: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    classObj: {
        type: String
    },
    // books: [{ type: Schema.Types.ObjectId, ref: 'books' }]
});

const User = model('users', userSchema);

module.exports = {
    User: User
}