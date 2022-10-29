const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    author: {
        type: String
    },
    filename: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    tags: {
        type: [String]
    },
    upload_date: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: [String]
    },
    views: {
        type: Number,
        default: 0
    },
    adult: {
        type: Boolean,
        default: false
    }
});

const Video = mongoose.model('Video', VideoSchema);

module.exports = Video;