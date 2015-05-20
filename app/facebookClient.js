let fbgraph = require('fbgraph')

let networks = require('../config/networks')

require('songbird')

module.exports = {
	getTimeline: async function(token) {
	    fbgraph.setAccessToken(token)
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
	},

	compose: async function(token, message) {
		fbgraph.setAccessToken(token)
		await fbgraph.promise.post('/me/feed', {message: message})
	}
}
