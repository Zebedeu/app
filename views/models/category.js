// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var categorySchema = new Schema({
    category_id: {
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
categorySchema.pre('save', function(callback) {
    idGenerator.generateId('categories', 'category_id', labelConstants.category, (err, ID) => {
        this.category_id = ID;
        callback();
    });
});

var Category = mongoose.model('Category', categorySchema);
module.exports = Category;