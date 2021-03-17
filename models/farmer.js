// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var farmerSchema = new Schema({
    farmer_id: {
        type: String,
        default: ''
    },
    total_orders: {
        type: Number,
        default: 0
    },
    user_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['self', 'producers', 'aggregators'],
        default: 'self'
    },
    name: {
        type: String,
        default: ''
    },
    first_name: {
        type: String,
        default: ''
    },
    last_name: {
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
    phone_number: {
        type: String,
        default: ''
    },
    state_id: {
        type: String,
        default: ''
    },
    city_id: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    photo: {
        type: String,
        default: ''
    },
    bank_name: {
        type: String,
        default: ''
    },
    bank_account_no: {
        type: String,
        default: ''
    },
    nif: {
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


// // Execute before each farmer.save() call
farmerSchema.pre('save', function(callback) {
    idGenerator.generateId(labelConstants.farmer, (err, ID) => {
        this.farmer_id = ID;
        callback();
    });
});

var farmer = mongoose.model('Farmer', farmerSchema);
module.exports = farmer;