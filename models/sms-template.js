const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// State Schema
const smsTemplate = new Schema({
    sms_template_id: {
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
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

smsTemplate.pre('save', function(callback) {
    idGenerator.generateId('sms_templates', 'sms_template_id', labelConstants.sms_templates, (err, ID) => {
        this.sms_template_id = ID;
        callback();
    });
});

const Sms_template = mongoose.model('Sms_template', smsTemplate);
module.exports = Sms_template;