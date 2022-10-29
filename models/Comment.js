const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    author: {
        type: String
    },
    account_name: {
        type: String
    },
    post_id: {
        type: String
    },
    data: {
        type: String
    },
    date_made: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: [String]
    }
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;