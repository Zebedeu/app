// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var sizeSchema = new Schema({
    size_id: {
        type: String,
        default:''
    },
    title: {
        type: Object,
        default:{}
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
sizeSchema.pre('save', function(callback) {
    idGenerator.generateId('sizes', 'size_id', labelConstants.size, (err, ID) => {
        this.size_id = ID;
        callback();
    });
});

var Size = mongoose.model('Size', sizeSchema);
module.exports = Size;