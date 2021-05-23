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



exports.list = function (req, res) {
	res.render('farmer/dashboard', {
		labels,
		language: req.session.language || 'PT',
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


exports.get_my_products = (req, res) => {
	let columnAndValues = { producer_id: req.session.user_id };
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
			$lookup:
			{
				from: 'farmers',
				localField: 'producer_id',
				foreignField: 'farmer_id',
				as: 'farmerDetails'
			}
		}, {
			"$unwind": "$farmerDetails"
		}, {
			$match: columnAndValues,
		}, {
			"$project": {
				_id: 0,
				product_id: "$product_id",
				sub_category_title: "$subCategoryDetails.title",
				name: "$farmerDetails.name",
				category_title: "$categoryDetails.title",
				remaining_unit_value: "$remaining_unit_value",
				unit_value: "$unit_value",
				unit_price: "$unit_price",
				reviews: "$reviews",
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
				my_products_str += '<tr onClick=productDetails("' + element.product_id + '")><td>' + element.product_id + '</td><td>' + element.sub_category_title + '</td><td>' + element.name + '</td><td>' + element.category_title + '</td><td>' + ((element.reviews.length > 0) ? (total_ratings / element.reviews.length).toFixed(2) : 0) + '</td><td>' + already_sold + '</td><td>' + to_sell + '</td><td>' + element.unit_price.toFixed(2) + ' Kz</td></tr>';
			})
		} else {
			my_products_str = "<tr><td colspan='7'>" + labels['LBL_NO_PRODUCTS_AVAILABLE'][req.session.language] + "</td></tr>";
		}

		res.send(my_products_str);
		return false;
	})
};

exports.top_producers = function (req, res) {
	Order.aggregate([
		{
			$match: {
				'products.producer_id': {
					$in: [req.session.user_id]
				}
			}
		},
		{
			$project: {
				"product_id": "$products.product_id"
			}
		},
		{
			$unwind: "$product_id"
		},
		{
			$group:
			{
				_id: "$product_id",
				count: { $sum: 1 }
			}
		},
		{
			$sort: {
				"count": -1
			}
		}
	], (err, top_destinations_count) => {
		let product_ids = _.pluck(top_destinations_count, '_id');
		Product.aggregate([
			{
				$lookup:
				{
					from: 'farmers',
					localField: 'producer_id',
					foreignField: 'farmer_id',
					as: 'farmerDetails'
				}
			}, {
				"$unwind": "$farmerDetails"
			}, {
				$match: {
					product_id: { $in: product_ids },
					producer_id: { $ne: '' }
				},
			}, {
				"$project": {
					_id: 0,
					product_id: "$product_id",
					farmer_id: "$farmerDetails.farmer_id",
					name: "$farmerDetails.name"
				}
			}
		], (err, producers) => {
			let producerIdArr = [], producerArr = [];
			producers = JSON.parse(JSON.stringify(producers));
			_.each(producers, (element, index, list) => {
				let orderCountObj = _.findWhere(top_destinations_count, { _id: element.product_id });
				producers[index]['total_orders'] = orderCountObj.count;
			})

			let total_orders = 0;
			_.each(producers, (element, index, list) => {
				if (!_.contains(producerIdArr, element.farmer_id)) {
					producerArr.push({
						farmer_id: element.farmer_id,
						name: element.name,
						total_orders: element.total_orders
					})

					producerIdArr.push(element.farmer_id)
				} else {
					_.each(producerArr, (element_inner, index_inner, list_inner) => {
						if (element_inner.farmer_id == element.farmer_id) {
							producerArr[index_inner]['total_orders'] += element.total_orders;
						}
					})
				}

				total_orders += element.total_orders;
			})

			let top_producers_arr = [];
			_.each(producerArr, (element, index, list) => {
				top_producers_arr.push({
					name: element.name,
					y: ((element.total_orders * 100) / total_orders)
				})
			})

			res.render('aggregators/ajax_dashboard_top_producers', {
				labels,
				layout: false,
				language: req.session.language || 'PT',
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				moment,
				top_producers_arr,
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			})
		})
	})
};
