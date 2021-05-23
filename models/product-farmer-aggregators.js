// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('../utils/id-generator');
const labelConstants = require('../constants/label-constants');

// create a schema
var productToFarmerAndAggregator = new Schema({

    productToFarmerAndAggregator_id: {
        type: String,
        default:''
    },

    aggregator_id: {
        type: String,
        default:''
    },
    producer_id: {
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
productToFarmerAndAggregator.pre('save', function(callback) {
    idGenerator.generateId(labelConstants.product_farmer_aggregator, (err, ID) => {
        this.productToFarmerAndAggregator_id = ID;
        callback();
    });
});

var product_farmer_aggregator = mongoose.model('product_farmer_aggregator', productToFarmerAndAggregator);
module.exports = product_farmer_aggregator;