// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var helpSchema = new Schema({
    help_id: {
        type: String,
        default: ''
    },
    help_category_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: {}
    },
    answer: {
        type: Object,
        default: {}
    },
    link: {
        type: Object,
        default: {}
    },
    order_number: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
});

// // Execute before each user.save() call
helpSchema.pre('save', function(callback) {
    idGenerator.generateId('helps', 'help_id', labelConstants.help, (err, ID) => {
        this.help_id = ID;
        callback();
    });
});

var Help = mongoose.model('Help', helpSchema);
module.exports = Help;