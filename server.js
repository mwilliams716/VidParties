const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('cookie-session');
const path = require('path');
const timeout = require('connect-timeout');
const { forwardAuthenticated, ensureAuthenticated } = require('./config/auth');

// Init App
const app = express();

// Load Models
const User = require('./models/User');
const Video = require('./models/Video');

// Passport Config
require('./config/passport')(passport);

// Db Config
const db = require('./config/keys').mongoURI;

// Connect To MongoDB
mongoose
    .connect(
        db,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Body Parser
app.use(timeout('5s'));
app.use(express.urlencoded({ extended: true }));
app.use(haltOnTimedout);

// Express Session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Welcome Page
app.get('/', (req, res) => {
    Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "username",
                as: "videos"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $sample: { size: 100 }
        }
    ]).then(videos => {
        if(req.user) {
            res.render('index', {
                title: 'VidParties',
                logUser: req.user,
                videos: videos
            });
        } else {
            res.render('index', {
                title: 'VidParties',
                logUser: "",
                videos: videos
            });
        }
    }).catch(err => console.log(err));
    
});

// Routes
app.use('/users', require('./routes/users'));
app.use('/videos', require('./routes/videos'));

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server Listening...');
});