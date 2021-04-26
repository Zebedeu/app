// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var estimatedSchema = new Schema({
    estimated_transportation_id: {
        type: String,
        default: ''
    },
    to: {
        type: String,
        default: ''
    },
    origin: {
        type: String,
        default: ''
    },
    price: {
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
estimatedSchema.pre('save', function(callback) {
    idGenerator.generateId('estimated_transportations', 'estimated_transportation_id', labelConstants.estimated_transportation, (err, ID) => {
        this.estimated_transportation_id = ID;
        callback();
    });
});

var Estimated_transportation = mongoose.model('Estimated_transportation', estimatedSchema);
module.exports = Estimated_transportation;