// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var languageSchema = new Schema({
    language_id: String,
    title: String,
    icon: String,
    code: String,
    order_number: {
        type: Number,
        default: 0
    },
    is_primary: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive']
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

languageSchema.index({
    title: "text",
    code: "text",
    status: "text"
});

// // Execute before each user.save() call
languageSchema.pre('save', function(callback) {
    idGenerator.generateId('languages', 'language_id', labelConstants.language, (err, ID) => {
        this.language_id = ID;
        callback();
    });
});

var Language = mongoose.model('Language', languageSchema);
module.exports = Language;