const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const GITHUB_CLIENT_ID = 'YOUR_CLIENT_ID';
const GITHUB_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

const app = express();

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production'
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// app.get('/', (req, res) => {
//     if (req.isAuthenticated()) {
//         res.send(`<h1>Hello ${req.user.username}</h1><a href="/logout">Logout</a>`);
//     } else {
//         res.send('<h1>Home</h1><a href="/auth/github">Login with GitHub</a>');
//     }
// });
// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

const path = require('path');
const ROOT_DIR = path.resolve(__dirname, 'public'); // Define a safe root directory

app.get('/:path', function(req, res) {
  let userPath = req.params.path;
  let resolvedPath = path.resolve(ROOT_DIR, userPath); // Normalize the path

  // Ensure the resolved path is within the root directory
  if (!resolvedPath.startsWith(ROOT_DIR)) {
    res.status(403).send('Access denied');
    return;
  }

  res.sendFile(resolvedPath);
});

app.listen(3000, () => {
    console.log('App listening on port 3000');
});
