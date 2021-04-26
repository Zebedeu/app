// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var helpCategotySchema = new Schema({
    help_category_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: ''
    },
    user_type: {
        type: String,
        default: 'customer'
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
helpCategotySchema.pre('save', function(callback) {
    idGenerator.generateId('help_categories', 'help_category_id', labelConstants.help_category, (err, ID) => {
        this.help_category_id = ID;
        callback();
    });
});

var Help_category = mongoose.model('Help_category', helpCategotySchema);
module.exports = Help_category;