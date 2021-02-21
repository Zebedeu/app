let CMS = require('mongoose').model('Cms');
let User = require('mongoose').model('User');
let Farmer = require('mongoose').model('Farmer');
let passwordHandler = require('../utils/password-handler');
let City = require('mongoose').model('City');
let Cart = require('mongoose').model('Cart');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let MobileCountryCode = require('mongoose').model('Mobile_country_code');
let Unit = require('mongoose').model('Unit');
let Size = require('mongoose').model('Size');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let s3Manager = require('../utils/s3-manager');
let labels = require('../utils/labels.json');
let { separators } = require('../utils/formatter');
const NodeGeocoder = require('node-geocoder');
let config = require('../../config/config');
const options = {
	provider: 'google',
	apiKey: config.googleAPIKey,
	formatter: null,
};
const geocoder = NodeGeocoder(options);
let { randomNo } = require('../utils/id-generator');
let _ = require('underscore');

exports.deliverAddresses = (req, res) => {
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, addresses: 1 },
		(err, profile) => {
			let addresses =
				profile && profile.addresses.length > 0
					? profile.addresses
					: [];
			let addressStr =
				"<option value=''>--- " +
				labels[
				'LBL_COMPRADOR_DEMAND_WHERE_TO_DELIVER_SELECT_ADDRESS'
				][req.session.language] +
				' ---</option>';
			_.each(addresses, (element, index, list) => {
				if (req.query.address_id == element.address_id) {
					addressStr +=
						"<option value='" +
						element.address_id +
						"' selected>" +
						element.type +
						' - ' +
						element.complete_address +
						', ' +
						element.locality +
						', ' +
						element.city_name +
						', ' +
						element.state_name +
						'</option>';
				} else {
					addressStr +=
						"<option value='" +
						element.address_id +
						"'>" +
						element.type +
						' - ' +
						element.complete_address +
						', ' +
						element.locality +
						', ' +
						element.city_name +
						', ' +
						element.state_name +
						'</option>';
				}
			});

			res.send({ response: addressStr });
		}
	);
};

exports.checkProfileStatus = (req, res) => {
	User.findOne(
		{ user_id: req.session.user_id },
		{
			_id: 0,
			first_name: 1,
			last_name: 1,
			email: 1,
			bank_name: 1,
			bank_account_no: 1,
			nif: 1,
			address: 1,
			state_id: 1,
			city_id: 1,
		},
		(err, profile) => {
			if (!profile) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
				return false;
			}

			let isProfileComplete = false,
				caption = '';
				if (req.session.user_type == 'compradors') {
					if (
						profile.first_name &&
						profile.last_name &&
						profile.email &&
						profile.bank_name &&
						profile.bank_account_no &&
						profile.nif
					) {
						isProfileComplete = true;
					} else {
						caption =
							labels[
							'LBL_COMPRADOR_DASHBOARD_PROFILE_INCOMPLETE_CAPTION'
							][req.session.language];
						caption = caption.replace(
							'#CLICK_HERE#',
							"<a href='" +
							config.base_url +
							req.session.user_type +
							'/user/profile' +
							"'>Click here</a>"
						);
						isProfileComplete = false;
					}
				} else if (req.session.user_type == 'trading') {
					if (
						profile.first_name &&
						profile.last_name &&
						profile.email &&
						profile.bank_name &&
						profile.bank_account_no &&
						profile.nif
					) {
						isProfileComplete = true;
					} else {
						caption =
							labels[
							'LBL_TRADING_DASHBOARD_PROFILE_INCOMPLETE_CAPTION'
							][req.session.language];
						caption = caption.replace(
							'#CLICK_HERE#',
							"<a href='" +
							config.base_url +
							req.session.user_type +
							'/user/profile' +
							"'>Click here</a>"
						);
						isProfileComplete = false;
					}
				} else {
				if (
					profile.first_name &&
					profile.last_name &&
					profile.email &&
					profile.bank_name &&
					profile.bank_account_no &&
					profile.nif &&
					profile.address &&
					profile.state_id &&
					profile.city_id
				) {
					isProfileComplete = true;
				} else {
					caption =
						req.session.user_type == 'producers'
							? labels[
							'LBL_PRODUCER_DASHBOARD_PROFILE_INCOMPLETE_CAPTION'
							][req.session.language]
							: labels[
							'LBL_AGGREGATOR_DASHBOARD_PROFILE_INCOMPLETE_CAPTION'
							][req.session.language];
					caption = caption.replace(
						'#CLICK_HERE#',
						"<a href='" +
						config.base_url +
						req.session.user_type +
						'/user/profile' +
						"'>Click here</a>"
					);
					isProfileComplete = false;
				}
			}

			res.send({ code: 200, caption, is_profile: isProfileComplete });
			return false;
		}
	);
};

exports.getCMS = (req, res) => {
	CMS.findOne(
		{ code: 'TERMS_AND_CONDITIONS', user_type: req.query.user_type },
		{ _id: 0, cms_id: 1, title: 1, code: 1, description: 1 },
		(err, cms_pages) => {
			let tc_title = cms_pages
				? cms_pages['title'][req.session.language || 'EN']
				: '';
			let tc_description = cms_pages
				? cms_pages['description'][req.session.language || 'EN']
				: '';

			res.send({
				code: 200,
				title: tc_title,
				description: tc_description,
			});
			return false;
		}
	);
};

exports.getMyWalletBalance = (req, res) => {
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, wallet: 1 },
		(err, singleUser) => {
			if (!singleUser) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
				return false;
			}

			res.send({
				code: 200,
				wallet_balance: separators(singleUser.wallet),
			});
			return false;
		}
	);
};

exports.getMyAccountSiteFooter = (req, res) => {
	Setting.findOne(
		{},
		{ _id: 0, my_account_site_footer: 1 },
		(err, response) => {
			res.send(response.my_account_site_footer[req.session.language]);
		}
	);
};

exports.getTotalCartProducts = (req, res) => {
	console.log(req.session.user_id);
	Cart.count(
		{ user_id: req.session.user_id },
		(err, total_cart_products) => {
			console.log(total_cart_products);
			res.send(total_cart_products.toString());
		}
	);
};

exports.updatePassword = (req, res) => {
	console.log(req.body);

	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, password: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
				return false;
			}

			passwordHandler.decrypt(
				response.password.toString(),
				(decPin) => {
					if (req.body.old_password != decPin) {
						res.send({
							code: 402,
							message: `${
								labels[
								'LBL_USER_PROFILE_INVALID_OLD_PASSWORD'
								][
								req.session.language ||
								config.default_language_code
								]
								}`,
						});
						return false;
					}

					passwordHandler.encrypt(
						req.body.new_password.toString(),
						(encPin) => {
							User.update(
								{ user_id: req.session.user_id },
								{ password: encPin },
								function (err, response) {
									res.send({
										code: 200,
										message: `${
											labels[
											'LBL_PASSWORD_CHANGED_VALIDATION'
											][
											req.session
												.language ||
											config.default_language_code
											]
											}`,
									});
									return false;
								}
							);
						}
					);
				}
			);
		}
	);
};

exports.addProductReview = async (req, res) => {
	Product.findOne(
		{ product_id: req.body.product_id },
		{ _id: 0, product_id: 1, reviews: 1 },
		(err, response) => {
			let reviews = response.reviews;
			reviews.push({
				review_id: randomNo,
				user_id: req.session.user_id,
				name: req.body.name,
				email: req.body.email,
				rating: parseInt(req.body.rating),
				comment: req.body.comment,
				created_at: new Date(),
			});

			Product.update(
				{ product_id: req.body.product_id },
				{ reviews },
				function (err, response) {
					res.send({
						code: 200,
						message: `${
							labels['LBL_ADD_REVIEW'][
							req.session.language ||
							config.default_language_code
							]
							}`,
					});
				}
			);
		}
	);
};

exports.checkFarmerEmailExist = async (req, res) => {
	console.log(req.body);
	if (req.body.type == 'any') {
		let email = req.body.email.trim();
		let regexEmail = new RegExp(['^', email, '$'].join(''), 'i');

		let columnAndValues = { email: regexEmail };
		if (req.body.mobile_country_code && req.body.phone_number) {
			columnAndValues = {
				$or: [
					{ email: regexEmail },
					{
						mobile_country_code: req.body.mobile_country_code,
						phone_number: req.body.phone_number,
					},
				],
			};
		}

		console.log(columnAndValues);
		Farmer.findOne(
			columnAndValues,
			{
				_id: 0,
				farmer_id: 1,
				email: 1,
				mobile_country_code: 1,
				phone_number: 1,
			},
			(err, response) => {
				console.log(response);
				if (response) {
					if (
						req.body.mobile_country_code &&
						req.body.phone_number &&
						response.mobile_country_code ==
						req.body.mobile_country_code &&
						response.phone_number == req.body.phone_number
					) {
						res.send({
							code: 409,
							message: `${
								labels['LBL_FARMER_MOBILE_NO_EXIST'][
								req.session.language ||
								config.default_language_code
								]
								}`,
						});
					} else {
						res.send({
							code: 409,
							message: `${
								labels['LBL_EMAIL_ID_EXIST'][
								req.session.language ||
								config.default_language_code
								]
								}`,
						});
					}
				} else {
					res.send({ code: 200, message: '' });
				}
			}
		);
	} else {
		let columnAndValues = {
			farmer_id: { $ne: req.body.farmer_id },
			$or: [
				{
					mobile_country_code: req.body.mobile_country_code,
					phone_number: req.body.phone_number,
				},
			],
		};
		console.log(columnAndValues);
		Farmer.findOne(
			columnAndValues,
			{
				_id: 0,
				farmer_id: 1,
				email: 1,
				mobile_country_code: 1,
				phone_number: 1,
			},
			(err, response) => {
				console.log(response);
				if (response) {
					res.send({
						code: 409,
						message: `${
							labels['LBL_FARMER_MOBILE_NO_EXIST'][
							req.session.language ||
							config.default_language_code
							]
							}`,
					});
				} else {
					res.send({ code: 200, message: '' });
				}
			}
		);
	}
};

exports.removeAddress = async (req, res) => {
	let ajaxAddressList = '';
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, addresses: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
					data: ajaxAddressList,
				});
			}

			let user_addresses = response.addresses;
			console.log(user_addresses);
			user_addresses = _.reject(user_addresses, function (address) {
				return address.address_id == req.body.address_id;
			});
			console.log(user_addresses);

			User.update(
				{ user_id: req.session.user_id },
				{ addresses: user_addresses },
				function (err, response) {
					user_addresses =
						user_addresses.length > 0
							? user_addresses.reverse()
							: [];
					_.each(user_addresses, (element, index, list) => {
						ajaxAddressList +=
							'<div class="col-md-6 col-sm-6 col-xs-12"><div class="row my_orders"><div class="col-md-12 mb-sm--20"><div class="text-block address_"><p style="text-transform:capitalize">' +
							element.type +
							' - ' +
							element.name +
							'</p><address>' +
							element.complete_address +
							', ' +
							element.locality +
							', ' +
							element.city_name +
							', ' +
							element.state_name +
							'</address><h6>' +
							labels['LBL_EMAIL'][req.session.language] +
							': <span>' +
							element.email +
							'</span></h6><h6>' +
							labels['LBL_MOBILE_NUMBER'][
							req.session.language
							] +
							': <span>' +
							element.mobile_number +
							'</span></h6><a href="javascript:void(0)" onClick=editAddress(' +
							element.address_id +
							')>' +
							labels['LBL_EDIT'][req.session.language] +
							' <span> | </span></a><a href="javascript:void(0)" onClick=removeAddress(' +
							element.address_id +
							')>' +
							labels['LBL_DELETE'][req.session.language] +
							'</a></div></div></div></div>';
					});

					res.send({
						code: 200,
						message: `${
							labels['LBL_ADDRESS_DELETED'][
							req.session.language ||
							config.default_language_code
							]
							}`,
						data: ajaxAddressList,
					});
				}
			);
		}
	);
};

exports.editAddress = async (req, res) => {
	let ajaxAddressList = '';
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, addresses: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
					data: ajaxAddressList,
				});
			}
			State.findOne(
				{ state_id: req.body.state },
				{ _id: 0, state_id: 1, name: 1 },
				(err, state) => {
					City.findOne(
						{ city_id: req.body.city_district },
						{ _id: 0, city_id: 1, name: 1 },
						(err, city) => {
							let user_addresses = response.addresses;
							_.each(
								user_addresses,
								(element, index, list) => {
									if (
										element.address_id ==
										req.body.address_id
									) {
										user_addresses[index][
											'locality'
										] = req.body.locality;
										user_addresses[index][
											'city_district'
										] = req.body.city_district;
										user_addresses[index][
											'state'
										] = req.body.state;
										user_addresses[index][
											'name'
										] = req.body.name;
										user_addresses[index][
											'complete_address'
										] = req.body.complete_address;
										user_addresses[index][
											'mobile_country_code'
										] =
											req.body.mobile_number &&
												req.body
													.mobile_country_code
												? req.body
													.mobile_country_code
												: '';
										user_addresses[index][
											'mobile_number'
										] = req.body.mobile_number;
										user_addresses[index][
											'email'
										] = req.body.email;
										user_addresses[index][
											'type'
										] = req.body.type;
										user_addresses[index][
											'city_name'
										] = city.name;
										user_addresses[index][
											'state_name'
										] = state.name;
									}
								}
							);

							User.update(
								{ user_id: req.session.user_id },
								{ addresses: user_addresses },
								function (err, response) {
									user_addresses =
										user_addresses.length > 0
											? user_addresses.reverse()
											: [];
									_.each(
										user_addresses,
										(element, index, list) => {
											let emailMobileStr = '';
											if (element.email) {
												emailMobileStr +=
													'<h6>' +
													labels[
													'LBL_EMAIL'
													][
													req
														.session
														.language
													] +
													': <span>' +
													element.email +
													'</span></h6>';
											}

											if (
												element.mobile_country_code &&
												element.mobile_number
											) {
												emailMobileStr +=
													'<h6>' +
													labels[
													'LBL_MOBILE_NUMBER'
													][
													req
														.session
														.language
													] +
													': <span>' +
													element.mobile_country_code +
													' ' +
													element.mobile_number +
													'</span></h6>';
											}

											ajaxAddressList +=
												'<div class="col-md-6 col-sm-6 col-xs-12"><div class="row my_orders"><div class="col-md-12 mb-sm--20"><div class="text-block address_"><p style="text-transform:capitalize">' +
												element.type +
												' - ' +
												element.name +
												'</p><address>' +
												element.complete_address +
												', ' +
												element.locality +
												', ' +
												element.city_name +
												', ' +
												element.state_name +
												'</address>' +
												emailMobileStr +
												'<a href="javascript:void(0)" onClick=editAddress(' +
												element.address_id +
												')>' +
												labels['LBL_EDIT'][
												req.session
													.language
												] +
												' <span> | </span></a><a href="javascript:void(0)" onClick=removeAddress(' +
												element.address_id +
												')>' +
												labels[
												'LBL_DELETE'
												][
												req.session
													.language
												] +
												'</a></div></div></div></div>';
										}
									);

									res.send({
										code: 200,
										message: `${
											labels[
											'LBL_ADDRESS_UPDATED'
											][
											req.session
												.language ||
											config.default_language_code
											]
											}`,
										data: ajaxAddressList,
									});
								}
							);
						}
					);
				}
			);
		}
	);
};

exports.displayAddress = async (req, res) => {
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, addresses: 1 },
		(err, response) => {
			let addresses = response.addresses;
			let columnAndValues = {};
			_.each(addresses, (element, index, list) => {
				if (element.address_id == req.body.address_id) {
					columnAndValues = element;
				}
			});

			if (_.isEmpty(columnAndValues)) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_ADDRESS_NOT_EXIST'][
						req.session.language ||
						config.default_language_code
						]
						}`,
					data: {},
				});
			} else {
				res.send({ code: 200, message: '', data: columnAndValues });
			}
		}
	);
};
exports.getUserAddress = async (req, res) => {
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, addresses: 1 },
		(err, response) => {
			let addresses = response.addresses;
			let columnAndValues = {};
			_.each(addresses, (element, index, list) => {
				if (element.address_id == req.query.address_id) {
					columnAndValues = element;
				}
			});
			console.log(columnAndValues);
			if (_.isEmpty(columnAndValues)) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_ADDRESS_NOT_EXIST'][
						req.session.language ||
						config.default_language_code
						]
						}`,
					data: {},
				});
			} else {
				res.send({ code: 200, message: '', data: columnAndValues });
			}
		}
	);
};

exports.addAddress = async (req, res) => {
	let ajaxAddressList = '';
	User.findOne(
		{ user_id: req.session.user_id },
		{ _id: 0, user_id: 1, addresses: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_SESSION_EXPIRED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
					data: ajaxAddressList,
				});
			}
			State.findOne(
				{ state_id: req.body.state },
				{ _id: 0, state_id: 1, name: 1 },
				(err, state) => {
					City.findOne(
						{ city_id: req.body.city_district },
						{ _id: 0, city_id: 1, name: 1 },
						(err, city) => {
							let user_addresses = response.addresses;
							user_addresses.push({
								address_id: randomNo(),
								locality: req.body.locality,
								city_district: req.body.city_district,
								state: req.body.state,
								name: req.body.name,
								complete_address:
									req.body.complete_address,
								mobile_country_code:
									req.body.mobile_number &&
										req.body.mobile_country_code
										? req.body.mobile_country_code
										: '',
								mobile_number: req.body.mobile_number,
								email: req.body.email,
								type: req.body.type,
								city_name: city.name,
								state_name: state.name,
							});
							let checked = '';
							let html = '';
							let language =
								req.session.language ||
								config.default_language_code;
							User.update(
								{ user_id: req.session.user_id },
								{ addresses: user_addresses },
								function (err, response) {
									user_addresses =
										user_addresses.length > 0
											? user_addresses.reverse()
											: [];
									_.each(
										user_addresses,
										(element, index, list) => {
											console.log(element);
											if (
												req.body.form ==
												'cart'
											) {
												checked = '';
												html = '';

												if (index == 0) {
													checked =
														"checked=''";
												}
												if (element.email) {
													html +=
														'<h6>' +
														labels[
														'LBL_EMAIL'
														][
														language
														] +
														':<span>' +
														element.email +
														' </span></h6>';
												}
												if (
													element.mobile_country_code &&
													element.mobile_number
												) {
													html +=
														'<h6>' +
														labels[
														'LBL_MOBILE_NUMBER'
														][
														language
														] +
														':<span>' +
														element.mobile_country_code +
														' ' +
														element.mobile_number +
														'  </span></h6>';
												}
												ajaxAddressList +=
													'<div class="col-md-6"><div class="my_orders"><div class="order_header"><div class="row"><div class="col-md-12 col-sm-12 col-xs-12"><div class="funkyradio"><div class="funkyradio-primary mar10"><input ' + checked + ' type="radio" name="address_radio" value="' + element.address_id + '" id = "radio_' + element.address_id + '" class="address_radio" ><label for="radio_' + element.address_id + '" onClick = "setAddressType(' + element.address_id + ')" >' + labels['LBL_USE_THIS'][req.session.language] + '</label ></div ></div ></div ></div ></div ><div class="row" style="height: 135px;"><div class="col-md-12 mb-sm--20"><div class="text-block address_"><h4>' + element.type + '-' + element.name + '</h4><address>' + element.complete_address + ',' + element.locality + ',' + element.city_name + element.state_name + '</address>' + html + '</div></div></div></div ></div >';
											} else {
												ajaxAddressList += '<div class="col-md-6 col-sm-6 col-xs-12"><div class="row my_orders"><div class="col-md-12 mb-sm--20"><div class="text-block address_"><p style="text-transform:capitalize">' + element.type + ' - ' + element.name + '</p><address>' + element.complete_address + ', ' + element.locality + ', ' + element.city_name + ', ' + element.state_name + '</address><h6>' + labels['LBL_EMAIL'][req.session.language] + ': <span>' + element.email + '</span></h6><h6>' + labels['LBL_MOBILE_NUMBER'][req.session.language] + ': <span>' + element.mobile_number + '</span></h6><a href="javascript:void(0)" onClick="editAddress(' + element.address_id + ')">' + labels['LBL_EDIT'][req.session.language] + ' <span> | </span></a><a href="javascript:void(0)" onClick=removeAddress(' + element.address_id + ')>' + labels['LBL_DELETE'][req.session.language] + '</a></div></div></div></div>';
											}
										}
									);
									res.send({
										code: 200,
										message: `${
											labels[
											'LBL_NEW_ADDRESS_ADDED'
											][
											req.session
												.language ||
											config.default_language_code
											]
											}`,
										data: ajaxAddressList,
									});
								}
							);
						}
					);
				}
			);
		}
	);
};

exports.saveGPSLocation = async (req, res) => {
	const googleResponse = await geocoder.reverse({
		lat: parseFloat(req.query.latitude),
		lon: parseFloat(req.query.longitude),
	});
	if (googleResponse.length > 0) {
		User.update(
			{ user_id: req.session.user_id },
			{
				gps_location: {
					address: googleResponse[0]['formattedAddress'],
					latitude: req.query.latitude,
					longitude: req.query.longitude,
				},
			},
			(err, response) => {
				res.send({
					code: 200,
					message: `${
						labels['LBL_PROFILE_UPDATED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
			}
		);
	}
};

exports.updateProfile = async (req, res) => {
	console.log(req.body);
	let flag = 1;
	let obj = {
		[req.body.type]: req.body[req.body.type],
	};

	if (req.body.first_name) {
		req.session.name = req.body.first_name;
	}

	if (req.body.email) {
		await User.findOne(
			{ user_id: { $ne: req.session.user_id }, email: req.body.email },
			{ _id: 0, user_id: 1, email: 1 },
			(err, response) => {
				if (response) {
					flag = 0;
				}
			}
		);
	}

	if (req.body.password) {
		await passwordHandler.encrypt(
			req.body.password.toString(),
			(encPin) => {
				obj = {
					[req.body.type]: encPin,
				};
			}
		);
	}

	if (!flag) {
		res.send({
			code: 409,
			message: `${
				labels['LBL_EMAIL_EXIST'][
				req.session.language || config.default_language_code
				]
				}`,
		});
	} else {
		console.log(obj);
		User.update(
			{ user_id: req.session.user_id },
			obj,
			(err, response) => {
				res.send({
					code: 200,
					message: `${
						labels['LBL_PROFILE_UPDATED'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
			}
		);
	}
};

exports.getMaxPriceRange = function (req, res) {
	Unit.findOne(
		{ status: 'active', unit_id: req.query.units_id },
		{ _id: 0, unit_id: 1, max_price_range: 1 },
		(err, response) => {
			res.send({ response: response ? response.max_price_range : 0 });
		}
	);
};

exports.getMinUnitQty = function (req, res) {
	Unit.findOne(
		{ status: 'active', unit_id: req.query.unit_id },
		{ _id: 0, unit_id: 1, min_qty: 1, plural_title: 1 },
		(err, response) => {
			let errQty = '';
			if (req.session.user_type == 'aggregators') {
				errQty = `${
					labels['LBL_AGGREGATOR_PRODUCT_MIN_UNIT_QTY'][
					req.session.language ||
					config.default_language_code
					]
					}`;
			} else if (req.session.user_type == 'compradors') {
				errQty = `${
					labels['LBL_COMPRADOR_PRODUCT_MIN_UNIT_QTY'][
					req.session.language ||
					config.default_language_code
					]
					}`;
			} else if (req.session.user_type == 'trading') {
				errQty = `${
					labels['LBL_TRADING_PRODUCT_MIN_UNIT_QTY'][
					req.session.language ||
					config.default_language_code
					]
					}`;
			} else {
				errQty = `${
					labels['LBL_PRODUCER_PRODUCT_MIN_UNIT_QTY'][
					req.session.language ||
					config.default_language_code
					]
					}`;
			}

			errQty +=
				response.min_qty +
				' ' +
				response['plural_title'][
				req.session.language || config.default_language_code
				];

			res.send({
				qty: response ? response.min_qty : 0,
				error: errQty,
			});
		}
	);
};

exports.getStates = function (req, res) {
	let stateStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_STATE'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	State.find(
		{ status: 'active' },
		{ _id: 0, state_id: 1, name: 1 },
		(err, states) => {
			states = _.sortBy(states, function (item) {
				return item.name;
			});

			_.each(states, (element, index, list) => {
				if (req.query.state_id == element.state_id) {
					stateStr +=
						"<option value='" +
						element.state_id +
						"' selected>" +
						element.name +
						'</option>';
				} else {
					stateStr +=
						"<option value='" +
						element.state_id +
						"'>" +
						element.name +
						'</option>';
				}
			});

			res.send({ response: stateStr });
		}
	);
};

exports.getMobileCountryCodes = function (req, res) {
	let mobileStr =
		"<option value=''>--- " +
		labels['LBL_FARMER_USER_MOBILE_COUNTRY_CODE_PLACEHOLDER'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	MobileCountryCode.find(
		{},
		{ _id: 0, mobile_country_code_id: 1, code: 1 },
		(err, mobile_country_codes) => {
			_.each(mobile_country_codes, (element, index, list) => {
				if (!req.body.mobile_country_code) {
					if (element.code == '+244') {
						mobileStr +=
							"<option value='" +
							element.code +
							"' selected>" +
							element.code +
							'</option>';
					} else {
						mobileStr +=
							"<option value='" +
							element.code +
							"'>" +
							element.code +
							'</option>';
					}
				} else {
					if (req.body.mobile_country_code == element.code) {
						mobileStr +=
							"<option value='" +
							element.code +
							"' selected>" +
							element.code +
							'</option>';
					} else {
						mobileStr +=
							"<option value='" +
							element.code +
							"'>" +
							element.code +
							'</option>';
					}
				}
			});

			res.send({ response: mobileStr });
		}
	);
};

exports.getCities = function (req, res) {
	let cityStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_CITY'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	City.find(
		{ status: 'active', state_id: req.query.state_id },
		{ _id: 0, city_id: 1, name: 1 },
		(err, cities) => {
			cities = _.sortBy(cities, function (item) {
				return item.name;
			});

			_.each(cities, (element, index, list) => {
				if (req.query.city_id == element.city_id) {
					cityStr +=
						"<option value='" +
						element.city_id +
						"' selected>" +
						element.name +
						'</option>';
				} else {
					cityStr +=
						"<option value='" +
						element.city_id +
						"'>" +
						element.name +
						'</option>';
				}
			});

			res.send({ response: cityStr });
		}
	);
};

exports.get_producer = function (req, res) {
	let farmerStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_PRODUCES'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	Farmer.find(
		{ status: 'active', user_id: req.session.user_id },
		{ _id: 0, farmer_id: 1, name: 1 },
		(err, farmers) => {
			farmers = _.sortBy(farmers, function (item) {
				return item
					.name[req.session.language || config.default_language_code];
			});

			_.each(farmers, (element, index, list) => {
				if (req.query.producer_id == element.farmer_id) {
					farmerStr +=
						"<option value='" +
						element.farmer_id +
						"' selected>" +
						element.name +
						'</option>';
				} else {
					farmerStr +=
						"<option value='" +
						element.farmer_id +
						"'>" +
						element.name +
						'</option>';
				}
			});

			res.send({ response: farmerStr });
		}
	);
};

exports.getCategory = function (req, res) {
	let catStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_CATEGORY'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	Category.find(
		{ status: 'active' },
		{ _id: 0, category_id: 1, title: 1 },
		(err, cat) => {
			cat = _.sortBy(cat, function (item) {
				return item
					.title[req.session.language || config.default_language_code];
			});

			_.each(cat, (element, index, list) => {
				if (req.query.category_id == element.category_id) {
					catStr +=
						"<option value='" +
						element.category_id +
						"' selected>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				} else {
					catStr +=
						"<option value='" +
						element.category_id +
						"'>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				}
			});

			res.send({ response: catStr });
		}
	);
};

exports.getSubCategory = function (req, res) {
	console.log(req.query);
	let subCatStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_TITLE'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	SubCategory.find(
		{ status: 'active', category_id: req.query.category_id },
		{ _id: 0, sub_category_id: 1, title: 1 },
		(err, subcat) => {
			subcat = _.sortBy(subcat, function (item) {
				return item
					.title[req.session.language || config.default_language_code];
			});

			_.each(subcat, (element, index, list) => {
				if (req.query.sub_category_id == element.sub_category_id) {
					subCatStr +=
						"<option value='" +
						element.sub_category_id +
						"' selected>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				} else {
					subCatStr +=
						"<option value='" +
						element.sub_category_id +
						"'>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				}
			});

			console.log(subCatStr);
			res.send({ response: subCatStr });
		}
	);
};

exports.getVeriety = function (req, res) {
	let varietyStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_VARIETY'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	ProductVariety.find(
		{ status: 'active', sub_category_id: req.query.sub_category_id },
		{ _id: 0, product_variety_id: 1, title: 1 },
		(err, variety) => {
			variety = _.sortBy(variety, function (item) {
				return item
					.title[req.session.language || config.default_language_code];
			});

			_.each(variety, (element, index, list) => {
				if (
					req.query.product_variety_id ==
					element.product_variety_id
				) {
					varietyStr +=
						"<option value='" +
						element.product_variety_id +
						"' selected>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				} else {
					varietyStr +=
						"<option value='" +
						element.product_variety_id +
						"'>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				}
			});

			res.send({ response: varietyStr });
		}
	);
};

exports.getUnits = function (req, res) {
	let unitStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_UNIT'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	Unit.find(
		{ status: 'active' },
		{ _id: 0, unit_id: 1, title: 1 },
		(err, units) => {
			units = _.sortBy(units, function (item) {
				return item
					.title[req.session.language || config.default_language_code];
			});

			_.each(units, (element, index, list) => {
				if (req.query.unit_id == element.unit_id) {
					unitStr +=
						"<option value='" +
						element.unit_id +
						"' selected>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				} else {
					unitStr +=
						"<option value='" +
						element.unit_id +
						"'>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				}
			});

			res.send({ response: unitStr });
		}
	);
};

exports.get_sizes = function (req, res) {
	let sizeStr =
		"<option value=''>--- " +
		labels['LBL_SELECT_SIZE'][
		req.session.language || config.default_language_code
		] +
		' ---</option>';
	Size.find(
		{ status: 'active', sub_category_id: req.query.sub_category_id },
		{ _id: 0, size_id: 1, title: 1 },
		(err, sizes) => {
			sizes = _.sortBy(sizes, function (item) {
				return item
					.title[req.session.language || config.default_language_code];
			});

			_.each(sizes, (element, index, list) => {
				if (req.query.size_id == element.size_id) {
					sizeStr +=
						"<option value='" +
						element.size_id +
						"' selected>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				} else {
					sizeStr +=
						"<option value='" +
						element.size_id +
						"'>" +
						element.title[
						req.session.language ||
						config.default_language_code
						] +
						'</option>';
				}
			});

			res.send({ response: sizeStr });
		}
	);
};

exports.removeProfileImage = function (req, res) {
	console.log(req.query);
	Farmer.findOne(
		{ farmer_id: req.query.farmer_id },
		{ _id: 0, photo: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_FARMER_EXIST'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
			}

			let filename = req.query.file.substring(
				req.query.file.lastIndexOf('/') + 1
			);
			s3Manager.removeFileObj(
				req.query.file,
				config.aws.s3.userBucket,
				(error, response) => {
					if (error) {
						res.send({
							code: 404,
							message: `${
								labels['LBL_SOMETHING_WRONG'][
								req.session.language ||
								config.default_language_code
								]
								}`,
						});
					} else {
						Farmer.update(
							{ farmer_id: req.query.farmer_id },
							{ photo: '' },
							function (err, response) {
								res.send({
									code: 200,
									message: `${
										labels['LBL_USER_PROFILE'][
										req.session.language ||
										config.default_language_code
										]
										}`,
								});
							}
						);
					}
				}
			);
		}
	);
};

exports.removeProductImage = function (req, res) {
	Product.findOne(
		{ product_id: req.query.product_id },
		{ _id: 0, images: 1 },
		(err, response) => {
			if (!response) {
				res.send({
					code: 404,
					message: `${
						labels['LBL_PRODUCT_EXIST'][
						req.session.language ||
						config.default_language_code
						]
						}`,
				});
			}

			let filename = req.query.file.substring(
				req.query.file.lastIndexOf('/') + 1
			);
			let imagesArr = response.images;
			imagesArr = _.reject(imagesArr, function (image) {
				return image == filename;
			});

			s3Manager.removeFileObj(
				req.query.file,
				config.aws.s3.productBucket,
				(error, response) => {
					if (error) {
						res.send({
							code: 404,
							message: `${
								labels['LBL_SOMETHING_WENT_WRONG'][
								req.session.language ||
								config.default_language_code
								]
								}`,
						});
					} else {
						Product.update(
							{ product_id: req.query.product_id },
							{ images: imagesArr },
							function (err, response) {
								res.send({
									code: 200,
									message: `${
										labels[
										'LBL_PRODUCT_IMAGE_DELETED'
										][
										req.session.language ||
										config.default_language_code
										]
										}`,
								});
							}
						);
					}
				}
			);
		}
	);
};
