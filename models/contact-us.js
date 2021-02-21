// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var contactSchema = new Schema({
    contact_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['passenger', 'driver'],
        default: 'passenger'
    },
    user_id: {
        type: String,
        default: ''
    },
    message: {
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
contactSchema.pre('save', function(callback) {
    idGenerator.generateId('contact_us', 'contact_id', labelConstants.contact_us, (err, ID) => {
        this.contact_id = ID;
        callback();
    });
});

var Contact_us = mongoose.model('Contact_us', contactSchema);
module.exports = Contact_us;