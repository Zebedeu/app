// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var stateSchema = new Schema({
    state_id: {
        type: String,
        default: ''
    },
    total_orders: {
        type: Number,
        default: 0
    },
    country_id: {
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
stateSchema.pre('save', function(callback) {
    idGenerator.generateId('states', 'state_id', labelConstants.state, (err, ID) => {
        this.state_id = ID;
        callback();
    });
});

var State = mongoose.model('State', stateSchema);
module.exports = State;