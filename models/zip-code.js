// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var zipCodeSchema = new Schema({
    zip_code_id: {
        type: String,
        default: ''
    },
    city_id: {
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
zipCodeSchema.pre('save', function(callback) {
    idGenerator.generateId('zip_codes', 'zip_code_id', labelConstants.zip_code, (err, ID) => {
        this.zip_code_id = ID;
        callback();
    });
});

var Zip_code = mongoose.model('Zip_code', zipCodeSchema);
module.exports = Zip_code;