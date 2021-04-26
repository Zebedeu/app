// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var countrySchema = new Schema({
    country_id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    calling_code: {
        type: String,
        default: ''
    },
    iso2_code: {
        type: String,
        default: ''
    },
    iso3_code: {
        type: String,
        default: ''
    },
    capital: {
        type: String,
        default: ''
    },
    currency_id: {
        type: String,
        default: ''
    },
    gst_percentage: {
        type: Number,
        default: 0
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
countrySchema.pre('save', function(callback) {
    idGenerator.generateId('countries', 'country_id', labelConstants.country, (err, ID) => {
        this.country_id = ID;
        callback();
    });
});

var Country = mongoose.model('Country', countrySchema);
module.exports = Country;