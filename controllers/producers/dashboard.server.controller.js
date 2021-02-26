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
let Order = require('mongoose').model('Order');
let City = require('mongoose').model('City');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let labels = require('../../utils/labels.json');

exports.get_my_products = (req, res) => {
	let columnAndValues = { user_id: req.session.user_id };
	if (req.query.category_id != 'all') {
		columnAndValues['category_id'] = req.query.category_id;
	}
	console.log(columnAndValues);

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
				from: 'product_varieties',
				localField: 'product_variety_id',
				foreignField: 'product_variety_id',
				as: 'productVarietiesDetails'
			}
		}, {
			"$unwind": "$productVarietiesDetails"
		}, {
			$match: columnAndValues,
		}, {
			"$project": {
				_id: 0,
				product_id: "$product_id",
				sub_category_title: "$subCategoryDetails.title",
				name: "$farmerDetails.name",
				category_title: "$categoryDetails.title",
				unit_value: "$unit_value",
				remaining_unit_value: "$remaining_unit_value",
				reviews: "$reviews",
				unit_price: "$unit_price",
				created_at: "$created_at"
			}
		},
		{
			$sort: { created_at: -1 }
		}
	], (err, my_products) => {
		let my_products_str = '', to_sell = 0, already_sold = 0;
		if (my_products.length > 0) {
			_.each(my_products, (element, index, list) => {
				element.category_title = element.category_title[req.session.language || config.default_language_code];
				element.sub_category_title = element.sub_category_title[req.session.language || config.default_language_code];
				let total_ratings = (element.reviews.length > 0) ? (element.reviews.reduce((a, b) => +a + +b.rating, 0)) : 0;
				to_sell = ((element.remaining_unit_value * 100) / element.unit_value) + '%';
				already_sold = (100 - ((element.remaining_unit_value * 100) / element.unit_value)) + '%';

				my_products_str += '<tr onClick=productDetails("' + element.product_id + '")><td>' + element.product_id + '</td><td>' + element.sub_category_title + '</td><td>' + element.category_title + '</td><td>' + ((element.reviews.length > 0) ? (total_ratings / element.reviews.length).toFixed(2) : 0) + '</td><td>' + already_sold + '</td><td>' + to_sell + '</td><td>' + element.unit_price.toFixed(2) + ' Kz</td></tr>';
			})
		} else {
			my_products_str = "<tr><td colspan='7'>" + labels['LBL_NO_PRODUCTS_AVAILABLE'][req.session.language] + "</td></tr>";
		}

		res.send(my_products_str);
		return false;
	})
};

exports.list = function (req, res) {
	res.render('producers/dashboard', {
		labels,
		language: req.session.language || 'EN',
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		moment,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	})
};

exports.get_ongoing_orders = function (req, res) {
	Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] }, status: { $nin: ['cancelled', 'delivered'] } }, { _id: 0, updated_at: 0 }, (err, orders) => {
		let tbl_ongoing_orders = "", userProducts = 0, userProductsSum = 0, ordered_date = '', shipped_date = '';
		if (orders.length > 0) {
			_.each(orders, (element, index, list) => {
				userProducts = 0, userProductsSum = 0;
				_.each(element.products, (inner_element, inner_index, inner_list) => {
					if (inner_element.user_info.user_id == req.session.user_id) {
						userProducts += 1;
						inner_element.unit_price = (typeof inner_element.original_price !== undefined && inner_element.original_price > 0) ? inner_element.original_price : inner_element.unit_price;
						userProductsSum += (inner_element.unit_price * inner_element.qty);
					}
				})

				ordered_date = convert_date(element.created_at, req.session.language);
				shipped_date = convert_date(element.delivery_at, req.session.language);
console.log(index)
				let className = '';
				if (index % 2 != 0) {
					className = 'tbl-row-color';
				}
				let address = "-";
				if (element.address_info.locality)
					address = element.address_info.locality + ', ' + element.address_info.city_district + ', ' + element.address_info.state;

					_status = (element.status == 'Paid') ? labels['LBL_PAID'][(req.session.language || config.default_language_code)] : labels['LBL_PAID'][(req.session.language || config.default_language_code)];


				tbl_ongoing_orders += 
				    "<tr><td class=' column_order_table" + className + "' onClick=orderDetails('" + config.base_url + "','producers','" + element.order_id + "')>" + element.order_id + "</td><td>" + 
					element.buyer_info.user_id + "</td><td>" + ordered_date + "</td><td>" + 
					shipped_date + "</td><td>" + 
					address + "</td><td>" +
					separators(userProductsSum) + " Kz</td><td style='text-transform:capitalize;'>"+
					_status + "</td></tr>";
			})
		} else {
			tbl_ongoing_orders += "<tr><td colspan='7'>" + (labels['LBL_PRODUCER_DASHBOARD_ONGOING_ORDERS_NO_ORDERS'][(req.session.language || 'EN')]) + "</td></tr>";
		}

		res.send(tbl_ongoing_orders);
		return false;
	}).sort({ created_at: -1 })
};

exports.top_destinations = function (req, res) {
	Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] } }, { _id: 0, order_id: 1 }, (err, total_destinations_orders) => {
		Order.aggregate([
			{
				$match: {
					'products.user_info.user_id': {
						$in: [req.session.user_id]
					}
				}
			},
			{
				$project: {
					"city_district": "$address_info.city_district"
				}
			},
			{
				$unwind: "$city_district"
			},
			{
				$group:
				{
					_id: "$city_district",
					count: { $sum: 1 }
				}
			},
			{
				$sort: {
					"count": -1
				}
			},
			{
				$limit: 5
			}
		], (err, top_destinations_count) => {
			let top_destinations_arr = [];
			_.each(top_destinations_count, (element, index, list) => {
				top_destinations_arr.push({
					name: element._id,
					y: ((element.count * 100) / total_destinations_orders.length)
				})
			})

			res.render('producers/ajax_dashboard_top_destinations', {
				labels,
				layout: false,
				language: req.session.language || 'EN',
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				moment,
				top_destinations_arr,
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			})
		})
	})
};