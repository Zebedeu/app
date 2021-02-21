// grab the things we need
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// Create a schema
let WithDrawRequestSchema = new Schema({
    withdraw_request_id: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['producers', 'aggregators', 'compradors', 'transporters'],
        default: 'producers'
    },
    amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
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
WithDrawRequestSchema.pre('save', function(callback) {
    idGenerator.generateId('withdraw_requests', (err, ID) => {
        this.withdraw_request_id = ID;
        callback();
    });
});

var WithDraw_Request = mongoose.model('WithDraw_Request', WithDrawRequestSchema);
module.exports = WithDraw_Request;