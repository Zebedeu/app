// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var productVarietySchema = new Schema({
    product_variety_id: {
        type: String,
        default:''
    },
    sub_category_id: {
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
productVarietySchema.pre('save', function(callback) {
    idGenerator.generateId('product_varieties', 'product_variety_id', labelConstants.product_variety, (err, ID) => {
        this.product_variety_id = ID;
        callback();
    });
});

var Product_variety = mongoose.model('Product_variety', productVarietySchema);
module.exports = Product_variety;