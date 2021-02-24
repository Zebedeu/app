// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var cartSchema = new Schema({
    cart_id: {
        type: String,
        default: ''
    },
    product_id: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    qty: {
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
cartSchema.pre('save', function(callback) {
    idGenerator.generateId(labelConstants.cart, (err, ID) => {
        this.cart_id = ID;
        callback();
    });
});

var Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;