let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let s3Manager = require('../../utils/s3-manager');
let {
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');
let City = require('mongoose').model('City');
let Cart = require('mongoose').model('Cart');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let ProductVariety = require('mongoose').model('Product_variety');
let SubCategory = require('mongoose').model('Sub_category');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let User = require('mongoose').model('User');
let sortBy = require('lodash').sortBy;
let labels = require('../../utils/labels.json');
let MobileCountryCode = require('mongoose').model('Mobile_country_code');
let CMS = require('mongoose').model('Cms');
let Sms_template = require('mongoose').model('Sms_template');
let Push_template = require('mongoose').model('Push_template');
let Notification_log = require('mongoose').model('Notification_log');
let smsManager = require('../../utils/sms-manager');
let passwordHandler = require('../../utils/password-handler');


exports.toExplore = (req, res) => {
	return res.redirect('/compradors/explore/list');
} 


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


exports.demand = function (req, res) {
	Cart.count({ user_id: req.session.user_id }, (err, total_cart_products) => {
		Product.aggregate([
			{
				$lookup:
				{
					from: 'categories',
					localField: 'category_id',
					foreignField: 'category_id',
					as: 'categoryDetails'
				}
			}, {
				"$unwind": "$categoryDetails"
			}, {
				$lookup:
				{
					from: 'sub_categories',
					localField: 'sub_category_id',
					foreignField: 'sub_category_id',
					as: 'subCategoryDetails'
				}
			}, {
				"$unwind": "$subCategoryDetails"
			}, {
				$match: {
					user_id: req.session.user_id, product_type: 'demand'
				},
			}, {
				"$project": {
					_id: 0,
					category_id: "$category_id",
					category_title: "$categoryDetails.title",
					sub_category_id: "$sub_category_id",
					sub_category_title: "$subCategoryDetails.title",
					product_id: "$product_id",
					product_type: "$product_type",
					grade: "$grade",
					unit_type: "$unit_type",
					unit_value: "$unit_value",
					size: "$size",
					unit_price: "$unit_price",
					total_unit_price: "$total_unit_price",
					images: "$images",
					location: "$location",
					created_at: "$created_at"
				}
			},
			{
				$sort: { created_at: -1 }
			}
		], (err, demands) => {
			Product.aggregate([
				{
					$lookup:
					{
						from: 'categories',
						localField: 'category_id',
						foreignField: 'category_id',
						as: 'categoryDetails'
					}
				}, {
					"$unwind": "$categoryDetails"
				}, {
					$lookup:
					{
						from: 'sub_categories',
						localField: 'sub_category_id',
						foreignField: 'sub_category_id',
						as: 'subCategoryDetails'
					}
				}, {
					"$unwind": "$subCategoryDetails"
				}, {
					$lookup:
					{
						from: 'states',
						localField: 'state_id',
						foreignField: 'state_id',
						as: 'statesDetails'
					}
				}, {
					"$unwind": "$statesDetails"
				}, {
					$match: {
						product_type: { $in: ['available', 'forecast'] }
					},
				}, {
					"$project": {
						_id: 0,
						category_id: "$category_id",
						category_title: "$categoryDetails.title",
						sub_category_id: "$sub_category_id",
						sub_category_title: "$subCategoryDetails.title",
						state_id: "$state_id",
						state_name: "$statesDetails.name",
						product_id: "$product_id",
						product_type: "$product_type",
						grade: "$grade",
						unit_type: "$unit_type",
						unit_value: "$unit_value",
						size: "$size",
						unit_price: "$unit_price",
						total_unit_price: "$total_unit_price",
						images: "$images",
						location: "$location",
						created_at: "$created_at",
					}
				},
				{
					$sort: { unit_price: 1 }
				}
			], (err, products) => {
				products = JSON.parse(JSON.stringify(products));
				let categories = [], catids = [], unit_prices = [], demandArr = [];

				_.each(demands, (element_demand, index_demand, list_demand) => {
					let demandProducts = _.where(products, { sub_category_id: element_demand.sub_category_id, unit_type: element_demand.unit_type });
					let demandQty = element_demand.unit_value;

					_.each(demandProducts, (element_product, index_product, list_product) => {
						let is_highlighted = false;
						if (demandQty > 0) {
							is_highlighted = true;
							demandQty = (demandQty > element_product.unit_value) ? (demandQty - element_product.unit_value) : 0;
						}

						demandProducts[index_product]['is_highlighted'] = is_highlighted;
						demandProducts[index_product]['images'][0] = ((element_product.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element_product.images[0] : '../../../images/forcast.png');
					})

					let demandObj = element_demand;
					demandObj['products'] = demandProducts;
					demandArr.push(demandObj)
				})

				/*
				_.each(products, (element, index, list) => {
					let productObj = {
						category_title: element.category_title,
						sub_category_title: element.sub_category_title,
					};
					let innerProductArr = [];
					_.each(demands, (element_demand, index_demand, list_demand) => {
						if((element_demand.sub_category_id == element.sub_category_id) && (element_demand.unit_type == element.unit_type) && (element.unit_value >= element_demand.unit_value)){
							innerProductArr.push()
						}
					})

					products[index]['is_highlighted'] = is_highlighted;
					products[index]['is_sorted_product'] = (is_sorted_product) ? 1 : 2;
					unit_prices.push(element.unit_price);
					products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/placeholder.jpg');
					if(!_.contains(catids, element.category_id)){
						categories.push({
							category_id: element.category_id,
							category_title: element.category_title
						})

						catids.push(element.category_id)
					}
				})

				products.sort(function(a, b) {
					return a["is_sorted_product"] - b["is_sorted_product"] || a["unit_price"] - b["unit_price"];
				});*/

				res.render('compradors/explore/demand', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					demands: demandArr,
					total_cart_products,
					higher_price_range: _.max(unit_prices),
					labels,
					language: req.session.language || 'PT',
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),
				});
			})
		})
	})
};

exports.list = async function (req, res) {
	await User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, over_margin: 1 }, (err, singleUser) => {
		Product.aggregate([
			{
				$lookup:
				{
					from: 'categories',
					localField: 'category_id',
					foreignField: 'category_id',
					as: 'categoryDetails'
				}
			}, {
				"$unwind": "$categoryDetails"
			},{
				$lookup:
				{
					from: 'users',
					localField: 'user_id',
					foreignField: 'user_id',
					as: 'userDetails'
				}
			}, {
				"$unwind": "$userDetails"
			}, {
				$lookup:
				{
					from: 'sub_categories',
					localField: 'sub_category_id',
					foreignField: 'sub_category_id',
					as: 'subCategoryDetails'
				}
			}, {
				"$unwind": "$subCategoryDetails"
			}, {
				$lookup:
				{
					from: 'states',
					localField: 'state_id',
					foreignField: 'state_id',
					as: 'statesDetails'
				}
			}, {
				"$unwind": "$statesDetails"
			}, {
				$lookup:
				{
					from: 'units',
					localField: 'unit_type',
					foreignField: 'unit_id',
					as: 'unitDetails'
				}
			}, {
				"$unwind": "$unitDetails"
			}, {
				$match: {
					product_type: { $in: ['available', 'forecast'] },
					status: 'approved',
					expire_date: { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') }
				},
			}, {
				"$project": {
					_id: 0,
					category_id: "$category_id",
					category_title: "$categoryDetails.title",
					sub_category_id: "$sub_category_id",
					sub_category_title: "$subCategoryDetails.title",
					state_name: "$statesDetails.name",
					product_id: "$product_id",
					product_type: "$product_type",
					unit_plural_title: "$unitDetails.plural_title",
					unit_type: "$unitDetails.title",
					min_qty: "$unitDetails.min_qty",
					unit_value: "$unit_value",
					remaining_unit_value: "$remaining_unit_value",
					unit_price: "$unit_price",
					images: "$images"
				}
			},
			{
				$sort: { unit_price: 1 }
			}
		], (err, products) => {
			products = JSON.parse(JSON.stringify(products));
			let categories = [], catids = [], unit_prices = [], unit_prices_original = [];
			var unit_price
				, over_margin = 0;
			_.each(products, (element, index, list) => {
				unit_price = element.unit_price;

				unit_prices_original.push(unit_price);

				products[index]['product_unit_price'] = separators(unit_price);
				products[index]['remaining_unit_qty'] = separatorsWD(element.remaining_unit_value);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['is_favourite'] = (_.contains(singleUser.favourite_product_id, element.product_id)) ? 'yes' : 'no';

				unit_prices.push(unit_price);
				products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/item-placeholder.png');
				if (!_.contains(catids, element.category_id)) {
					categories.push({
						category_id: element.category_id,
						category_title: element.category_title
					})

					catids.push(element.category_id)
				}
			})

			categories = _.sortBy(categories, function (item) { return item.category_title; })
			res.render('compradors/explore/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products,
				categories,
				higher_price_range: _.max(unit_prices),
				higher_price_range_original: _.max(unit_prices_original),
				over_margin: over_margin,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EXPLORE'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		})
	});

};


exports.filter_product_items = (req, res) => {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, over_margin: 1 }, (err, singleUser) => {
		let columnAndValues = { status: 'approved', expire_date: { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') } };

		if (req.query.search_product_title) {
			let title = `subCategoryDetails.title.${req.session.language}`;
			columnAndValues[title] = {
				$regex: req.query.search_product_title.trim(),
				$options: "i"
			}
		}

		if (req.query.search_product_location) {
			columnAndValues.state_id = req.query.search_product_location;
		}

		if (req.query.category_id != 'all') {
			columnAndValues.category_id = req.query.category_id;
		}

		if (req.query.availability_in_stock == 'yes' && req.query.availability_forecasted == 'yes') {
			columnAndValues.product_type = {
				$in: ['available', 'forecast']
			};
		} else if (req.query.availability_in_stock == 'yes') {
			columnAndValues.product_type = {
				$in: ['available']
			};
		} else if (req.query.availability_forecasted == 'yes') {
			columnAndValues.product_type = {
				$in: ['forecast']
			};
		} else {
			columnAndValues.product_type = {
				$nin: ['available', 'forecast', 'demand']
			};
		}
		var ds = [req.query.lower_price_range, req.query.higher_price_range];
		console.log('Before: ', ds)
		
			columnAndValues.unit_price = {
				$gte: parseInt(req.query.lower_price_range),
				$lte: parseInt(req.query.higher_price_range)
			}
		/* columnAndValues.unit_price = {
			$gte: parseInt(req.query.lower_price_range),
			$lte: parseInt(req.query.higher_price_range)
		} */
		console.log('After: ', columnAndValues)

		Product.aggregate([
			{
				$lookup:
				{
					from: 'categories',
					localField: 'category_id',
					foreignField: 'category_id',
					as: 'categoryDetails'
				}
			}, {
				"$unwind": "$categoryDetails"
			}, {
				$lookup:
				{
					from: 'sub_categories',
					localField: 'sub_category_id',
					foreignField: 'sub_category_id',
					as: 'subCategoryDetails'
				}
			}, {
				"$unwind": "$subCategoryDetails"
			}, {
				$lookup:
				{
					from: 'states',
					localField: 'state_id',
					foreignField: 'state_id',
					as: 'statesDetails'
				}
			}, {
				"$unwind": "$statesDetails"
			}, {
				$lookup:
				{
					from: 'units',
					localField: 'unit_type',
					foreignField: 'unit_id',
					as: 'unitDetails'
				}
			}, {
				"$unwind": "$unitDetails"
			}, {
				$match: columnAndValues,
			}, {
				"$project": {
					_id: 0,
					category_title: "$categoryDetails.title",
					sub_category_title: "$subCategoryDetails.title",
					state_name: "$statesDetails.name",
					product_id: "$product_id",
					product_type: "$product_type",
					unit_plural_title: "$unitDetails.plural_title",
					unit_type: "$unitDetails.title",
					min_qty: "$unitDetails.min_qty",
					unit_value: "$unit_value",
					remaining_unit_value: "$remaining_unit_value",
					unit_price: "$unit_price",
					images: "$images"
				}
			},
			{
				$sort: { unit_price: 1 }
			}
		], (err, products) => {
			let productItemsStr = "";
			if (products.length > 0) {
				let is_product = false;
				_.each(products, (element, index, list) => {
					if (element.remaining_unit_value >= element.min_qty) {
						is_product = true;
						let image = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/item-placeholder.png');
						let icon = (_.contains(singleUser.favourite_product_id, element.product_id)) ? ('favourite_product_id=' + element.product_id + ' favourite_icon favourite_icon_' + element.product_id + ' fa fa-heart') : ('favourite_product_id=' + element.product_id + ' favourite_icon favourite_icon_' + element.product_id + ' fa fa-heart-o');

						productItemsStr += "<div class='col-md-4 col-sm-6 col-xs-12 product-list'><div class='product-data'><span style='z-index:999;right: 23px;' class='add-fav' onClick='toggleGetSetFavourite(" + element.product_id + ")'><a href='javascript:void(0)'><i favourite_product_id='" + element.product_id + "' class='" + icon + "' aria-hidden='true'></i></a></span><div class='product-img' onClick='goToDetails(" + element.product_id + ")'><img src='" + image + "' alt='" + (element.sub_category_title[req.session.language || config.default_language_code]) + "' class='pro-image img-size'></div><div class='product-text'><a href='details/" + element.product_id + "'><h3 class='pro_title_'>" + element.sub_category_title[req.session.language || config.default_language_code] + "</h3></a><h4>" + element.category_title[req.session.language || config.default_language_code] + " / " + labels['LBL_QUANTITY'][req.session.language] + ": " + separatorsWD(element.remaining_unit_value) + " " + ((element.remaining_unit_value > 1) ? (element.unit_plural_title[req.session.language || config.default_language_code]) : (element.unit_type[req.session.language || config.default_language_code])) + "</h4><h4 style='color: #f69624;' class='sku_wrapper pro-bottom'>" + separators(element.unit_price) + "Kz / " + (element.unit_type[req.session.language || config.default_language_code]) + "</h4><div class='kp_location'><i class='fa fa-map-marker' aria-hidden='true'></i> <span class='pro-location'>" + element.state_name + "</span></div></div></div></div>";
					}
				})

				if (!is_product) {
					productItemsStr += "<div class='row'><div class='col-md-12 thankyou'><img src='" + config.base_url + "images/thankyou.png'><p>" + labels['LBL_COMPRADOR_EXPLORE_NO_PRODUCTS'][req.session.language] + "</p></div></div>";
				}
			} else {
				productItemsStr += "<div class='row'><div class='col-md-12 thankyou'><img src='" + config.base_url + "images/thankyou.png'><p>" + labels['LBL_COMPRADOR_EXPLORE_NO_PRODUCTS'][req.session.language] + "</p></div></div>";
			}

			res.send(productItemsStr);
			return false;
		})
	})
};


exports.saveSearch = async (req, res) => {
	let products = await Product.aggregate([
		{
			$lookup:
			{
				from: 'users',
				localField: 'user_id',
				foreignField: 'user_id',
				as: 'userDetails'
			}
		}, {
			"$unwind": "$userDetails"
		}, {
			$match: {
				product_id: req.body.product_id
			},
		}, {
			"$project": {
				_id: 0,
				user_id: "$user_id",
				first_name: "$userDetails.first_name",
				statistics: "$userDetails.statistics"
			}
		}
	])

	if (products.length > 0) {
		let total_product_views = (products[0]['statistics'] && products[0]['statistics']['total_product_views']) ? (products[0]['statistics']['total_product_views'] + 1) : 1;
		User.update({ user_id: products[0]['user_id'] }, { $set: { 'statistics.total_product_views': total_product_views } }, (err, response) => { })
	}

	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1, statistics: 1 }, (err, singleUser) => {
		let product_views = singleUser.statistics.product_views || [];
		product_views.push(req.body.product_id);
		let recent_search_product_id = singleUser.recent_search_product_id;
		recent_search_product_id = _.uniq(recent_search_product_id);
		if (!_.contains(recent_search_product_id, req.body.product_id)) {
			if (recent_search_product_id.length > 4) {
				recent_search_product_id.shift();
			}
			recent_search_product_id.push(req.body.product_id);
			User.update({ user_id: req.session.user_id }, { $set: { recent_search_product_id, 'statistics.product_views': product_views } }, (err, response) => { })
		} else {
			User.update({ user_id: req.session.user_id }, { $set: { 'statistics.product_views': product_views } }, (err, response) => { })
		}
	})
};

exports.details = function (req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1}, (err, singleUser) => {
			detailsProduct(req, res);
	})
};

function detailsProduct(req, res) {
	Product.aggregate([
		{
			$lookup:
			{
				from: 'categories',
				localField: 'category_id',
				foreignField: 'category_id',
				as: 'categoryDetails'
			}
		}, {
			"$unwind": "$categoryDetails"
		}, {
			$lookup:
			{
				from: 'sub_categories',
				localField: 'sub_category_id',
				foreignField: 'sub_category_id',
				as: 'subCategoryDetails'
			}
		}, {
			"$unwind": "$subCategoryDetails"
		}, {
			$lookup:
			{
				from: 'units',
				localField: 'unit_type',
				foreignField: 'unit_id',
				as: 'unitDetails'
			}
		}, {
			"$unwind": "$unitDetails"
		}, {
			$lookup:
			{
				from: 'sizes',
				localField: 'size',
				foreignField: 'size_id',
				as: 'sizeDetails'
			}
		}, {
			"$unwind": "$sizeDetails"
		}, {
			$lookup:
			{
				from: 'states',
				localField: 'state_id',
				foreignField: 'state_id',
				as: 'statesDetails'
			}
		}, {
			"$unwind": "$statesDetails"
		}, {
			$lookup:
			{
				from: 'users',
				localField: 'user_id',
				foreignField: 'user_id',
				as: 'userDetails'
			}
		}, {
			"$unwind": "$userDetails"
		}, {
			$match: {
				product_id: req.params.id,
			},
		}, {
			"$project": {
				_id: 0,
				user_id: "$user_id",
				user_name: "$userDetails.name",
				category_title: "$categoryDetails.title",
				sub_category_title: "$subCategoryDetails.title",
				product_id: "$product_id",
				product_type: "$product_type",
				description: "$description",
				unit_min_qty: "$unitDetails.min_qty",
				unit_type: "$unitDetails.title",
				unit_plural_title: "$unitDetails.plural_title",
				unit_value: "$unit_value",
				size: "$sizeDetails.title",
				unit_price: "$unit_price",
				remaining_unit_value: "$remaining_unit_value",
				lower_price_range: "$lower_price_range",
				higher_price_range: "$higher_price_range",
				state_name: "$statesDetails.name",
				expire_date: "$expire_date",
				harvest_date: "$harvest_date",
				images: "$images",
				reviews: "$reviews",
				location: "$location",
				created_at: "$created_at",
			}
		},
		{
			$sort: { created_at: -1 }
		}
	], (err, products) => {
		if (err || products.length == 0) {
			return res.redirect('list');
		}

		let productObj = products[0];

		var unit_price = productObj.unit_price;

		productObj['unit_price'] = separators(unit_price);
		productObj['remaining_unit_qty'] = separatorsWD(productObj.remaining_unit_value);
		productObj['category'] = productObj.category_title;
		productObj['sub_category'] = productObj.sub_category_title;
		productObj['category_title'] = productObj.category_title[req.session.language || config.default_language_code];
		productObj['sub_category_title'] = productObj.sub_category_title[req.session.language || config.default_language_code];
		productObj['unit_type'] = productObj.unit_type[req.session.language || config.default_language_code];
		productObj['unit_plural_title'] = productObj.unit_plural_title[req.session.language || config.default_language_code];
		productObj['size'] = productObj.size[req.session.language || config.default_language_code];
		productObj['description'] = productObj.description[req.session.language || config.default_language_code];
		_.each(productObj.images, (element, index, list) => {
			productObj['images'][index] = config.aws.prefix + config.aws.s3.productBucket + '/' + element;
		})

		if (productObj.images.length == 0) {
			productObj['images'][0] = '../../../images/item-placeholder.png';
		}

		productObj.reviews = (productObj.reviews.length > 0) ? productObj.reviews.reverse() : [];
		let totalRatings = 0, totalReview = 0;
		_.each(productObj.reviews, (element_product, index_product, list_product) => {
			if (element_product.rating) {
				totalRatings += element_product.rating;
				totalReview += 1;
			}
		})
		productObj.average_ratings = Math.ceil(totalRatings / totalReview);
		//productObj.is_favourite = (_.contains(singleUser.favourite_product_id, productObj.product_id)) ? 'yes' : 'no';
		productObj.is_favourite = 'no';
		if (moment(productObj.expire_date).isSameOrAfter(moment().format('YYYY-MM-DD'), 'day')) {
			let startDate = moment(moment(productObj.expire_date).format('YYYY-MM-DD'));
			let endDate = moment(moment().format('YYYY-MM-DD'));
			let days = startDate.diff(endDate, 'days', true)
			productObj['days'] = '- Expires in ' + days + ' days';
		} else {
			productObj['days'] = '';
		}

		productObj['expire_date'] = convert_date(productObj.expire_date, req.session.language);
		productObj['harvest_date'] = convert_date(productObj.harvest_date, req.session.language);
		productObj['share_description'] = labels['LBL_PRICE'][req.session.language] + '-' + productObj['unit_price'] + '  Kz/' + productObj['unit_type'] + ', ' + labels['LBL_QUANTITY'][req.session.language] + '- ' + productObj['remaining_unit_qty'] + ' ' + productObj['unit_type'] + ', ' + labels['LBL_LOCATION'][req.session.language] + '- ' + productObj['state_name'];

		// login 

		MobileCountryCode.find({}, { _id: 0, mobile_country_code_id: 1, code: 1 }, (err, mobile_country_codes) => {
			CMS.findOne({ code: 'TERMS_AND_CONDITIONS', user_type: 'producers' }, { _id: 0, cms_id: 1, title: 1, code: 1, description: 1 }, (err, cms_pages) => {
				let tc_title = (cms_pages) ? cms_pages['title'][req.session.language || 'PT'] : '';
				let tc_description = (cms_pages) ? cms_pages['description'][req.session.language || 'PT'] : '';

		State.find({ status: 'active' }, { _id: 0, state_id: 1, name: 1 }, (err, states) => {
			states = _.sortBy(states, function (item) { return item.name; })
		
		console.log(productObj['share_description']);
		res.render('compradors/explore/details', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			layout: false,
			product: productObj,
			moment,
			labels,
			states,
			mobile_country_codes,
			tc_title,
			tc_description,
			language: req.session.language || 'PT',
			breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'><a href='" + config.base_url + "compradors/explore/list'>" + labels['LBL_EXPLORE'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_PRODUCT_DETAILS'][(req.session.language || 'PT')] + "</li>",
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info')
		});
	})
})
})
})
}

exports.cart = function (req, res) {
	Cart.findOne({ user_id: req.session.user_id, product_id: req.body.product_id }, { _id: 0, cart_id: 1, product_id: 1, user_id: 1, qty: 1 }, (err, item) => {
		if (item) {
			let productObj = {
				qty: parseInt(req.body.qty)
			}

			Cart.update({ user_id: req.session.user_id, product_id: req.body.product_id }, productObj, (err, response) => {
				res.send('done');
			})
		} else {
			let productObj = {
				product_id: req.body.product_id,
				user_id: req.session.user_id,
				qty: parseInt(req.body.qty)
			}

			Cart.create(productObj, (err, response) => {
				res.send('done');
			})
		}
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


exports.checkEmailExist = function (req, res) {
	console.log('call checkEmailExist');
	if (req.body.type == 'email' &&  req.body.mobile_country_code && req.body.phone_number) {

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