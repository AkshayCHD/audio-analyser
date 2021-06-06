const passport = require('passport');
var jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const express = require('express');
const User = require('./models/user.model');
const router = express.Router();
// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_LOGIN_CLIENT_ID,
    clientSecret: process.env.GOOGLE_LOGIN_CLIENT_SECRET,
    callbackURL: `/auth/google/callback`
  },    
  async function(accessToken, refreshToken, profile, done) {
    try {
        console.log("Trying to login", profile);
        let user = await User.findOne({ googleId: profile.id });
        if(!user) {
            user = await User({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
            }).save();
        }
        return done(null, user);
    } catch(err) {
        return done(err, null);
    }
  }
));
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

router.use(passport.initialize());
router.use(passport.session());

router.get('/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        const user = req.user;
        if(user.isApproved === false) {
            return  res.redirect(`${process.env.FRONTEND_URL}/login-success?approvalStatus=Pending`);
        }
        var token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { algorithm: 'HS256'});
        res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}&approvalStatus=Approved`);
});

module.exports = router;