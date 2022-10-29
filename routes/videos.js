const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../config/auth');

// Load Models
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');

// Calculate Age Function
function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Multer Config
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/' + req.user.username)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1181116006 }
});

// Upload Page
router.get('/upload', ensureAuthenticated, (req, res) => {
    res.render('upload', {
        title: 'Upload A Video',
        logUser: req.user
    });
});

// Upload Function
router.post('/upload', upload.single('video'), (req, res) => {
    const author = req.user.username;
    const file = req.file;
    const title = req.body.title;
    const description = req.body.description;

    if(!file) {
        req.flash(
            'error_msg',
            'Please select a video file'
        );
        res.redirect('/videos/upload');
    } else {
        Video.findOne({ title: title }).then(user => {
            if(user) {
                req.flash(
                    'error_msg',
                    'There is already a video with that title'
                );
                res.redirect('/videos/upload');
            } else {
                let newVideo = new Video({
                    author: author,
                    filename: file.filename,
                    title: title,
                    description: description
                });

                newVideo
                    .save()
                    .then(video => {
                        req.flash(
                            'success_msg',
                            'Video Uploaded Successfully'
                        );
                        res.redirect('/videos/upload');
                    })
                    .catch(err => console.log(err));
            }
        });
    }
});

// Watch Page
router.get('/watch/:id', ensureAuthenticated, (req, res) => {
    Video.findOne({ _id: req.params.id }, (err, video) => {
        if(err) {
            console.log(err);
        } else {
            Comment.aggregate([
                {
                    $match: { post_id: req.params.id }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "author",
                        foreignField: "username",
                        as: "comments"
                    }
                },
                {
                    $unwind: "$comments"
                }
            ]).then(comments => {
                User.findOne({ username: video.author }, (err, vidUser) => {
                    if(err) {
                        console.log(err);
                    } else {
                        res.render('watch', {
                            title: video.title,
                            logUser: req.user,
                            video: video,
                            comments: comments,
                            vidUser: vidUser
                        });
                    }
                });
            }).catch(err => console.log(err));
        }
    });
});

// Like Video
router.post('/like/:id', (req, res) => {
    Video.findOneAndUpdate({ _id: req.params.id }, { $push: { likes: req.user.username } }).exec();
    res.redirect('/videos/watch/' + req.params.id);
});

// Unlike Video
router.post('/unlike/:id', (req, res) => {
    Video.findOneAndUpdate({ _id: req.params.id }, { $pull: { likes: req.user.username } }).exec();
    res.redirect('/videos/watch/' + req.params.id);
});

// Comment On Video
router.post('/comment/:id', (req, res) => {
    const commentText = req.body.commentText;

    if(!commentText) {
        req.flash(
            'error_msg',
            'Please type something first'
        );
        res.redirect('/videos/watch/' + req.params.id);
    } else {
        Video.findOne({ _id: req.params.id }, (err, video) => {
            if(err) {
                console.log(err);
            } else {
                let newComment = new Comment({
                    author: req.user.username,
                    account_name: video.author,
                    post_id: video._id,
                    data: commentText
                });
    
                newComment
                    .save()
                    .then(comment => {
                        req.flash(
                            'success_msg',
                            'You Commented On This Video'
                        );
    
                        res.redirect('/videos/watch/' + req.params.id);
                    })
                    .catch(err => console.log(err));
            }
        });
    }
    
});

// Like Comment
router.post('/comment/like/:id', (req, res) => {
    Comment.findOne({ _id: req.params.id }, (err, comment) => {
        if(err) {
            console.log(err);
        } else {
            Comment.findOneAndUpdate({ _id: req.params.id }, { $push: { likes: req.user.username }}).exec();
            res.redirect('/videos/watch/' + comment.post_id);
        }
    });
});

// Unlike Commnet
router.post('/comment/unlike/:id', (req, res) => {
    Comment.findOne({ _id: req.params.id }, (err, comment) => {
        if(err) {
            console.log(err);
        } else {
            Comment.findOneAndUpdate({ _id: req.params.id }, { $pull: { likes: req.user.username }}).exec();
            res.redirect('/videos/watch/' + comment.post_id);
        }
    });
});

module.exports = router;