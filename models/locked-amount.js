// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var lockedAmountSchema = new Schema({
     locked_amount_id: {
          type: String,
          default: ''
     },
     user_id: {
          type: String,
          default: ''
     },
     shipment_id: {
          type: String,
          default: ''
     },
     order_id: {
          type: String,
          default: ''
     },
     amount: {
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

lockedAmountSchema.pre('save', function (callback) {
     idGenerator.generateId('locked_amounts', (err, ID) => {
          this.locked_amount_id = ID;
          callback();
     });
});

var Locked_amount = mongoose.model('Locked_amount', lockedAmountSchema);
module.exports = Locked_amount;