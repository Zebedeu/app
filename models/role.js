// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var roleSchema = new Schema({
    role_id: String,
    title: String,
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
roleSchema.pre('save', function(callback) {
    idGenerator.generateId('roles', 'role_id', labelConstants.role, (err, ID) => {
        this.role_id = ID;
        callback();
    });
});

var Role = mongoose.model('Role', roleSchema);
module.exports = Role;