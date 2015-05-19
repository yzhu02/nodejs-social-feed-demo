let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')

require('songbird')

const SALT = bcrypt.genSaltSync(10)

let UserSchema = mongoose.Schema({
  local: {
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  },

  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
    account: {
    }
  },

  twitter: {
    id: String,
    token: String,
    email: String,
    name: String
  },

  google: {
    id: String,
    token: String,
    email: String,
    name: String
  },

  linkedin: {
    id: String,
    token: String,
    email: String,
    name: String
  }
})

UserSchema.methods.generateHash = async function(pwd) {
  return await bcrypt.promise.hash(pwd, SALT)
}

UserSchema.methods.validatePassword = async function(pwd) {
  return await bcrypt.promise.compare(pwd, this.local.password)
}

UserSchema.pre('save', function(callback) {
  nodeify(async () => {
    if (this.isModified('local.password')) {
      this.local.password = await this.generateHash(this.local.password)
    }
  }(), callback)
})

UserSchema.methods.linkAccount = function(type, values) {
  // linkAccount('facebook', ...) => linkFacebookAccount(values)
  return this['link'+_.capitalize(type)+'Account'](values)
}

UserSchema.methods.linkLocalAccount = function({email, password}) {
  throw new Error('Not Implemented.')
}

UserSchema.methods.linkFacebookAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

UserSchema.methods.linkTwitterAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

UserSchema.methods.linkGoogleAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

UserSchema.methods.linkLinkedinAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

UserSchema.methods.unlinkAccount = function(type) {
  throw new Error('Not Implemented.')
}

module.exports = mongoose.model('User', UserSchema)
