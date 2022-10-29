const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');

// Load Models
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');

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

// Sign Up Page
router.get('/signup', forwardAuthenticated, (req, res) => {
    res.render('signup', {
        title: 'Sign Up',
        logUser: ""
    });
});

// Sign Up Function
router.post('/signup', (req, res) => {
    const { firstname, lastname, username, reg_email, pass1, pass2, gender, country, birthday } = req.body;
    let errors = [];

    if (!firstname || !lastname || !username || !reg_email || !pass1 || !pass2 || !gender || !country || !birthday) {
        errors.push({ msg: 'All Fileds Required' });
    }
    if (pass1 != pass2) {
        errors.push({ msg: 'Your Password Fields Do Not Match' });
    }
    if (pass1.length < 7) {
        errors.push({ msg: 'Passwords Should Be 7 Characters Or More' });
    }
    if (username.length < 3 || username.length > 32) {
        errors.push({ msg: 'Usernames Should Be 3-32 Characters' });
    }
    if (errors.length > 0) {
        res.render('index', {
            title: 'VidParties',
            errors: errors
        });
    } else {
        User.findOne({ email: reg_email }).then(user => {
            if (user) {
                errors.push({ msg: 'Email Already Exists' });
                res.render('index', {
                    title: 'VidParties',
                    errors: errors
                });
            } else {
                User.findOne({ username: username }).then(user => {
                    if (user) {
                        errors.push({ msg: 'Username Already Exists' });
                        res.render('index', {
                            title: 'VidParties',
                            errors: errors
                        });
                    } else {
                        let newUser = new User({
                            firstname: firstname,
                            lastname: lastname,
                            username: username,
                            email: reg_email,
                            password: pass1,
                            gender: gender,
                            country: country,
                            birthday: birthday
                        });

                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if (err) throw err;
                                newUser.password = hash;
                                newUser
                                    .save()
                                    .then(user => {
                                        const dir = './public/uploads/' + newUser.username;
                                        fs.mkdir(dir, (err) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                req.flash(
                                                    'success_msg',
                                                    'You are now registered and can log in'
                                                );
                                                res.redirect('/');
                                            }
                                        });
                                    })
                                    .catch(err => console.log(err));
                            });
                        });

                    }
                });
            }
        });
    }
});

// Log In Page
router.get('/login', forwardAuthenticated, (req, res) => {
    res.render('login', {
        title: 'Log In',
        logUser: ""
    });
});

// Log In Function
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureFlash: true
    })(req, res, next);
});

// Subscribe Function From Watch page
router.post('/subscribe/:id/:vidId', (req, res) => {
    User.findOneAndUpdate({ username: req.params.id }, { $push: { subscribers: req.user.username } }).exec();
    res.redirect('/videos/watch/' + req.params.vidId);
});

// Unsubscribe Function From Watch page
router.post('/unsubscribe/:id/:vidId', (req, res) => {
    User.findOneAndUpdate({ username: req.params.id }, { $pull: { subscribers: req.user.username } }).exec();
    res.redirect('/videos/watch/' + req.params.vidId);
});

// Comment On Profile
router.post('/p_comment/:id', (req, res) => {
    const author = req.user.username;
    const account_name = req.params.id;
    const data = req.body.commentText;

    if(!data) {
        req.flash(
            'error_msg',
            'Please type something first'
        );
        res.redirect('/users/' + req.params.id);
    } else {
        let newComment = new Comment({
            author: author,
            account_name: account_name,
            data: data
        });

        newComment
            .save()
            .then(comment => {
                req.flash(
                    'success_msg',
                    'You commented on this profile'
                )
            })
            .catch(err => console.log(err));
    }
});

// Edit Profile Page
router.get('/edit', ensureAuthenticated, (req, res) => {
    res.render('edit_profile', {
        title: 'Edit Profile Page',
        logUser: req.user
    });
});

// Edit Avatar Function
router.post('/edit/avatar', upload.single('avatar'), (req, res) => {
    const file = req.file;

    if(!file) {
        req.flash(
            'error_msg',
            'Please select an image file'
        );
        res.redirect('/users/edit');
    } else {
        let updateAvatar = {
            avatar: file.filename
        };

        let query = { username: req.user.username }

        User.updateMany(query, updateAvatar, (err) => {
            if(err) {
                console.log(err);
            } else {
                req.flash(
                    'success_msg',
                    'Profile Picture Updated Successfully'
                );
                res.redirect('/users/edit');
            }
        });
    }
});

// Edit Name Function
router.post('/edit/name', (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;

    if(!firstname || !lastname) {
        req.flash(
            'error_msg',
            'All Feilds Required'
        );
        res.redirect('/users/edit');
    } else {
        let updateName = {
            firstname: firstname,
            lastname: lastname
        };

        let query = { username: req.user.username };

        User.updateMany(query, updateName, (err) => {
            if(err) {
                console.log(err);
            } else {
                req.flash(
                    'success_msg',
                    'Name Updated Successfully'
                );
                res.redirect('/users/edit');
            }
        });
    }
});

// Edit Location Function
router.post('/edit/location', (req, res) => {
    const city = req.body.city;
    const state = req.body.state;
    const country = req.body.country;

    if(!country) { 
        req.flash(
            'error_msg',
            'Country field cannot be empty'
        );
        res.redirect('/users/edit');
    } else {
        let updateLocation = {
            city: city,
            state: state,
            country: country
        };

        let query = { username: req.user.username }

        User.updateMany(query, updateLocation, (err) => {
            if(err) {
                console.log(err);
            } else {
                req.flash(
                    'success_msg',
                    'Location updated successfuly'
                )
                res.redirect('/users/edit');
            }
        });
    }
});

// Edit About Me Function
router.post('/edit/bio', (req, res) => {
    const bio = req.body.bio;

    if(!bio) {
        req.flash(
            'error_msg',
            'please Type Somgehting First'
        );
        res.redirect('/users/edit');
    } else {
        let updateBio = {
            bio: bio
        }

        let query = { username: req.user.username };

        User.updateMany(query, updateBio, (err) => {
            if(err) {
                console.log(err);
            } else {
                req.flash(
                    'success_msg',
                    'About Me Updated Successfuly'
                );
                res.redirect('/users/edit');
            }
        });
    }
});

// Profile Page
router.get('/:id', ensureAuthenticated, (req, res) => {
    User.findOne({ username: req.params.id }, (err, user) => {
        if(err) {
            console.log(err);
        } else {
            Video.find({ author: req.params.id }, (err, videos) => {
                if(err) {
                    console.log(err);
                } else {
                    Comment.aggregate([
                        {
                            $match: {account_name: req.params.id}
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
                        var age = getAge(user.birthday);
                        res.render('profile', {
                            title: user.firstname + ' ' + user.lastname,
                            logUser: req.user,
                            user: user,
                            videos: videos,
                            age: age,
                            comments: comments
                        });
                    }).catch(err => console.log(err));
                }
            });
        }
    });
});

module.exports = router;