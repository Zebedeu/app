let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let User = require('mongoose').model('User');
let Farmer = require('mongoose').model('Farmer');
let State = require('mongoose').model('State');
let City = require('mongoose').model('City');
let passwordHandler = require('../../utils/password-handler');
let s3Manager = require('../../utils/s3-manager');
let s3Handler = require('../../utils/s3-handler');
s3Handler = new s3Handler();
let labels = require('../../utils/labels.json');

exports.list = function(req, res) {
	Farmer.find({ user_id: req.session.user_id }, { _id: 0, created_at: 0, updated_at: 0 }, (err, farmers) => {
		farmers = JSON.parse(JSON.stringify(farmers));
		_.each(farmers, (element, index, list) => {
            farmers[index]['photo'] = ((element.photo) ? config.aws.prefix+config.aws.s3.userBucket+'/'+element.photo : '../../../images/placeholder.jpg');  
        })

		res.render('producers/user/list', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			farmers,
			labels,
			language: req.session.language || 'EN',
			breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_USERS_LIST'][(req.session.language || 'EN')]+"</li>",
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	})
};

exports.edit = function(req, res) {
	Farmer.findOne({ farmer_id: req.body.farmer_id }, { _id: 0 }, (err, singleFarmer) => {
		if(!singleFarmer){
			return res.redirect('list');
		}

		let columnAndValues = {
			name: req.body.name,
			phone_number: req.body.phone_number,
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			address: req.body.address
		}

		if(!_.isEmpty(req.files)){
			if(singleFarmer.photo){
				s3Manager.removeFileObj(singleFarmer.photo, config.aws.s3.userBucket, (error, response) => {});
			}
		
			s3Manager.uploadFileObj(req.files.images, config.aws.s3.userBucket, 'user_', (error, url) => {
				if (error) {
		          logger('Error: upload photo from aws s3 bucket. ' + error);
		          done(errors.internalServer(true), null);
		          return;
		        }

		        columnAndValues['photo'] = [url.substring(url.lastIndexOf('/') + 1)];
		        Farmer.update({ farmer_id: req.body.farmer_id }, columnAndValues, function(err, response) {
					return res.redirect('list');
				})
		    });
		} else {
			Farmer.update({ farmer_id: req.body.farmer_id }, columnAndValues, function(err, response) {
				return res.redirect('list');
			})
		}
	})
};

exports.remove = function(req, res) {
	Farmer.findOne({ farmer_id: req.params.id }, { _id: 0, farmer_id: 1, photo: 1 }, (err, singleFarmer) => {
		if(!singleFarmer){
			return res.redirect('list');
		}

		if(singleFarmer.photo){
			let fileArr = [];
			fileArr.push({ Key: 'users/'+/[^/]*$/.exec(singleFarmer.photo)[0] })
			s3Handler.deleteMultipleFiles(fileArr, config.aws.bucketName, (error, res) => {});	
		}

		Farmer.remove({ farmer_id: req.params.id }, (err, response) => {
			return res.redirect(config.base_url+'producers/user/list');
		})
	})
};

exports.display = function(req, res) {
	if(req.params.id) {
		Farmer.findOne({ farmer_id: req.params.id }, { _id: 0, status: 0, created_at: 0, updated_at: 0 }, (err, response) => {
			if(!response){
				return res.redirect('list');
			}

			response = JSON.parse(JSON.stringify(response));
			response['photo'] = ((response.photo) ? config.aws.prefix+config.aws.s3.userBucket+'/'+response.photo : '');  
			console.log(response);
			State.find({ status: 'active' }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
				City.find({ state_id: response.state_id }, { _id: 0, city_id: 1, name: 1 }, (err, cities) => {
					res.render('producers/user/edit', {
						user: {
							user_id: req.session.user_id,
							name: req.session.name,
							user_type: req.session.user_type,
							login_type: req.session.login_type
						},
						states,
						cities,
						farmer: response,
						labels,
						language: req.session.language || 'EN',
						breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item'><a href='"+config.base_url+"producers/user/list'>"+labels['LBL_USERS_LIST'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_EDIT_USER'][(req.session.language || 'EN')]+"</li>",
						messages : req.flash('error') || req.flash('info'),
						messages : req.flash('info'),
					});
				})
			})
		})
	} else {
		return res.redirect('list');
	}
};

exports.add = function(req, res) {
	if(req.body.name && req.body.email && req.body.phone_number && req.body.address && req.body.state_id && req.body.city_id){
		console.log(req.body);
		console.log(req.files);

		let columnAndValues = {
			user_id: req.session.user_id,
			user_type: req.session.user_type,
			name: req.body.name,
			email: req.body.email,
			phone_number: req.body.phone_number,
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			address: req.body.address
		}

		if(!_.isEmpty(req.files)){
			s3Manager.uploadFileObj(req.files.images, config.aws.s3.userBucket, 'user_', (error, url) => {
				if (error) {
		          logger('Error: upload photo from aws s3 bucket. ' + error);
		          done(errors.internalServer(true), null);
		          return;
		        }

		        columnAndValues['photo'] = [url.substring(url.lastIndexOf('/') + 1)];
		        let farmerObj = new Farmer(columnAndValues);
				farmerObj.save((err, response) => {
					return res.redirect('list');
				})
		    });
		} else {
			let farmerObj = new Farmer(columnAndValues);
			farmerObj.save((err, response) => {
				console.log(err);
				return res.redirect('list');
			})
		}
	} else {
		State.find({ status: 'active' }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
			res.render('producers/user/add', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				states,
				labels,
				language: req.session.language || 'EN',
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item'><a href='"+config.base_url+"producers/user/list'>"+labels['LBL_USERS_LIST'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_ADD_NEW_USER'][(req.session.language || 'EN')]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		});
	}
};

exports.profile = function(req, res) {
	if(req.session.login_type == 'email'){
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
	                city_name: "$cityDetails.name",
	                city_latitude: "$cityDetails.latitude",
	                city_longitude: "$cityDetails.longitude"
			  	}
			}
		], (err, response) => {
			if(response.length == 0){
				return res.redirect(config.base_url+'producers/dashboard');
			}

			let userInfo = response[0];
			userInfo['user_type'] = labels['LBL_SIGN_UP_USER_PRODUCERS'][req.session.language];
			passwordHandler.decrypt(userInfo.password, (decPin) => {
				userInfo.password = (userInfo.password ? decPin : '');
				userInfo.display_password = userInfo.password.replace(/./g, "*");
				res.render('producers/user/profile', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					user_info: userInfo,
					lbl_nif: (userInfo.type == 'individual') ? labels['LBL_PRODUCER_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_PRODUCER_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_PRODUCER_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_PRODUCER_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					labels,
					language: req.session.language || 'EN',
					google_api_key: config.googleAPIKey,
					breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LOGIN_SECURITY'][(req.session.language || 'EN')]+"</li>",
					messages : req.flash('error') || req.flash('info'),
					messages : req.flash('info'),
				});
			})
		})
	} else {
		User.findOne({ user_id: req.session.user_id }, { _id: 0 }, (err, response) => {
			let userInfo = response;
			State.findOne({ state_id: userInfo['state_id'] }, { _id: 0, name: 1 }, (err, stateInfo) => {
				City.findOne({ city_id: userInfo['city_id'] }, { _id: 0, name: 1, latitude: 1, longitude: 1 }, (err, cityInfo) => {
					userInfo['user_type'] = labels['LBL_SIGN_UP_USER_PRODUCERS'][req.session.language];
					userInfo['state_name'] = stateInfo ? stateInfo['name'] : '';
					userInfo['city_name'] = cityInfo ? cityInfo['name'] : '';
					userInfo['city_latitude'] = cityInfo ? cityInfo['latitude'] : 0;
					userInfo['city_longitude'] = cityInfo ? cityInfo['longitude'] : 0;
					passwordHandler.decrypt(userInfo.password, (decPin) => {
						userInfo.password = (userInfo.password ? decPin : '');
						userInfo.display_password = userInfo.password.replace(/./g, "*");
						res.render('producers/user/profile', {
							user: {
								user_id: req.session.user_id,
								name: req.session.name,
								user_type: req.session.user_type,
								login_type: req.session.login_type
							},
							user_info: userInfo,
							lbl_nif: (userInfo.type == 'individual') ? labels['LBL_PRODUCER_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_PRODUCER_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_PRODUCER_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_PRODUCER_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							labels,
							language: req.session.language || 'EN',
							google_api_key: config.googleAPIKey,
							breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LOGIN_SECURITY'][(req.session.language || 'EN')]+"</li>",
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
		res.render('producers/user/address', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			addresses: (response.addresses.length > 0) ? response.addresses.reverse() : [],
			total_cart_products: 0,
			labels,
			language: req.session.language || 'EN',
			breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"producers/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'EN')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_YOUR_ADDRESSES'][(req.session.language || 'EN')]+"</li>",
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	});
};