// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var labelSchema = new Schema({
    label_id: String,
    title: String,
    code: String,
    value: Object,
    type: {
        type: String,
        default: 'customer'
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

labelSchema.index({
    title: "text",
    code: "text",
    status: "text",
    value: "text"
});

// // Execute before each user.save() call
labelSchema.pre('save', function(callback) {
    idGenerator.generateId('language_labels', 'label_id', labelConstants.language_label, (err, ID) => {
        this.label_id = ID;
        callback();
    });
});

var Language_label = mongoose.model('Language_label', labelSchema);
module.exports = Language_label;