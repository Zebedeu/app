// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var unitSchema = new Schema({
    unit_id: {
        type: String,
        default:''
    },
    title: {
        type: Object,
        default:{}
    },
    plural_title: {
        type: Object,
        default:{}
    },
    max_price_range: {
        type: Number,
        default: 0
    },
    min_qty: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive']
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
unitSchema.pre('save', function(callback) {
    idGenerator.generateId('units', 'unit_id', labelConstants.unit, (err, ID) => {
        this.unit_id = ID;
        callback();
    });
});

var Unit = mongoose.model('Unit', unitSchema);
module.exports = Unit;