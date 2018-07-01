const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const startegyName = "local-login";
const menuItems = {
};

const user = {
  name: "admin",
  passwordHash: "$2a$10$MsmHScGY7HYzAy/Zhh6rJOmDF.iey9wwWa5lARZhiElgr4dH7FhK6",
  menu: menuItems,
  id: 1
};

function findUser(username, callback) {
  if (username === user.name) {
    return callback(null, user);
  }
  return callback(null);
}

function findUserForResponse(username, callback) {
  if (username.name === user.name) {
    return callback(null, user);
  }
  return callback(null);
}

function authenticate(successUrl, failureUrl) {
  return passport.authenticate(startegyName, {
    successRedirect: successUrl,
    failureRedirect: failureUrl
  });
}

function initializelocalStrategy(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(
    startegyName,
    new LocalStrategy((username, password, done) => {
      findUser(username, (err, user) => {
        if (err) {
          return done(err);
        }

        // User not found
        if (!user) {
          return done(null, false);
        }

        bcrypt.compare(password, user.passwordHash, (err, isValid) => {
          if (err) {
            return done(err);
          }
          if (!isValid) {
            return done(null, false);
          }

          return done(null, user);
        });
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    findUserForResponse(user, done);
  });
}

module.exports = { use: initializelocalStrategy, authenticate: authenticate };
