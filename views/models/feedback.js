cf// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var feedbackSchema = new Schema({
    feedback_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['passenger', 'driver'],
        default: 'passenger'
    },
    user_id: {
        type: String,
        default: ''
    },
    ratings: {
        type: Number,
        default: 0
    },
    message: {
        type: String,
        default: ''
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
feedbackSchema.pre('save', function(callback) {
    idGenerator.generateId('feedbacks', 'feedback_id', labelConstants.feedback, (err, ID) => {
        this.feedback_id = ID;
        callback();
    });
});

var Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;