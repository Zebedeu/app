// grab the things we need
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
let referenceSchema = new Schema({
    reference_id: {
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
    source_id: {
        type: String,
        default: ''
    },
    customer_name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    phone_number: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        default: 0
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        default: Date.now
    },
    atm_reference_response: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        enum: ['waiting', 'completed'],
        default:'waiting'
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


// Execute before each user.save() call
referenceSchema.pre('save', function(callback) {
    idGenerator.generateId('references', (err, ID) => {
        this.reference_id = ID;
        callback();
    });
});

let Reference = mongoose.model('Reference', referenceSchema);
module.exports = Reference;