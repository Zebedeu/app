// grab the things we need
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
let mobileCountryCodeSchema = new Schema({
    mobile_country_code_id: {
        type: String,
        default: ''
    },
    code: {
        type: String,
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


// // Execute before each user.save() call
mobileCountryCodeSchema.pre('save', function(callback) {
    idGenerator.generateId('mobile_country_codes', 'mobile_country_code_id', labelConstants.mobile_country_code, (err, ID) => {
        this.mobile_country_code_id = ID;
        callback();
    });
});

let Mobile_country_code = mongoose.model('Mobile_country_code', mobileCountryCodeSchema);
module.exports = Mobile_country_code;