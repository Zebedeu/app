// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var cmsSchema = new Schema({
    cms_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['general', 'producers', 'aggregators', 'compradors', 'transporters'],
        default: 'general'
    },
    description: {
        type: Object,
        default: ''
    },
    link: {
        type: Object,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
});

// // Execute before each user.save() call
cmsSchema.pre('save', function(callback) {
    idGenerator.generateId('cms', 'cms_id', labelConstants.cms, (err, ID) => {
        this.cms_id = ID;
        callback();
    });
});

var Cms = mongoose.model('Cms', cmsSchema);
module.exports = Cms;