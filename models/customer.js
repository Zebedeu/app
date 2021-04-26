// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var customerSchema = new Schema({
    customer_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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
customerSchema.pre('save', function(callback) {
    idGenerator.generateId('customers', 'customer_id', labelConstants.customer, (err, ID) => {
        this.customer_id = ID;
        callback();
    });
});

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;