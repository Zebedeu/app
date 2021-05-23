// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var userSchema = new Schema({
    user_id: {
        type: String,
        default: ''
    },
    favourite_product_id: {
        type: Array,
        default: []
    },
    recent_search_product_id: {
        type: Array,
        default: []
    },
    statistics: {
        type: Object,
        default: {}
    },
    wallet: {
        type: Number,
        default: 0
    },
    social_id: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['individual', 'company'],
        default: 'individual'
    },
    company_name: {
        type: String,
        default: ''
    },
    register_type: {
        type: String,
        enum: ['email', 'google', 'facebook'],
        default: 'email'
    },
    first_name: {
        type: String,
        default: ''
    },
    last_name: {
        type: String,
        default: ''
    },
    is_verify_email: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    nif: {
        type: String,
        default: ''
    },
    gps_location: {
        address: {
            type: String,
            default: ''
        },
        latitude: {
            type: Number,
            default: 0
        },
        longitude: {
            type: Number,
            default: 0
        }
    },
    address: {
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
    is_verify_mobile: {
        type: Boolean,
        default: false
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    phone_number: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['producers', 'aggregators', 'compradors', 'transporters', 'trading'],
        default: 'producers'
    },
    over_margin: {
        type: Number,
        default: 0
    },
    addresses: {
        type: Array,
        default: []
    },
    otp: {
        type: Number,
        default: 0
    },
    device_details: {
        device_name: {
            type: String,
            default: ''
        },
        device_type: {
            type: String,
            enum: ['none', 'android', 'ios'],
            default: 'none'
        },
        device_token: {
            type: String,
            default: ''
        }
    },
    bank_name: {
        type: String,
        default: ''
    },
    bank_account_no: {
        type: String,
        default: ''
    },
    kepya_commission: {
        type: Number,
        default: 0
    },
    last_login_date: {
        type: Date,
        default: Date.now
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
    }, 
    doc: {
        type: String,
        default: ''
    }
});


// // Execute before each user.save() call
userSchema.pre('save', function (callback) {
    idGenerator.generateId(labelConstants.user, (err, ID) => {
        this.user_id = ID;
        callback();
    });
});

var User = mongoose.model('User', userSchema);
module.exports = User;