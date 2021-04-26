// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const labelConstants = require('./../constants/label-constants');
const idGenerator = require('./../utils/id-generator');

// create a schema
var loginlogSchema = new Schema({
	loginlog_id: String,
	user_type : String,
	login_id : String,
	email: String,
	name: String,
	ip: String,
	login_date: { type: Date, default: Date.now },
	logout_date:{ type: Date}
});


// // Execute before each user.save() call
loginlogSchema.pre('save', function(callback) {
	idGenerator.generateId('login_logs', 'loginlog_id', labelConstants.login_log, (err, ID) => {
        this.loginlog_id = ID;
        callback();
    });
});

var Login_log = mongoose.model('Login_log', loginlogSchema);
module.exports = Login_log;