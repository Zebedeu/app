// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var currencySchema = new Schema({
    currency_id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    symbol_native: {
        type: String,
        default: ''
    },
    decimal_digits: {
        type: String,
        default: ''
    },
    rounding: {
        type: String,
        default: ''
    },
    name_plural: {
        type: String,
        default: ''
    },
    symbol: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});


// // Execute before each user.save() call
currencySchema.pre('save', function(callback) {
    idGenerator.generateId('currencies', 'currency_id', labelConstants.currency, (err, ID) => {
        this.currency_id = ID;
        callback();
    });
});

var Currency = mongoose.model('Currency', currencySchema);
module.exports = Currency;