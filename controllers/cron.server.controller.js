let CMS = require('mongoose').model('Cms');
let State = require('mongoose').model('State');
let City = require('mongoose').model('City');
let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let EmailTemplate = require('mongoose').model('Email_template');
let MobileCountryCode = require('mongoose').model('Mobile_country_code');
let passwordHandler = require('../utils/password-handler');
let labels = require('../utils/labels.json');
let smsManager = require('../utils/sms-manager');
let emailController = require('./email.server.controller');
let Sms_template = require('mongoose').model('Sms_template');
let Push_template = require('mongoose').model('Push_template');
let Notification_log = require('mongoose').model('Notification_log');
let config = require('../../config/config');
let _ = require('underscore');
let Cart = require('mongoose').model('Cart');
let Order = require('mongoose').model('Order');
let moment = require('moment');

exports.clearCart = function(req, res) {
	let cartIdArr = [];
	Cart.find({}, { _id: 0, cart_id: 1, updated_at: 1 }, (err, response) => {
		_.each(response, (element, index, list) => {
			let dateObj = moment(new Date()); //now
			let dateObjISO = moment(dateObj.toISOString());
			let updatedAt = moment(element.updated_at);

			let totalMins = dateObjISO.diff(updatedAt, 'minutes');
			if(totalMins > 720){
				cartIdArr.push(element.cart_id)
			}
        })

        if(cartIdArr.length > 0){
			Cart.remove({ cart_id: { $in: cartIdArr } }, (err, response) => {
				console.log(err);
				console.log('removed from cart');
			})
		}
	})
};

exports.clearATMReference = function(req, res) {
	Order.find({ payment_type: 'atm_reference', status: {$ne: 'cancelled'} }, { _id: 0, order_id: 1, atm_reference_response: 1 }, (err, response) => {
		let orderIdArr = [];
		_.each(response, (element, index, list) => {
			let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
		  	let endDate = moment(moment(element.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

		  	let days = endDate.diff(currentDate, 'days');
		  	if(days<0){
		  		orderIdArr.push(element.order_id);
		  	}
        })

		if(orderIdArr.length > 0){
			Order.update({ order_id: { $in: orderIdArr } }, {status: "cancelled"}, {multi: true}, function(err, update_response) {
				console.log(err);
				console.log(update_response);
			});
		}
	})
};