// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var notificationLogSchema = new Schema({
    notification_log_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['producers', 'aggregators', 'compradors', 'transporters'],
        default: 'producers'
    },
    user_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: ''
    },
    description: {
        type: Object,
        default: ''
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    type: {
        type: String,
        enum: ['system', 'promotion'],
        default: 'system',
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
notificationLogSchema.pre('save', function(callback) {
    idGenerator.generateId('notification_logs', (err, ID) => {
        this.notification_log_id = ID;
        callback();
    });
});

var Notification_log = mongoose.model('Notification_log', notificationLogSchema);
module.exports = Notification_log;