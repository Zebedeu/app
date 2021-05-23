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
let moment = require('moment');
let axios = require('axios');

let Farmer = require('mongoose').model('Farmer');

exports.welcome = function (req, res) {
	res.render('welcome', {
		labels,
		language: req.session.language || config.default_language_code,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')
	});
};

exports.getWalletDetails = function (req, res) {
	Setting.findOne({}, { bank_information: 1 }, (err, settings) => {
		res.send(settings)
	})
};

exports.checkYourEmail = function (req, res) {
	res.render('check-your-email', {
		labels,
		language: req.session.language || config.default_language_code,
		email: req.body.email,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.render = function (req, res) {
	if (!req.session.language) {
		req.session.language = config.default_language_code;
	}

	if (req.body.phoneNumberAndEmail && req.body.password) {
		passwordHandler.encrypt(req.body.password.toString(), (encPin) => {
			let email_or_phone = req.body.phoneNumberAndEmail.trim();
			let regEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;

			var emailAndPhone = '';
			if (regEmail.test(email_or_phone) == true) {

				let regexEmail = new RegExp(['^', email_or_phone.toLowerCase(), '$'].join(''), 'i');
				emailAndPhone = { email: regexEmail }
			} else {
				console.log('phone')
				emailAndPhone = { phone_number: email_or_phone }
			}

			User.findOne(emailAndPhone, { _id: 0, user_id: 1, first_name: 1, last_name: 1, user_type: 1, password: 1, status: 1, over_margin: 1 }, (err, response) => {
				
				if (!response) {
					Farmer.findOne(emailAndPhone, { _id: 0, farmer_id: 1, first_name: 1, email: 1, user_type: 1, password: 1, mobile_country_code: 1, phone_number: 1, status: 1, is_verify_mobile: 1 }, (err, farmer) => {
						if (!farmer) {
							return res.redirect('/');
						}else{
							console.log('------------ds-------' + farmer.farmer_id);
							console.log('------------ds-------' + farmer.user_type);
							req.session.user_id = farmer.farmer_id;
							req.session.name = farmer.first_name;
							req.session.user_type = farmer.user_type;
							req.session.login_type = 'email';
							let path = '/farmer/dashboard';
							return res.redirect(path);
						}
					})
				}
				
				else{
					if (response && response.status == 'active' && response.password == encPin) {
						req.session.user_id = response.user_id;
						req.session.name = response.first_name;
						req.session.user_type = response.user_type;
						req.session.login_type = 'email';
	
						let path = '/' + (response.user_type ? response.user_type + '/dashboard' : '');
	
						if (req.session.user_type == 'trading') {
							req.session.over_margin = response.over_margin;
							return res.redirect(path);
						} else {
							return res.redirect(path);
						}
					} else {
						return res.redirect('/');
					}
				}			
			})
		})
	} else {
		res.render('login', {
			labels,
			language: req.session.language || config.default_language_code,
			layout: false,
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	}
};

exports.authenticate = function (req, res) {
	if (req.body.type == 'email' && req.body.phoneNumberAndEmail && req.body.password) {

		let email_or_phone = req.body.phoneNumberAndEmail.trim();

		passwordHandler.encrypt(req.body.password.toString(), (encPin) => {
			let regEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;

			var emailAndPhone = '';
			if (regEmail.test(email_or_phone) == true) {
				let regexEmail = new RegExp(['^', email_or_phone, '$'].join(''), 'i');
				emailAndPhone = { email: regexEmail }
			} else {
				emailAndPhone = { phone_number: email_or_phone }
			}

			User.findOne(emailAndPhone, { _id: 0, user_id: 1, first_name: 1, email: 1, user_type: 1, password: 1, mobile_country_code: 1, phone_number: 1, status: 1, is_verify_mobile: 1 }, (err, response) => {
				if (!response) {
					// caso nao existe procurar no farmer 
					Farmer.findOne(emailAndPhone, { _id: 0, user_id: 1, first_name: 1, email: 1, user_type: 1, password: 1, mobile_country_code: 1, phone_number: 1, status: 1, is_verify_mobile: 1 }, (err, response) => {
						if (!response) {
							res.send({ code: 404, message: `${labels['LBL_EMAIL_AND_PHONE_ID_NOT_EXIST'][(req.session.language || 'PT')]}`, user_type: '' });
						} else {
							if (response.password != encPin) {
								res.send({ code: 402, message: `${labels['LBL_INVALID_PASSWORD'][(req.session.language || 'PT')]}`, user_type: response.user_type });
							}else{
								res.send({ code: 200, message: '', user_type: response.user_type });
							}
						}
					})
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

exports.forgotPassword = function (req, res) {
	if (req.body.email) {
		let email = req.body.email.trim();
		let regexEmail = new RegExp(['^', email, '$'].join(''), 'i');

		User.findOne({ email: regexEmail }, { _id: 0, user_id: 1, first_name: 1, user_type: 1, status: 1 }, (err, response) => {
			if (!response) {
				res.send({ code: 404, message: `${labels['LBL_EMAIL_ID_NOT_EXIST'][(req.session.language || 'PT')]}` });
			} else if (response.status == 'inactive') {
				res.send({ code: 406, message: `${labels['LBL_YOUR_ACCOUNT_INACTIVE'][(req.session.language || 'PT')]}` });
			} else {
				let email = req.body.email;
				let otp = parseInt(Math.random() * (999999 - 111111) + 111111);

				User.update({ email }, { $set: { otp } }, (err, update_response) => {
					emailController.send({ language: (req.session.language || config.default_language_code), code: 'FORGOT_PASSWORD', otp, email: req.body.email, name: response.first_name });
					res.send({ code: 200, message: `${labels['LBL_FORGOT_PASSWORD_VALIDATION'][(req.session.language || 'PT')]}` });
				})
			}
		})
	} else {
		res.render('forgot-password', {
			labels,
			language: req.session.language || config.default_language_code,
			layout: false,
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	}
};

exports.passwordChanged = function (req, res) {
	res.render('password-changed', {
		labels,
		language: req.session.language || config.default_language_code,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.resetPassword = function (req, res) {
	if (req.params.id) {
		User.findOne({ otp: parseInt(req.params.id) }, { _id: 0, email: 1 }, (err, result) => {
			console.log(result);
			if (!result) {
				return res.redirect('/');
			} else {
				res.render('reset-password', {
					labels,
					language: req.session.language || config.default_language_code,
					id: req.params.id,
					email: result.email,
					layout: false,
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),
				});
			}
		})
	} else if (req.body.otp && req.body.password) {
		console.log(req.body);
		User.findOne({ otp: parseInt(req.body.otp) }, { _id: 0, first_name: 1, email: 1 }, (err, result) => {
			if (!result) {
				res.send({ code: 404, message: `${labels['LBL_INVALID_OTP'][(req.session.language || 'PT')]}` });
			} else {
				passwordHandler.encrypt(req.body.password.toString(), (encPin) => {
					User.update({ otp: req.body.otp }, { $set: { password: encPin, otp: 0 } }, (err, update_response) => {
						emailController.send({ language: (req.session.language || config.default_language_code), code: 'PASSWORD_CHANGED', email: result.email, name: result.first_name });
						res.send({ code: 200, message: `${labels['LBL_PASSWORD_CHANGED_VALIDATION'][(req.session.language || 'PT')]}` });
					})
				})
			}
		})
	} else {
		return res.redirect('/');
	}
};

exports.logout = function (req, res) {
	req.session.user_id = '';
	req.session.name = '';
	req.session.user_type = '';
	req.session.login_type = '';

	return res.redirect('/');
};

exports.getUserProfile = function (req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, first_name: 1, last_name: 1, email: 1, phone_number: 1, state_id: 1, city_id: 1, mobile_country_code: 1, status: 1 }, (err, response) => {
		res.send(response);
	})
};

exports.getMobileCountryCode = function (req, res) {
	MobileCountryCode.find({}, { _id: 0, mobile_country_code_id: 1, code: 1 }, (err, mobile_country_codes) => {
		res.send(mobile_country_codes);
	})
};

exports.checkEmailExist = function (req, res) {
	console.log('call checkEmailExist');
	if (req.body.type == 'email' && req.body.mobile_country_code && req.body.phone_number) {

		let email = req.body.email ? req.body.email.trim() : req.body.emailFack

		let regexEmail = new RegExp(['^', email, '$'].join(''), 'i');
		let columnAndValues = { email: regexEmail };

		if (req.body.mobile_country_code && req.body.phone_number) {
			columnAndValues = { $or: [{ email: regexEmail }, { mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number }] };
		}

		User.findOne(columnAndValues, { _id: 0, user_id: 1, first_name: 1, email: 1, is_verify_mobile: 1, mobile_country_code: 1, phone_number: 1 }, (err, response) => {
			if (response) {
				if (response.mobile_country_code == req.body.mobile_country_code && response.phone_number == req.body.phone_number) {
					if (!response.is_verify_mobile) {
						Sms_template.findOne({ code: 'VERIFY_MOBILE_NO' }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
							if (sms) {
								let otp = parseInt(Math.random() * (999999 - 111111) + 111111);
								let caption = (sms['value'][req.session.language || config.default_language_code]);
								caption = caption.replace("#OTP#", otp).replace("#NAME#", response.first_name);
								smsManager.sendSMS({ message: caption, mobile: (req.body.mobile_country_code + req.body.phone_number) });

								User.update({ mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number }, { $set: { otp } }, (err, update_response) => {
									res.send({ code: 410, message: '', user_info: response });
								})
							} else {
								res.send({ code: 409, message: `${labels['LBL_TEMPLATE_NOT_EXIST'][(req.session.language || 'PT')]}` });
							}
						})
					} else {
						res.send({ code: 409, message: `${labels['LBL_PHONE_NO_EXIST'][(req.session.language || 'PT')]}` });
					}
				} else {
					res.send({ code: 409, message: `${labels['LBL_EMAIL_ID_EXIST'][(req.session.language || 'PT')]}` });
				}
			} else {
				res.send({ code: 200, message: '' });
			}
		})
	} else if ((req.body.type == 'google' || req.body.type == 'facebook') && req.body.social_id) {
		let columnAndValues = { social_id: req.body.social_id };

		if (req.body.email) {
			let email = req.body.email.trim();
			let regexEmail = new RegExp(['^', email, '$'].join(''), 'i');

			columnAndValues = { $or: [{ email: regexEmail }, { social_id: req.body.social_id }] };
		}

		console.log(columnAndValues);
		User.findOne(columnAndValues, { _id: 0, user_id: 1, first_name: 1, last_name: 1, user_type: 1, password: 1, status: 1 }, (err, response) => {
			if (response) {
				if (response.status == 'inactive') {
					res.send({ code: 406, message: `${labels['LBL_YOUR_ACCOUNT_INACTIVE'][(req.session.language || 'PT')]}` });
					return false;
				} else {
					req.session.user_id = response.user_id;
					req.session.name = response.first_name;
					req.session.user_type = response.user_type;
					req.session.login_type = req.body.type;
					res.send({ code: 409, message: '', user_type: response.user_type });
					return false;
				}
			} else {
				console.log(req.body);
				let nameArr = req.body.name ? req.body.name.trim().split(' ') : [];
				let userObject = {
					social_id: req.body.social_id,
					register_type: req.body.type,
					first_name: ((nameArr.length > 0) ? nameArr[0] : ''),
					last_name: ((nameArr.length > 1) ? nameArr[1] : ''),
					email: req.body.email,
					is_verify_mobile: true,
					user_type: req.body.user_type
				}

				let userObj = new User(userObject);
				userObj.save((err, response) => {
					if (req.body.email) {
						let template_code = "COMPRADOR_SIGN_UP";
						if (req.body.user_type == 'producers') {
							template_code = "PRODUCER_SIGN_UP";
						} else if (req.body.user_type == 'aggregators') {
							template_code = "AGGREGATOR_SIGN_UP";
						} else if (req.body.user_type == 'transporters') {
							template_code = "TRANSPORTER_SIGN_UP";
						}

						emailController.send({ language: (req.session.language || config.default_language_code), code: template_code, name: ((nameArr.length > 0) ? nameArr[0] : ''), email: req.body.email, password: '' });
					}

					Push_template.findOne({ code: 'SIGN_UP' }, { _id: 0, caption_value: 1, value: 1 }, (err, pushTemplate) => {
						console.log(err);
						console.log(pushTemplate);
						if (pushTemplate) {
							let notLogObj = new Notification_log({
								user_type: req.body.user_type,
								user_id: response.user_id,
								title: pushTemplate.caption_value,
								description: pushTemplate.value
							});

							notLogObj.save((err, responseLog) => {
								console.log(err);
								console.log(responseLog);
							})
						}

						req.session.user_id = response.user_id;
						req.session.name = ((nameArr.length > 0) ? nameArr[0] : '');
						req.session.user_type = req.body.user_type;
						req.session.login_type = req.body.type;

						res.send({ code: 200, message: '', user_type: response.user_type });
						return false;
					})
				})
			}
		})
	} else {
		res.send({ code: 400, message: `${labels['LBL_PARAMETER_MISSING'][(req.session.language || 'PT')]}` });
		return false;
	}
};

exports.sendOTP = function (req, res) {
	console.log(req.body);
	if (req.body.mobile_country_code && req.body.phone_number) {
		User.findOne({ mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number }, { _id: 0, user_id: 1, first_name: 1, user_type: 1, mobile_country_code: 1, phone_number: 1 }, (err, response) => {
			if (!response) {
				res.send({ code: 404, message: `${labels['LBL_OTP_SENT_FAILURE'][(req.session.language || config.default_language_code)]}` });
			} else {
				Sms_template.findOne({ code: 'VERIFY_MOBILE_NO' }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
					if (sms) {
						let otp = parseInt(Math.random() * (999999 - 111111) + 111111);
						let caption = (sms['value'][req.session.language || config.default_language_code]);
						caption = caption.replace("#OTP#", otp).replace("#NAME#", response.first_name);
						smsManager.sendSMS({ message: caption, mobile: (response.mobile_country_code + response.phone_number) });

						User.update({ mobile_country_code: response.mobile_country_code, phone_number: response.phone_number }, { $set: { otp } }, (err, update_response) => {
							res.send({ code: 200, message: `${labels['LBL_OTP_SENT_SUCCESSFULLY'][(req.session.language || config.default_language_code)]}` });
						})
					} else {
						res.send({ code: 409, message: `${labels['LBL_OTP_SENT_FAILURE'][(req.session.language || config.default_language_code)]}` });
					}
				})
			}
		})
	} else {
		res.send({ code: 404, message: `${labels['LBL_OTP_SENT_FAILURE'][(req.session.language || config.default_language_code)]}` });
	}
};

exports.verifyOTP = function (req, res) {
	if (req.query.mobile_country_code && req.query.phone_number) {
		let mobile_country_code = req.query.mobile_country_code;
		if (!mobile_country_code.includes("+")) {
			mobile_country_code = "+" + mobile_country_code.trim();
		}

		res.render('verify-otp', {
			mobile_country_code,
			phone_number: req.query.phone_number,
			labels,
			language: req.session.language || config.default_language_code,
			layout: false,
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	} else {
		res.redirect('/');
	}
};

exports.submitVerifyOTP = function (req, res) {
	if (req.body.mobile_country_code && req.body.phone_number && req.body.otp) {
		req.body.mobile_country_code = req.body.mobile_country_code.trim();

		if (!req.body.mobile_country_code.includes("+")) {
			req.body.mobile_country_code = '+' + req.body.mobile_country_code;
		}

		User.findOne({ mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number, otp: parseInt(req.body.otp) }, { _id: 0, user_id: 1, first_name: 1, email: 1, user_type: 1 }, (err, user_info) => {
			if (user_info) {
				let template_code = "COMPRADOR_SIGN_UP";
				if (user_info.user_type == 'producers') {
					template_code = "PRODUCER_SIGN_UP";
				} else if (user_info.user_type == 'aggregators') {
					template_code = "AGGREGATOR_SIGN_UP";
				} else if (user_info.user_type == 'transporters') {
					template_code = "TRANSPORTER_SIGN_UP";
				}

				emailController.send({ code: template_code, name: user_info.first_name, email: user_info.email, language: (req.session.language || config.default_language_code) });

				Push_template.findOne({ code: 'SIGN_UP' }, { _id: 0, caption_value: 1, value: 1 }, (err, pushTemplate) => {
					console.log(err);
					console.log(pushTemplate);
					if (pushTemplate) {
						let notLogObj = new Notification_log({
							user_type: user_info.user_type,
							user_id: user_info.user_id,
							title: pushTemplate.caption_value,
							description: pushTemplate.value
						});

						notLogObj.save((err, responseLog) => { })
					}

					User.update({ mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number }, { $set: { otp: 0, is_verify_mobile: true } }, (err, update_response) => {
						res.send({ code: 200, message: '' });
					})
				})
			} else {
				res.send({ code: 402, message: `${labels['LBL_INVALID_OTP'][(req.session.language || 'PT')]}` });
			}
		})
	} else {
		res.send({ code: 400, message: `${labels['LBL_PARAMETER_MISSING'][(req.session.language || 'PT')]}` });
	}
};

const odoo_register = (url, params) => {
	axios.post(url, params)
		.then(function (response) {

		})
		.catch(function (error) {
			console.log(error);
		});
}

exports.signUp = function (req, res) {
	if (req.body.first_name && req.body.last_name && req.body.province && req.body.city && req.body.mobile_country_code && req.body.phone_number && req.body.password && req.body.users && req.body.type) {
		passwordHandler.encrypt(req.body.password.toString(), (encPin) => {
			let userObject = {
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				email: req.body.email.toLowerCase() || req.body.emailFack.toLowerCase(),
				type: req.body.type,
				company_name: req.body.company_name || '',
				password: encPin,
				state_id: req.body.province,
				city_id: req.body.city,
				mobile_country_code: req.body.mobile_country_code,
				phone_number: req.body.phone_number,
				user_type: req.body.users
			}

			City.find({ city_id: req.body.city }, { _id: 0, city_id: 1, name: 1 }, (err, cities) => {

				State.find({ state_id: req.body.province }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
					var cite = [], state = [];

					cities.forEach((item, value) => {
						cite.push({ name: item.name })
					})

					states.forEach((item, value) => {
						state.push({ name: item.name })
					})

					// odoo_register('http://localhost:5000/client/',  
					// {
					// 	name: req.body.first_name,
					// 	email: req.body.email,
					// 	city: cite[0].name,
					// 	phone: req.body.phone_number,

					// })


				});

			});



			let userObj = new User(userObject);
			userObj.save((err, response) => {
				Sms_template.findOne({ code: 'VERIFY_MOBILE_NO' }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
					if (sms) {
						let otp = parseInt(Math.random() * (999999 - 111111) + 111111);
						let caption = (sms['value'][req.session.language || 'PT']);
						caption = caption.replace("#OTP#", otp).replace("#NAME#", req.body.first_name);
						smsManager.sendSMS({ message: caption, mobile: (req.body.mobile_country_code + req.body.phone_number) });

						User.update({ mobile_country_code: req.body.mobile_country_code, phone_number: req.body.phone_number }, { $set: { otp } }, (err, update_response) => {
							return res.redirect("/verify-otp?mobile_country_code=" + req.body.mobile_country_code + '&phone_number=' + req.body.phone_number);
						})
					} else {
						return res.redirect('/');
					}
				})
			});
		})
	} else {
		MobileCountryCode.find({}, { _id: 0, mobile_country_code_id: 1, code: 1 }, (err, mobile_country_codes) => {
			CMS.findOne({ code: 'TERMS_AND_CONDITIONS', user_type: 'producers' }, { _id: 0, cms_id: 1, title: 1, code: 1, description: 1 }, (err, cms_pages) => {
				let tc_title = (cms_pages) ? cms_pages['title'][req.session.language || 'PT'] : '';
				let tc_description = (cms_pages) ? cms_pages['description'][req.session.language || 'PT'] : '';

				State.find({ status: 'active' }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
					states = _.sortBy(states, function (item) { return item.name; })

					res.render('sign-up', {
						labels,
						language: req.session.language || config.default_language_code,
						states,
						mobile_country_codes,
						layout: false,
						tc_title,
						tc_description,
						messages: req.flash('error') || req.flash('info'),
						messages: req.flash('info'),
					});
				})
			})
		})
	}
};

exports.getState = (req, res) => {
	State.find({ status: 'active' }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
		states = _.sortBy(states, function (item) { return item.name; })
		res.send(states)
	});
}

exports.getCity = (req, res) => {
	City.find({ status: 'active', state_id: req.body.state_id }, { _id: 0, state_id: 1, city_id: 1, name: 1 }, (err, cities) => {
		cities = _.sortBy(cities, function (item) { return item.name; })
		res.send(cities)
	});
}

exports.clearNotifications = (req, res) => {
	Notification_log.remove({ user_id: req.session.user_id }, (err, log) => {
		res.send({ code: 200 })
	});
}


exports.deleteNotifiy = function (req, res) {
	console.log(req.params.id)
	Notification_log.remove({ user_id: req.session.user_id }, { notification_log_id: req.params.id }, (err, logs) => {
		logs = JSON.parse(JSON.stringify(logs));
		console.log(logs)
		res.send({ code: 200 })

	})
};


exports.getKepyaIndex = async function (req, res) {

console.log(req.params.dateTo)
	
	try{
	date = req.params.dateTo ? req.params.dateTo : '2021-04-13';
	var currentTime = moment(date).format("YYYY-MM-DD");

	var response = await axios.get("http://186.192.168.122:4000/api/v1/trace/mercado/30/start/"+ currentTime)

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
		labels,
		breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_KEPYA_INDEX'][(req.session.language || config.default_language_code)] + "</li>",
		language: req.session.language || config.default_language_code,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')
	});

	
};

exports.faqs = function (req, res) {
	res.render('faqs', {
		labels,
		language: req.session.language || config.default_language_code,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')
	});
};

exports.faqsprodutor = function (req, res) {
	res.render('faqs-produtor', {
		labels,
		language: req.session.language || config.default_language_code,
		layout: false,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')
	});
};