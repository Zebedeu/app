// grab the things we need
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
let orderSchema = new Schema({
    order_id: {
        type: String,
        default: ''
    },
    buyer_info: {
        type: Object,
        default: {}
    },
    address_info: {
        type: Object,
        default: {}
    },
    products: {
        type: Array,
        default: []
    },
    delivery_at: {
        type: Date,
        default: Date.now
    },
    payment_type: {
        type: String,
        enum: ['wallet', 'atm_reference', 'bank'],
        default:'wallet'
    },
    atm_reference_response: {
        type: Object,
        default: {}
    },
    cargon_is_delivered: {
        type: Boolean,
        default: false
    },
    buyer_received: {
        type: String,
        enum: ['waiting', 'received', 'no_received'],
        default:'waiting'
    },
    payment_status: {
        type: String,
        enum: ['waiting', 'paid'],
        default:'waiting'
    },
    transport_fee: {
        type: Number,
        default: 0
    },
    transporters: {
        type: Array,
        default: []
    },
    transporter_id: {
        type: String,
        default: ''
    },
    is_compradors_accepted: {
        type: Boolean,
        default: false
    },
    subtotal: {
        type: Number,
        default: 0
    },
    shipping: {
        type: Number,
        default: 0
    },
    is_rated: {
        type: Boolean,
        default: false
    },
    transporter_rating: {
        type: String,
        default: ''
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },

    invoice: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['waiting', 'reserved', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'],
        default:'waiting'
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
// orderSchema.pre('save', function(callback) {
//     idGenerator.generateId(labelConstants.order, (err, ID) => {
//         this.order_id = ID;
//         callback();
//     });
// });

let Order = mongoose.model('Order', orderSchema);
module.exports = Order;