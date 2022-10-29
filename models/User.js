const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    gender: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    birthday: {
        type: Date
    },
    bio: {
        type: String
    },
    join_date: {
        type: Date,
        default: Date.now()
    },
    avatar: {
        type: String
    },
    subscribers: {
        type: [String]
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;