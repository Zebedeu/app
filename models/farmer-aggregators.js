// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('../utils/id-generator');
const labelConstants = require('../constants/label-constants');

// create a schema
var famerAndAggregator = new Schema({

    famerAndAggregator_id: {
        type: String,
        default:''
    },

    aggregator_id: {
        type: String,
        default:''
    },
    farmer_id: {
        type: String,
        default:''
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
famerAndAggregator.pre('save', function(callback) {
    idGenerator.generateId(labelConstants.famer_and_aggregator, (err, ID) => {
        this.famerAndAggregator_id = ID;
        callback();
    });
});

var farmer_and_aggregator = mongoose.model('farmer_and_aggregators', famerAndAggregator);
module.exports = farmer_and_aggregator;