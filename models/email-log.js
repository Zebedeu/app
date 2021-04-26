// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var emailLogSchema = new Schema({
    email_log_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: ''
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
emailLogSchema.pre('save', function(callback) {
    idGenerator.generateId('email_logs', 'email_log_id', labelConstants.email_log, (err, ID) => {
        this.email_log_id = ID;
        callback();
    });
});

var Email_log = mongoose.model('Email_log', emailLogSchema);
module.exports = Email_log;