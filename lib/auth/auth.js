const express = require('express');

const router = express.Router();
const request = require('request');


function logout(req, res) {
  if (process.env.NODE_ENV !== 'production') {
    // Destroying the session from redis;
    res.redirect('/');
    req.session.destroy(() => {
      if (err) {
        console.log(err);
      } else {
        console.log('destroyed session and redirecting...');
        res.redirect(`${process.env.ONE_LOGIN_URL}`);
      }
    });
  }
}

function loginUser(req, res) {
  let loggedIn = false;
  let username = 'User';

  if (process.env.NODE_ENV !== 'production') {
    loggedIn = true;
  } else {
    loggedIn = req.isAuthenticated();
    if (loggedIn) {
      username = req.session.passport.user.displayName.split(' ')[0];
    }
  }
  return res.json({
    status: loggedIn,
    name: username
  });
}


exports.enable = (app, contextPath) => {
  app.use(/\/api/, router);
  app.get(contextPath+'/api/logout', logout);
  app.get(contextPath+'/api/check-login', loginUser);
};
