let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let User = require('mongoose').model('User');
let passwordHandler = require('../../utils/password-handler');
let labels = require('../../utils/labels.json');

exports.list = function(req, res) {
	res.render('compradors/user/list', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || 'PT',
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};

exports.add = function(req, res) {
	res.render('compradors/user/add', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || 'PT',
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};

exports.profile = function(req, res){
	if(req.session.login_type == 'email'){
		req.session
		User.aggregate([
		    {
		    	$lookup:
		       	{
		         	from: 'states',
		         	localField: 'state_id',
		         	foreignField: 'state_id',
		         	as: 'stateDetails'
		       	}
		    }, {
		    	"$unwind": "$stateDetails"
		    }, {
		    	$lookup:
		       	{
		         	from: 'cities',
		         	localField: 'city_id',
		         	foreignField: 'city_id',
		         	as: 'cityDetails'
		       	}
		    }, {
		    	"$unwind": "$cityDetails"
		    }, {
	            $match: {
	                user_id: req.session.user_id
	            },
	        }, {
		    	"$project": {
		    		_id: 0,
	                user_id: "$user_id",
	                user_type: "$user_type",
	                first_name: "$first_name",
	                last_name: "$last_name",
	                email: "$email",
	                mobile_country_code: "$mobile_country_code",
	                phone_number: "$phone_number",
	                state_id: "$state_id",
	                city_id: "$city_id",
	                type: "$type",
	                company_name: "$company_name",
	                password: "$password",
	                bank_name: "$bank_name",
	                bank_account_no: "$bank_account_no",
	                nif: "$nif",
	                address: "$address",
	                gps_location: "$gps_location",
	                status: "$status",
	                state_name: "$stateDetails.name",
	                city_name: "$cityDetails.name"
			  	}
			}
		], (err, response) => {
			console.log(response); 
			if(response.length == 0){
				return res.redirect(config.base_url+'compradors/dashboard');
			}

			let userInfo = response[0];
			userInfo['user_type'] = labels['LBL_SIGN_UP_USER_COMPRADORS'][req.session.language];
			passwordHandler.decrypt(userInfo.password, (decPin) => {
				userInfo.password = (userInfo.password ? decPin : '');
				userInfo.display_password = userInfo.password.replace(/./g, "*");

				res.render('compradors/user/profile', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					user_info: userInfo,
					lbl_nif: (userInfo.type == 'individual') ? labels['LBL_COMPRADOR_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_COMPRADOR_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_COMPRADOR_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_COMPRADOR_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					labels,
					language: req.session.language || 'PT',
					google_api_key: config.googleAPIKey,
					breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'PT')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LOGIN_AND_SECURITY'][(req.session.language || 'PT')]+"</li>",
					messages : req.flash('error') || req.flash('info'),
					messages : req.flash('info'),
				});
			})
		})
	} else {
		User.findOne({ user_id: req.session.user_id }, { _id: 0 }, (err, response) => {
			let userInfo = response;
			State.findOne({ state_id: userInfo['state_id'] }, { _id: 0, name: 1 }, (err, stateInfo) => {
				City.findOne({ city_id: userInfo['city_id'] }, { _id: 0, name: 1 }, (err, cityInfo) => {
					userInfo['state_name'] = stateInfo ? stateInfo['name'] : '';
					userInfo['city_name'] = cityInfo ? cityInfo['name'] : '';
					userInfo['user_type'] = labels['LBL_SIGN_UP_USER_COMPRADORS'][req.session.language];
					passwordHandler.decrypt(userInfo.password, (decPin) => {
						userInfo.password = (userInfo.password ? decPin : '');
						userInfo.display_password = userInfo.password.replace(/./g, "*");

						res.render('compradors/user/profile', {
							user: {
								user_id: req.session.user_id,
								name: req.session.name,
								user_type: req.session.user_type,
								login_type: req.session.login_type
							},
							user_info: userInfo,
							lbl_nif: (userInfo.type == 'individual') ? labels['LBL_COMPRADOR_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_COMPRADOR_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_COMPRADOR_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_COMPRADOR_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							labels,
							language: req.session.language || 'PT',
							google_api_key: config.googleAPIKey,
							breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'PT')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LOGIN_AND_SECURITY'][(req.session.language || 'PT')]+"</li>",
							messages : req.flash('error') || req.flash('info'),
							messages : req.flash('info'),
						});
					})
				})
			})	
		})
	}
};

exports.address = function(req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, email: 1, addresses: 1 }, (err, response) => {
		res.render('compradors/user/address', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			addresses: (response.addresses.length > 0) ? response.addresses.reverse() : [],
			total_cart_products: 0,
			labels,
			language: req.session.language || 'PT',
			breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'PT')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_YOUR_ADDRESSES'][(req.session.language || 'PT')]+"</li>",
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	});
};