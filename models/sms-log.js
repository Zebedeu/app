// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var smsLogSchema = new Schema({
    sms_log_id: {
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
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
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
smsLogSchema.pre('save', function(callback) {
    idGenerator.generateId('sms_logs', 'sms_log_id', labelConstants.sms_log, (err, ID) => {
        this.sms_log_id = ID;
        callback();
    });
});

var Sms_log = mongoose.model('Sms_log', smsLogSchema);
module.exports = Sms_log;