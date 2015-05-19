let _ = require('lodash')
let then = require('express-then')
let isLoggedIn = require('./middlewares/isLoggedIn')

let fbgraph = require('fbgraph')

let networks = {
    facebook: {
        icon: 'facebook',
        name: 'Facebook',
        class: 'btn-primary'
    },
    twitter: {
        icon: 'twitter',
        name: 'Twitter',
        class: 'btn-info'
    },
    googleplus: {
        icon: 'google-plus',
        name: 'Google',
        class: 'btn-danger'
    }
}

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
        console.log('req.user: ' + JSON.stringify(req.user)
            )
        fbgraph.setAccessToken(req.user.facebook.token)
        fbgraph.get('/me/posts', function(fbErr, fbRes) {
            if (fbErr) {
                console.log('facebook err: ' + JSON.stringify(fbErr))
            } else {
                let fbData = fbRes.data
                let posts = fbData.map(function(fbpost) {
                    let post = {
                        from: {
                        }
                    }
                    post.id = fbpost.id
                    // if (req.user.facebook.account.username) {
                    //     post.from.username = req.user.facebook.account.username
                    // }
                    // post.from.image = req.user.facebook.account.image
                    post.from.name = fbpost.from.name
                    post.text = fbpost.message
                    if (fbpost.link) {
                        post.link = fbpost.link
                    }
                    if (fbpost.picture) {
                        post.picture = fbpost.picture
                    }
                    if (fbpost.likes) {
                        post.liked = true
                    } else {
                        post.liked = false
                    }
                    post.network = networks.facebook
                    return post
                })
                console.log('posts: ' + JSON.stringify(posts))
                res.render('timeline.ejs', {
                    posts: posts
                })
            }
        })
        
    }))
}