// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var subCategorySchema = new Schema({
    sub_category_id: {
        type: String,
        default:''
    },
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
subCategorySchema.pre('save', function(callback) {
    idGenerator.generateId('sub_categories', 'sub_category_id', labelConstants.sub_category, (err, ID) => {
        this.sub_category_id = ID;
        callback();
    });
});

var Sub_category = mongoose.model('Sub_category', subCategorySchema);
module.exports = Sub_category;