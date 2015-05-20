let fbgraph = require('fbgraph')

let networks = require('../config/networks')

require('songbird')

module.exports = {
	getFacebookTimeline: async function(req) {
	    fbgraph.setAccessToken(req.user.facebook.token)
	    let fbRes = await fbgraph.promise.get('/me/posts')
	    return fbRes.data.map(function(fbpost) {
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
	}
}
