// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var userSchema = new Schema({
    user_id: {
        type: String,
        default: ''
    },
    role_id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    profile: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    reset_code: {
        type: String,
        default: ''
    },
    otp: {
        type: Number,
        default: 0
    },
    last_login_date: {
        type: Date,
        default: Date.now
    },
    password: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});


// // Execute before each user.save() call
userSchema.pre('save', function(callback) {
    idGenerator.generateId('administrators', 'user_id', labelConstants.administrator, (err, ID) => {
        this.user_id = ID;
        callback();
    });
});

var Administrator = mongoose.model('Administrator', userSchema);
module.exports = Administrator;