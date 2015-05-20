let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let nodeifyit = require('nodeifyit')
let util = require('util')

let User = require('../models/user')

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
      console.log('account: ' + util.inspect(account))

      let user = await User.promise.findOne({'facebook.id': account.id})
      if (user) {
        console.log('Facebook user found for given facebook.id')
        if (req.user) {
          console.log('req.user exists')
          if (req.user.facebook.id === user.facebook.id) {
            console.log('req.user.facebook.id matches user.facebook.id')
            req.user = user
            req.user.facebook.account = account
            return req.user
          } else {
            return [false, {message: 'req.user.facebook.id does not match with user.facebook.id'}]
          }
        }
      } else {
        let user = req.user
        if (!user) {
          return [false, {message: 'not local logged in'}]
        } else {
          user.facebook.id = account.id
          user.facebook.email = account.emails[0].value
          user.facebook.token = token
          user.facebook.name = account.username
          console.log('saving facebook user: ' + JSON.stringify(user))
          try {
            await user.save()
            user.facebook.account = account
            req.user = user
            return user
          } catch (e) {
            console.log(util.inspect(e))
            return [false, {message: e.message}]
          }
        }
        
      }
  }
}

function configure(authConfig) {
  //console.log('config: ' + util.inspect(config))

  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async (user) => user.local.email))

  passport.deserializeUser(nodeifyit(async (email) => {
    return await User.findOne({'local.email': email}).exec()
  }))

  useExternalPassportStrategy(FacebookStrategy, {
    clientID: authConfig.facebook.consumerKey,
    clientSecret: authConfig.facebook.consumerSecret,
    callbackURL: authConfig.facebook.callbackUrl
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
