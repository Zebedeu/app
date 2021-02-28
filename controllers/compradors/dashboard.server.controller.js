let _ = require('underscore');
let Order = require('mongoose').model('Order');
let config = require('../../../config/config');
let moment = require('moment');
let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let Product = require('mongoose').model('Product');
let labels = require('../../utils/labels.json');
let {
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');

exports.list = function (req, res) {
	res.render('compradors/dashboard', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.matchProducts = (req, res) => {
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
			$match: {
				user_id: req.session.user_id, product_type: 'demand',
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
				product_id: "$product_id",
				product_type: "$product_type",
				grade: "$grade",
				unit_plural_title: "$unitDetails.plural_title",
				unit_type: "$unitDetails.title",
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
			$sort: { unit_price: 1 }
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
					state_id: "$state_id",
					state_name: "$statesDetails.name",
					product_id: "$product_id",
					product_type: "$product_type",
					unit_plural_title: "$unitDetails.plural_title",
					unit_type: "$unitDetails.title",
					min_qty: "$unitDetails.min_qty",
					unit_value: "$unit_value",
					remaining_unit_value: "$remaining_unit_value",
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
				element_demand = JSON.parse(JSON.stringify(element_demand));
				element_demand['category_title'] = element_demand.category_title[req.session.language || config.default_language_code];
				element_demand['sub_category_title'] = element_demand.sub_category_title[req.session.language || config.default_language_code];

				let demandProducts = _.where(products, { sub_category_id: element_demand.sub_category_id });
				let demandQty = element_demand.unit_value;

				_.each(demandProducts, (element_product, index_product, list_product) => {
					demandProducts[index_product]['unit_price'] = separators(element_product.unit_price);
					demandProducts[index_product]['remaining_unit_qty'] = separatorsWD(element_product.remaining_unit_value);
					demandProducts[index_product]['category_title'] = element_product.category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['sub_category_title'] = element_product.sub_category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_plural_title'] = element_product.unit_plural_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_type'] = element_product.unit_type[req.session.language || config.default_language_code];

					let is_highlighted = false;
					if (demandQty > 0) {
						is_highlighted = true;
						demandQty = (demandQty > element_product.unit_value) ? (demandQty - element_product.unit_value) : 0;
					}

					demandProducts[index_product]['is_highlighted'] = is_highlighted;
					demandProducts[index_product]['images'][0] = ((element_product.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element_product.images[0] : '../../../images/item-placeholder.png');
				})

				let demandObj = element_demand;
				demandObj['products'] = demandProducts;
				demandArr.push(demandObj)
			})

			res.render('compradors/match', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				demands: demandArr,
				layout: false,
				labels,
				language: req.session.language || config.default_language_code,
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		})
	})
};

exports.get_recently_viewed_products = function (req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1, wallet: 1 }, (err, singleUser) => {
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
				$match: {
					product_id: { $in: singleUser.recent_search_product_id },
					status: 'approved',
					expire_date: { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') }
				},
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
			}
		], (err, products) => {
			products = JSON.parse(JSON.stringify(products));
			_.each(products, (element, index, list) => {
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['is_favourite'] = (_.contains(singleUser.favourite_product_id, element.product_id)) ? 'yes' : 'no';
			})

			let recent_search_product_id = ((singleUser.recent_search_product_id.length > 0) ? singleUser.recent_search_product_id.reverse() : []);
			products.sort(function (a, b) {
				return recent_search_product_id.indexOf(a.product_id) - recent_search_product_id.indexOf(b.product_id);
			});

			let tbl_recently_viewed_products = "";
			if (products.length > 0) {
				_.each(products, (element, index, list) => {
					if (element.remaining_unit_value >= element.min_qty) {
						let className = '';
						if (index % 2 != 0) {
							className = 'tbl-row-color';
						}

						tbl_recently_viewed_products += "<tr><td class='capitalize column_order_table " + className + "' onClick=productDetails('" + config.base_url + "','compradors','" + element.product_id + "')>" + element.sub_category_title + "</td><td class='capitalize'>" + element.category_title + "</td><td>" + separators(element.unit_price) + 'Kz / ' + element.unit_type + "</td><td>" + separatorsWD(element.remaining_unit_value) + ' ' + (parseFloat(element.remaining_unit_value) > 1 ? element.unit_plural_title : element.unit_type) + "</td><td>" + element.state_name + "</td></tr>";
					}
				})
			} else {
				tbl_recently_viewed_products += "<tr><td colspan='5'>" + (labels['LBL_COMPRADOR_DASHBOARD_RECENTLY_VIEWED_PRODUCTS_NO_PRODUCTS'][(req.session.language || 'EN')]) + "</td></tr>";
			}

			res.send(tbl_recently_viewed_products);
			return false;
		})
	})
};

exports.get_ongoing_orders = function (req, res) {
	Order.find({ 'buyer_info.user_id': { $in: [req.session.user_id] }, status: { $nin: ['cancelled', 'completed', 'shipped'] } }, { _id: 0, updated_at: 0 }, (err, orders) => {
		let tbl_ongoing_orders = "";
		if (orders.length > 0) {
			_.each(orders, (element, index, list) => {
				ordered_date = convert_date(element.created_at, req.session.language);
				shipped_date = convert_date(element.delivery_at, req.session.language);
				let className = '';
				if (index % 2 != 0) {
					className = 'tbl-row-color';
				}
				let address = "-";
				if (element.address_info.locality)
					address = element.address_info.locality + ', ' + element.address_info.city_district + ', ' + element.address_info.state;

				_status = "";
				if (element.status == 'paid') {
					_status = (element.status == 'Paid') ? labels['LBL_PAID'][(req.session.language || config.default_language_code)] : labels['LBL_PAID'][(req.session.language || config.default_language_code)];
				} else if (element.status == 'packed') {
					_status = (element.status == 'packed') ? labels['LBL_PACKED'][(req.session.language || config.default_language_code)] : labels['LBL_PACKED'][(req.session.language || config.default_language_code)];
				} else if (element.status == 'shipped') {
					_status = (element.status == 'shipped') ? labels['LBL_SHIPPED'][(req.session.language || config.default_language_code)] : labels['LBL_SHIPPED'][(req.session.language || config.default_language_code)];
				} else if (element.status == 'delivered') {
					_status = (element.status == 'delivered') ? labels['LBL_DELIVERED'][(req.session.language || config.default_language_code)] : labels['LBL_DELIVERED'][(req.session.language || config.default_language_code)];
				} else if (element.status == 'waiting') {
					_status = (element.status == 'waiting') ? labels['LBL_WAITING'][(req.session.language || config.default_language_code)] : labels['LBL_WAITING'][(req.session.language || config.default_language_code)];
				}

				tbl_ongoing_orders += "<tr><td class='column_order_table " + className + "' onClick=orderDetails('" + config.base_url + "','compradors','" + element.order_id + "')>" + element.order_id + "</td><td>" + ordered_date + "</td><td>" + shipped_date + "</td><td>" + address + "</td><td> " + separators(element.total) + " Kz</td><td style='text-transform:capitalize;'>" + _status + "</td></tr>";
			})
		} else {
			tbl_ongoing_orders += "<tr><td colspan='6'>" + (labels['LBL_COMPRADOR_DASHBOARD_ONGOING_ORDERS_NO_ORDERS'][(req.session.language || 'EN')]) + "</td></tr>";
		}

		res.send(tbl_ongoing_orders);
		return false;
	}).sort({ created_at: -1 })
};

exports.settings = function (req, res) {
	Setting.findOne({}, { bank_information: 1 }, (err, settings) => {
		res.send(settings)
	})
};