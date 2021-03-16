// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var walletLogSchema = new Schema({
    wallet_log_id: {
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
    type: {
        type: String,
        enum: ['add', 'sub'],
        default: 'add'
    },
    title: {
        type: Object,
        default: {}
    },
    description: {
        type: Object,
        default: {}
    },
    amount: {
        type: Number,
        default: 0
    },
    remaining_balance: {
        type: Number,
        default: 0
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
walletLogSchema.pre('save', function(callback) {
    idGenerator.generateId('wallet_logs', (err, ID) => {
        this.wallet_log_id = ID;
        callback();
    });
});

var Wallet_log = mongoose.model('Wallet_log', walletLogSchema);
module.exports = Wallet_log;