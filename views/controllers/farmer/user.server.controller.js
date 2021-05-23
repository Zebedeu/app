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

exports.profile = function (req, res) {
	if (req.session.login_type == 'email') {
		Farmer.aggregate([
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
					farmer_id: req.session.user_id
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
				return res.redirect(config.base_url + 'farmer/dashboard');
			}

			let userInfo = response[0];
			userInfo['photo'] = ((response.photo) ? config.aws.prefix + config.aws.s3.userBucket + '/' + response.photo : '../../../images/placeholder.jpg');
			userInfo['user_type'] = labels['LBL_SIGN_UP_USER_AGGREGATORS'][req.session.language];
			passwordHandler.decrypt(userInfo.password, (decPin) => {
				userInfo.password = (userInfo.password ? decPin : '');
				userInfo.display_password = userInfo.password.replace(/./g, "*");

				res.render('farmer/user/profile', {
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
					breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "farmer/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LOGIN_SECURITY'][(req.session.language || config.default_language_code)] + "</li>",
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),
				});
			})
		})
	} else {
		Farmer.findOne({ farmer_id: req.session.user_id }, { _id: 0 }, (err, response) => {
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
						res.render('farmer/user/profile', {
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
							breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "farmer/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LOGIN_SECURITY'][(req.session.language || config.default_language_code)] + "</li>",
							messages: req.flash('error') || req.flash('info'),
							messages: req.flash('info'),
						});
					})
				})
			})
		})
	}
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
							//return res.redirect('list');
							return res.send({ farmer_id: req.body.farmer_id })
						})
					});
				});
			});
		} else {
			Farmer.update({ farmer_id: req.body.farmer_id }, columnAndValues, function (err, response) {
				//return res.redirect('list');
				return res.send({ farmer_id: req.body.farmer_id })

			})
		}
	})
};

exports.getUser = function (req, res) {

	Farmer.findOne({ farmer_id: req.session.user_id }, { _id: 0 }, (err, response) => {
		response = JSON.parse(JSON.stringify(response));
		User.findOne({ user_id: response.user_id }, { _id: 0 }, (err, user) => {
			user = JSON.parse(JSON.stringify(user));
            res.send({user_id: user.user_id, nome: user.first_name + '' + user.last_name});
		})
	})
};
