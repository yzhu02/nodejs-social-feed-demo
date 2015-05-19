let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let User = require('../models/user')
let nodeifyit = require('nodeifyit')
let util = require('util')

require('songbird')

function useExternalPassportStrategy(OauthStrategy, config, accountType) {
  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, _ignored_, account) {
      // 1. Load user from store
      // 2. If req.user exists, we're authorizing (connecting an account)
      // 2a. Ensure it's not associated with another account
      // 2b. Link account
      // 3. If not, we're authenticating (logging in)
      // 3a. If user exists, we're logging in via the 3rd party account
      // 3b. Otherwise create a user associated with the 3rd party account

      console.log('authCB() is called')
      console.log('token: ' + token)
      console.log('accountType: ' + accountType)
      console.log('account: ' + util.inspect(account))

      let user = await User.promise.findOne({'facebook.id': account.id})
      if (user) {
        if (req.user) {
          if (req.user.facebook.id === user.facebook.id) {
            user.facebook.account = account
          } else {
            console.log('req.user.facebook.id does not match with user.facebook.id')
          }
        }
      } else {
        let user = req.user
        if (!user) {
          console.log('Please local login first')
        } else {
          user.facebook.id = account.id
          user.facebook.email = account.emails[0].value
          user.facebook.token = token
          user.facebook.name = account.username
          try {
            return await user.save()
          } catch (e) {
            console.log(util.inspect(e))
            return [false, {message: e.message}]
          }
        }
        
      }
  }
}

function configure(config) {
  //console.log('config: ' + util.inspect(config))

  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async (user) => user.local.email))

  passport.deserializeUser(nodeifyit(async (email) => {
    return await User.findOne({'local.email': email}).exec()
  }))

  useExternalPassportStrategy(FacebookStrategy, {
    clientID: config.facebookAuth.consumerKey,
    clientSecret: config.facebookAuth.consumerSecret,
    callbackURL: config.facebookAuth.callbackUrl
  }, 'facebook')


  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'facebook')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'google')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'twitter')

  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    failureFlash: true
  }, nodeifyit(async (email, pwd) => {
    email = email.toLowerCase()
    let user = await User.promise.findOne({'local.email': email})
    if (!user || email !== user.local.email) {
      return [false, {message: 'Invalid email'}]
    }
    if (!await user.validatePassword(pwd)) {
      return [false, {message: 'Invalid password'}]
    }
    return user
  }, {spread: true})))

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    failureFlash: true
  }, nodeifyit(async (email, pwd) => {
      email = (email || '').toLowerCase()
      // Is the email taken?
      if (await User.promise.findOne({'local.email': email})) {
          return [false, {message: 'That email is already taken.'}]
      }

      // create the user
      let user = new User()
      user.local.email = email
      user.local.password = pwd
      try {
        return await user.save()
      } catch (e) {
        console.log(util.inspect(e))
        return [false, {message: e.message}]
      }
  }, {spread: true})))

  return passport
}

module.exports = {passport, configure}
