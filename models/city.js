// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var citySchema = new Schema({
    city_id: {
        type: String,
        default: ''
    },
    country_id: {
        type: String,
        default: ''
    },
    state_id: {
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
    },
    name: {
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
citySchema.pre('save', function(callback) {
    idGenerator.generateId('cities', 'city_id', labelConstants.city, (err, ID) => {
        this.city_id = ID;
        callback();
    });
});

var City = mongoose.model('City', citySchema);
module.exports = City;