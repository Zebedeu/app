const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// State Schema
const emailTemplate = new Schema({
    emailtemplate_id: {
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
    from_name: {
        type: String,
        default: ''
    },
    from_email: {
        type: String,
        default: ''
    },
    email_subject: {
        type: Object,
        default: {},
    },
    description: {
        type: Object,
        default: {}
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
emailTemplate.pre('save', function(callback) {
    idGenerator.generateId('email_templates', 'emailtemplate_id', labelConstants.email_templates, (err, ID) => {
        this.emailtemplate_id = ID;
        callback();
    });
});

const Email_template = mongoose.model('Email_template', emailTemplate);
module.exports = Email_template;