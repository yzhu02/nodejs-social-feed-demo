let _ = require('lodash')
let then = require('express-then')
let isLoggedIn = require('./middlewares/isLoggedIn')

require('songbird')

let facebookClient = require('./facebookClient')


// Scope specifies the desired data fields from the user account
let scope = 'email'

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}))

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    app.post('/signup', passport.authenticate('local-signup', {
	    successRedirect: '/profile',
	    failureRedirect: '/signup',
	    failureFlash: true
	}))


    let scope = 'email'

	// Authentication route & Callback URL
	app.get('/auth/facebook', passport.authenticate('facebook', {scope}))
	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    	successRedirect: '/profile',
    	failureRedirect: '/profile',
    	failureFlash: true
	}))

	// Authorization route & Callback URL
	app.get('/connect/facebook', passport.authorize('facebook', {scope}))
	app.get('/connect/facebook/callback', passport.authorize('facebook', {
    	successRedirect: '/profile',
    	failureRedirect: '/profile',
    	failureFlash: true
	}))

    app.get('/timeline', isLoggedIn, then(async (req, res) => {
        let posts = await facebookClient.getFacebookTimeline(req)
        res.render('timeline.ejs', {
            posts: posts
        })
    }))


}