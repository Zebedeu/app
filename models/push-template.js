const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// State Schema
const pushTemplate = new Schema({
    push_template_id: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    value: {
        type: Object,
        default: '',
    },
    caption_value: {
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
    }
});

// Execute before each Help_Topic.save() call
pushTemplate.pre('save', function(callback) {
    idGenerator.generateId('push_templates', 'push_template_id', labelConstants.push_templates, (err, ID) => {
        this.push_template_id = ID;
        callback();
    });
});

const Push_template = mongoose.model('Push_template', pushTemplate);
module.exports = Push_template;