let config = require('../../config/config');
let moment = require('moment');
let labels = require('../utils/labels.json');
let logger = require('../utils/logger');
let axios = require('axios');
let User = require('mongoose').model('User');
let Sms_template = require('mongoose').model('Sms_template');



exports.getKepyaIndex = async function (req, res) {

	
	try{
	var date = req.params.dateTo ? req.params.dateTo : new Date();
	var mercado  = req.query.mercado ? req.query.mercado : '30';

	var response = await axios.get("http://186.192.168.122:4000/api/v1/trace/mercado/"+mercado+"/start/"+ date)

	var idx = response.data
	  return res.send(idx) ;	

	}catch(error) {
		console.error(error)
	}
}
exports.kepyaIndex = function (req, res) {

 
	res.render('kepyaindex', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		layout: false,
		labels,
		moment,
		breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + req.session.user_type+"/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_KEPYA_INDEX'][(req.session.language || 'PT')] + "</li>",
		language: req.session.language || 'PT',
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')

	})

	
};


exports.authenticate = function (req, res) {
	if (req.body.type == 'email' && req.body.phoneNumberAndEmail && req.body.password) {

			let email_or_phone = req.body.phoneNumberAndEmail.trim();

			passwordHandler.encrypt(req.body.password.toString(), (encPin) => {
			let regEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;

			var emailAndPhone= '';
			if( regEmail.test(email_or_phone) == true ){
				let regexEmail = new RegExp(['^', email_or_phone, '$'].join(''), 'i');
				emailAndPhone = { email: regexEmail }
			} else{
				emailAndPhone = { phone_number: email_or_phone }
			} 

			User.findOne( emailAndPhone , { _id: 0, user_id: 1, first_name: 1, email: 1, user_type: 1, password: 1, mobile_country_code: 1, phone_number: 1, status: 1, is_verify_mobile: 1 }, (err, response) => {
				if (!response) {
					res.send({ code: 404, message: `${labels['LBL_EMAIL_AND_PHONE_ID_NOT_EXIST'][(req.session.language || 'PT')]}`, user_type: '' });
				} else if (response.status == 'inactive') {
					res.send({ code: 406, message: `${labels['LBL_YOUR_ACCOUNT_INACTIVE'][(req.session.language || 'PT')]}`, user_type: response.user_type });
				} else if (response.password != encPin) {
					res.send({ code: 402, message: `${labels['LBL_INVALID_PASSWORD'][(req.session.language || 'PT')]}`, user_type: response.user_type });
				} else {
					if (!response.is_verify_mobile) {
						Sms_template.findOne({ code: 'VERIFY_MOBILE_NO' }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
							if (sms) {
								let otp = parseInt(Math.random() * (999999 - 111111) + 111111);
								let caption = (sms['value'][req.session.language || config.default_language_code]);
								caption = caption.replace("#OTP#", otp).replace("#NAME#", response.first_name);
								smsManager.sendSMS({ message: caption, mobile: (response.mobile_country_code + response.phone_number) });

								User.update({ mobile_country_code: response.mobile_country_code, phone_number: response.phone_number }, { $set: { otp } }, (err, update_response) => {
									res.send({ code: 409, message: '', user_type: response.user_type, user_info: response });
								})
							} else {
								res.send({ code: 409, message: '', user_type: response.user_type, user_info: response });
							}
						})
					} else {
						res.send({ code: 200, message: '', user_type: response.user_type });
					}
				}
			})
		})
	} else if ((req.body.type == 'google' || req.body.type == 'facebook') && req.body.social_id) {
		User.findOne({ social_id: req.body.social_id }, { _id: 0, user_id: 1, first_name: 1, user_type: 1, password: 1, status: 1 }, (err, response) => {
			if (!response) {
				res.send({ code: 404, message: `${labels['LBL_YOUR_SOCIAL_ACCOUNT'][(req.session.language || 'PT')]}`, user_type: '' });
			} else if (response.status == 'inactive') {
				res.send({ code: 406, message: `${labels['LBL_YOUR_ACCOUNT_INACTIVE'][(req.session.language || 'PT')]}`, user_type: response.user_type });
			} else {
				req.session.user_id = response.user_id;
				req.session.name = response.first_name;
				req.session.user_type = response.user_type;
				req.session.login_type = req.body.type;

				console.log(req.session);

				res.send({ code: 200, message: '', user_type: response.user_type });
			}
		})
	} else {
		res.send({ code: 400, message: `${labels['LBL_PARAMETER_MISSING'][(req.session.language || 'PT')]}` });
	}
};

