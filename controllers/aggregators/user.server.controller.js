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
let logger = require('../../utils/logger');
let s3Handler = require('../../utils/s3-handler');
s3Handler = new s3Handler();
let labels = require('../../utils/labels.json');
let imagemagick = require('imagemagick');
let path = require('path');
let fs = require('fs');
let Product = require('mongoose').model('Product');

exports.list = function (req, res) {
	Farmer.find({ user_id: req.session.user_id }, { _id: 0, created_at: 0, updated_at: 0 }, (err, farmers) => {
		farmers = JSON.parse(JSON.stringify(farmers));
		_.each(farmers, (element, index, list) => {
			farmers[index]['photo'] = ((element.photo) ? config.aws.prefix + config.aws.s3.userBucket + '/' + element.photo : '../../../images/placeholder.jpg');
		})

		console.log(farmers)

		res.render('aggregators/user/list', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			farmers,
			labels,
			language: req.session.language || config.default_language_code,
			breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_FARMER_LIST'][(req.session.language || config.default_language_code)] + "</li>",
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	}).sort({ created_at: -1 })
};

exports.add = function (req, res) {
	if (req.body.first_name && req.body.last_name && req.body.email_id && req.body.address && req.body.state_id && req.body.city_id && req.body.bank_name && req.body.bank_account_no && req.body.nif) {
		let columnAndValues = {
			user_id: req.session.user_id,
			user_type: req.session.user_type,
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email_id,
			mobile_country_code: (req.body.mobile_country_code && req.body.phone_number) ? req.body.mobile_country_code : '',
			phone_number: (req.body.mobile_country_code && req.body.phone_number) ? req.body.phone_number : '',
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			bank_name: req.body.bank_name,
			bank_account_no: "AO06 " + req.body.bank_account_no,
			nif: req.body.nif,
			address: req.body.address
		}

		console.log(req.bodyfiles)


		if (!_.isEmpty(req.files) && _.contains(['jpeg', 'jpg', 'png'], req.files.images.name.split('.').pop().toLowerCase())) {
			let fileObj = req.files.images;
			let filePath = path.join(__dirname, "../../../upload/") + req.files.images.name;
			let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + req.files.images.name;
			fileObj.mv(filePath, function (err) {
				if (err) {
					console.log(err);
				}

				imagemagick.crop({
					srcPath: filePath,
					dstPath: dstFilePath,
					width: 250,
					height: 250,
					quality: 1,
					gravity: "North"
				}, function (err, stdout, stderr) {
					const fileContent = fs.readFileSync(dstFilePath);
					let fileObject = {
						name: req.files.images.name,
						data: fileContent,
						encoding: req.files.images.encoding,
						mimetype: req.files.images.mimetype,
						mv: req.files.images.mv
					}

					s3Manager.uploadFileObj(fileObject, config.aws.s3.userBucket, 'user_', (error, url) => {
						if (error) {
							logger('Error: upload photo from aws s3 bucket. ' + error);
							done(errors.internalServer(true), null);
							return;
						}

						fs.unlinkSync(filePath);
						fs.unlinkSync(dstFilePath);
						console.log("url", url);
						columnAndValues['photo'] = [url.substring(url.lastIndexOf('/') + 1)];
						let farmerObj = new Farmer(columnAndValues);
						farmerObj.save((err, response) => {
							res.send({id:  response.farmer_id});
							return res.redirect('list');
						})
					});
				});
			});

		} else {
			let farmerObj = new Farmer(columnAndValues);
			farmerObj.save((err, response) => {
				console.log(err);
				//return res.send({id:  response.farmer_id});
				return res.redirect('list');
			})
		}
	} else {
		res.render('aggregators/user/add', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			labels,
			language: req.session.language || config.default_language_code,
			breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/user/list'>" + labels['LBL_FARMER_LIST'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_ADD_FARMER'][(req.session.language || config.default_language_code)] + "</li>",
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	}
};

exports.profile = function (req, res) {
	if (req.session.login_type == 'email') {
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
					city_longitude: "$cityDetails.longitude",
					doc: "$doc"
				}
			}
		], (err, response) => {
			if (response.length == 0) {
				return res.redirect(config.base_url + 'aggregators/dashboard');
			}

			let userInfo = response[0];
			userInfo['photo'] = ((response.photo) ? config.aws.prefix + config.aws.s3.userBucket + '/' + response.photo : '../../../images/placeholder.jpg');
			userInfo['user_type'] = labels['LBL_SIGN_UP_USER_AGGREGATORS'][req.session.language];
			passwordHandler.decrypt(userInfo.password, (decPin) => {
				userInfo.password = (userInfo.password ? decPin : '');
				userInfo.display_password = userInfo.password.replace(/./g, "*");

				res.render('aggregators/user/profile', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					user_info: userInfo,
					lbl_nif: (userInfo.type == 'individual') ? labels['LBL_AGGREGATOR_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_AGGREGATOR_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_AGGREGATOR_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_AGGREGATOR_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
					labels,
					language: req.session.language || config.default_language_code,
					google_api_key: config.googleAPIKey,
					breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LOGIN_SECURITY'][(req.session.language || config.default_language_code)] + "</li>",
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),
				});
			})
		})
	} else {
		User.findOne({ user_id: req.session.user_id }, { _id: 0 }, (err, response) => {
			let userInfo = response;
			State.findOne({ state_id: userInfo['state_id'] }, { _id: 0, name: 1 }, (err, stateInfo) => {
				City.findOne({ city_id: userInfo['city_id'] }, { _id: 0, name: 1, latitude: 1, longitude: 1 }, (err, cityInfo) => {
					userInfo['user_type'] = labels['LBL_SIGN_UP_USER_AGGREGATORS'][req.session.language];
					userInfo['state_name'] = stateInfo ? stateInfo['name'] : '';
					userInfo['city_name'] = cityInfo ? cityInfo['name'] : '';
					userInfo['city_latitude'] = cityInfo ? cityInfo['latitude'] : 0;
					userInfo['city_longitude'] = cityInfo ? cityInfo['longitude'] : 0;
					passwordHandler.decrypt(userInfo.password, (decPin) => {
						userInfo.password = (userInfo.password ? decPin : '');
						userInfo.display_password = userInfo.password.replace(/./g, "*");
						res.render('aggregators/user/profile', {
							user: {
								user_id: req.session.user_id,
								name: req.session.name,
								user_type: req.session.user_type,
								login_type: req.session.login_type
							},
							user_info: userInfo,
							lbl_nif: (userInfo.type == 'individual') ? labels['LBL_AGGREGATOR_LOGIN_SECURITY_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_AGGREGATOR_LOGIN_SECURITY_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							lbl_validate_nif: (userInfo.type == 'individual') ? labels['LBL_AGGREGATOR_LOGIN_SECURITY_VALIDATE_NIF'][(req.session.language || config.default_language_code)] : labels['LBL_AGGREGATOR_LOGIN_SECURITY_VALIDATE_COMPANY_NIF'][(req.session.language || config.default_language_code)],
							labels,
							language: req.session.language || config.default_language_code,
							google_api_key: config.googleAPIKey,
							breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LOGIN_SECURITY'][(req.session.language || config.default_language_code)] + "</li>",
							messages: req.flash('error') || req.flash('info'),
							messages: req.flash('info'),
						});
					})
				})
			})
		})
	}
};

exports.address = function (req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, email: 1, addresses: 1 }, (err, response) => {
		res.render('aggregators/user/address', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			addresses: (response.addresses.length > 0) ? response.addresses.reverse() : [],
			labels,
			language: req.session.language || config.default_language_code,
			breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_YOUR_ADDRESSES'][(req.session.language || config.default_language_code)] + "</li>",
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	});
};

exports.edit = function (req, res) {
	Farmer.findOne({ farmer_id: req.body.farmer_id }, { _id: 0 }, (err, singleFarmer) => {
		if (!singleFarmer) {
			return res.redirect('list');
		}

		let columnAndValues = {
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			bank_name: req.body.bank_name,
			bank_account_no: req.body.bank_account_no,
			nif: req.body.nif,
			address: req.body.address
		}

		if (req.body.mobile_country_code && req.body.phone_number) {
			columnAndValues['mobile_country_code'] = req.body.mobile_country_code;
			columnAndValues['phone_number'] = req.body.phone_number;
		}

		if (!_.isEmpty(req.files) && _.contains(['jpeg', 'jpg', 'png'], req.files.images.name.split('.').pop().toLowerCase())) {
			if (singleFarmer.photo) {
				s3Manager.removeFileObj(singleFarmer.photo, config.aws.s3.userBucket, (error, response) => { });
			}
			let fileObj = req.files.images;
			let filePath = path.join(__dirname, "../../../upload/") + req.files.images.name;
			let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + req.files.images.name;
			fileObj.mv(filePath, function (err) {
				if (err) {
					console.log(err);
				}

				imagemagick.crop({
					srcPath: filePath,
					dstPath: dstFilePath,
					width: 250,
					height: 250,
					quality: 1,
					gravity: "North"
				}, function (err, stdout, stderr) {
					const fileContent = fs.readFileSync(dstFilePath);
					let fileObject = {
						name: req.files.images.name,
						data: fileContent,
						encoding: req.files.images.encoding,
						mimetype: req.files.images.mimetype,
						mv: req.files.images.mv
					}

					s3Manager.uploadFileObj(fileObject, config.aws.s3.userBucket, 'user_', (error, url) => {
						if (error) {
							logger('Error: upload photo from aws s3 bucket. ' + error);
							done(errors.internalServer(true), null);
							return;
						}

						fs.unlinkSync(filePath);
						fs.unlinkSync(dstFilePath);
						console.log("url", url)
						columnAndValues['photo'] = [url.substring(url.lastIndexOf('/') + 1)];
						Farmer.update({ farmer_id: req.body.farmer_id }, columnAndValues, function (err, response) {
							return res.redirect('list');
						})
					});
				});
			});
		} else {
			Farmer.update({ farmer_id: req.body.farmer_id }, columnAndValues, function (err, response) {
				return res.redirect('list');
			})
		}
	})
};

/*exports.remove = function (req, res) {
	Farmer.findOne({ farmer_id: req.params.id }, { _id: 0, farmer_id: 1, photo: 1 }, (err, singleFarmer) => {
		if (!singleFarmer) {
			return res.redirect('list');
		}

		if (singleFarmer.photo) {
			let fileArr = [];
			fileArr.push({ Key: 'users/' + /[^/]*$/.exec(singleFarmer.photo)[0] })
			s3Handler.deleteMultipleFiles(fileArr, config.aws.bucketName, (error, res) => { });
		}

		Farmer.remove({ farmer_id: req.params.id }, (err, response) => {
			return res.redirect(config.base_url + 'aggregators/user/list');
		})
	})
};*/

exports.remove = function (req, res) {


	Product.find({ producer_id: req.params.id }, (err, prod) => {
		if (prod.length > 0) {
			res.end('0');
		} else if (prod.length == 0) {
			Farmer.findOne({ farmer_id: req.params.id }, { _id: 0, farmer_id: 1, photo: 1 }, (err, singleFarmer) => {
				if (!singleFarmer) {
					return res.redirect('list');
				}
				if (singleFarmer.photo) {
					let fileArr = [];
					fileArr.push({ Key: 'users/' + /[^/]*$/.exec(singleFarmer.photo)[0] })
					s3Handler.deleteMultipleFiles(fileArr, config.aws.bucketName, (error, res) => { });
				}
				Farmer.remove({ farmer_id: req.params.id }, (err, response) => {
					//return res.redirect(config.base_url + 'aggregators/user/list');
					return res.end('1');
				})
			})
		}
	});
};

exports.display = function (req, res) {
	if (req.params.id) {
		Farmer.findOne({ farmer_id: req.params.id }, { _id: 0, status: 0, created_at: 0, updated_at: 0 }, (err, response) => {
			if (!response) {
				return res.redirect('list');
			}

			response = JSON.parse(JSON.stringify(response));
			response['photo'] = ((response.photo) ? config.aws.prefix + config.aws.s3.userBucket + '/' + response.photo : '');
			res.render('aggregators/user/edit', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				farmer: response,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item'><a href='" + config.base_url + "aggregators/user/list'>" + labels['LBL_FARMER_LIST'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['EDIT_FARMER'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		})
	} else {
		return res.redirect('list');
	}
};