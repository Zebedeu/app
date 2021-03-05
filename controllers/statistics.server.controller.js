let Order = require('mongoose').model('Order');
let Product = require('mongoose').model('Product');
let User = require('mongoose').model('User');
let Farmer = require('mongoose').model('Farmer');
let State = require('mongoose').model('State');
let config = require('../../config/config');
let {
	randomNo,
} = require('../utils/id-generator');
let {
	separators,
	separatorsWD
} = require('../utils/formatter');
let _ = require('underscore');
let __ = require('lodash');
let moment = require('moment');
let labels = require('../utils/labels.json');
let Unit = require('mongoose').model('Unit');

exports.outwards = async (req, res) => {
	let firstDate = moment().format('YYYY') + '-01-01';
	let lastDate = moment().format('YYYY') + '-12-31';
	let columnAndValues = {
		'buyer_info.user_id': req.session.user_id,
		status: { $nin: ['reserved'] },
		$and: [
			{ "created_at": { $gte: new Date(firstDate + 'T00:00:00.000Z') } },
			{ "created_at": { $lte: new Date(lastDate + 'T23:59:59.000Z') } }
		]
	}

	let values = [], selectedOrders = [], sum = 0;
	let orders = await Order.aggregate([{ $match: columnAndValues }, { $project: { _id: 0, order_id: 1, total: 1, created_at: 1, month: { $month: '$created_at' } } }]).sort({ created_at: 1 });

	for (let month = 0; month < 12; month++) {
		selectedOrders = _.where(orders, { month: (month + 1) });
		sum = __.sumBy(selectedOrders, 'total');
		values.push(sum);
	}

	res.render('charts/outwards', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		values,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.purchase = async (req, res) => {
	let firstDate = moment().format('YYYY') + '-01-01';
	let lastDate = moment().format('YYYY') + '-12-31';
	let columnAndValues = {
		'buyer_info.user_id': req.session.user_id,
		status: { $nin: ['reserved'] },
		$and: [
			{ "created_at": { $gte: new Date(firstDate + 'T00:00:00.000Z') } },
			{ "created_at": { $lte: new Date(lastDate + 'T23:59:59.000Z') } }
		]
	}

	let values = [], selectedOrders = [], sum = 0;
	let orders = await Order.aggregate([{ $match: columnAndValues }, { $project: { _id: 0, order_id: 1, total: 1, products: 1, created_at: 1, month: { $month: '$created_at' } } }]).sort({ created_at: 1 });

	for (let month = 0; month < 12; month++) {
		selectedOrders = _.where(orders, { month: (month + 1) });
		sum = 0;
		_.each(selectedOrders, (element, index, list) => {
			sum += element.products.length;
		})

		values.push(sum);
	}

	res.render('charts/purchase', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		values,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.earnings = async (req, res) => {
	let firstDate = moment().format('YYYY') + '-01-01';
	let lastDate = moment().format('YYYY') + '-12-31';
	let columnAndValues = {
		'products.user_info.user_id': req.session.user_id,
		status: { $nin: ['reserved'] },
		$and: [
			{ "created_at": { $gte: new Date(firstDate + 'T00:00:00.000Z') } },
			{ "created_at": { $lte: new Date(lastDate + 'T23:59:59.000Z') } }
		]
	}

	let values = [], selectedOrders = [], sum = 0;
	let orders = await Order.aggregate([{ $match: columnAndValues }, { $project: { _id: 0, order_id: 1, total: 1, products: 1, created_at: 1, month: { $month: '$created_at' } } }]).sort({ created_at: 1 });

	for (let month = 0; month < 12; month++) {
		selectedOrders = _.where(orders, { month: (month + 1) });
		sum = 0;
		_.each(selectedOrders, (element, index, list) => {
			_.each(element.products, (element_inner, index_inner, list_inner) => {
				if (element_inner.user_info.user_id == req.session.user_id) {
					sum += (element_inner.unit_price * element_inner.qty);
				}
			})
		})

		values.push(sum);
	}

	res.render('charts/earnings', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		values,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.sales = async (req, res) => {
	let firstDate = moment().format('YYYY') + '-01-01';
	let lastDate = moment().format('YYYY') + '-12-31';
	let columnAndValues = {
		'products.user_info.user_id': req.session.user_id,
		status: { $nin: ['reserved'] },
		$and: [
			{ "created_at": { $gte: new Date(firstDate + 'T00:00:00.000Z') } },
			{ "created_at": { $lte: new Date(lastDate + 'T23:59:59.000Z') } }
		]
	}

	let values = [], selectedOrders = [];
	let orders = await Order.aggregate([{ $match: columnAndValues }, { $project: { _id: 0, order_id: 1, total: 1, products: 1, created_at: 1, month: { $month: '$created_at' } } }]).sort({ created_at: 1 });

	for (let month = 0; month < 12; month++) {
		selectedOrders = _.where(orders, { month: (month + 1) });
		sum = 0;
		_.each(selectedOrders, (element, index, list) => {
			_.each(element.products, (element_inner, index_inner, list_inner) => {
				if (element_inner.user_info.user_id == req.session.user_id) {
					sum += 1;
				}
			})
		})

		values.push(sum);
	}

	res.render('charts/sales', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		values,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.topFarmers = (req, res) => {
	Farmer.find({ user_id: req.session.user_id, user_type: 'aggregators', total_orders: { $gt: 0 } }, { _id: 0, name: 1, total_orders: 1 }, (err, farmers) => {
		let titles = [], total_orders = [];
		titles = _.pluck(farmers, 'name');
		total_orders = _.pluck(farmers, 'total_orders');

		res.render('charts/top-farmers', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			titles,
			total_orders,
			labels,
			layout: false,
			language: req.session.language || config.default_language_code,
			messages: req.flash('error') || req.flash('info'),
			messages: req.flash('info'),
		});
	}).sort({ total_orders: -1 }).limit(10)
};

exports.topDestinations = async (req, res) => {
	let products = await Product.aggregate([
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
			$match: {
				user_id: req.session.user_id,
				product_type: { $in: ['available', 'forecast'] },
				'stateDetails.total_orders': { $gt: 0 },
				'stateDetails.status': 'active'
			},
		}, {
			$group: {
				_id: "$state_id",
				name: { $first: "$stateDetails.name" },
				total_orders: { $first: "$stateDetails.total_orders" }
			}
		},
		{
			$sort: { total_orders: -1 }
		},
		{
			$limit: 10
		}
	])

	let titles = [], total_orders = [];
	titles = _.pluck(products, 'name');
	total_orders = _.pluck(products, 'total_orders');

	res.render('charts/top-destinations', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		titles,
		total_orders,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.topProducts = async (req, res) => {
	let products = await Product.aggregate([
		{
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
				user_id: req.session.user_id,
				product_type: { $in: ['available', 'forecast'] },
				total_orders: { $gt: 0 }
			},
		}, {
			"$project": {
				_id: 0,
				sub_category_id: "$sub_category_id",
				sub_category_title: "$subCategoryDetails.title",
				product_id: "$product_id",
				total_orders: "$total_orders",
				status: 'approved'
			}
		},
		{
			$sort: { total_orders: -1 }
		},
		{
			$limit: 10
		}
	])

	let titles = [], total_orders = [], sub_category_title = '';
	_.each(products, (element, index, list) => {
		sub_category_title = element.sub_category_title[req.session.language || config.default_language_code];
		titles.push(sub_category_title);
		total_orders.push(parseInt(element.total_orders));
	})

	res.render('charts/top-products', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		titles,
		total_orders,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.total = async (req, res) => {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1, statistics: 1 }, (err, singleUser) => {
		// if (req.session.user_type == 'compradors') { // original
		if (req.session.user_type == 'compradors' || req.session.user_type == 'trading') {
			let responseObj = {
				total_purchase: (singleUser.statistics && singleUser.statistics.total_purchase) ? separators(singleUser.statistics.total_purchase) : 0,
				total_product_views: (singleUser.statistics && singleUser.statistics.product_views) ? separatorsWD(singleUser.statistics.product_views.length) : 0,
				total_favourite_products: separatorsWD(singleUser.favourite_product_id.length),
				total_purchase_products: (singleUser.statistics && singleUser.statistics.total_purchase_products) ? separatorsWD(singleUser.statistics.total_purchase_products) : 0
			}
			let activeColumnAndValues = [
				{
					$match: {
						user_id: req.session.user_id,
						product_type: 'demand',
						expire_date: { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') }
					}
				},
				{
					$group: {
						_id: null,
						count: { $sum: 1 }
					}
				}
			];

			Product.aggregate(activeColumnAndValues, (error, orders) => {
				responseObj['total_active_demands'] = (orders.length > 0) ? separatorsWD(orders[0]['count']) : 0;
				let expireColumnAndValues = [
					{
						$match: {
							user_id: req.session.user_id,
							product_type: 'demand',
							expire_date: { $lt: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') }
						}
					},
					{
						$group: {
							_id: null,
							count: { $sum: 1 }
						}
					}
				];

				Product.aggregate(expireColumnAndValues, (error, orders) => {
					responseObj['total_expired_demands'] = (orders.length > 0) ? separatorsWD(orders[0]['count']) : 0;
					res.send({ code: 200, response: responseObj })
					return false;
				})
			})
		} else {
			let responseObj = {
				total_sales: (singleUser.statistics && singleUser.statistics.total_sales) ? separators(singleUser.statistics.total_sales) : 0,
				total_product_views: (singleUser.statistics && singleUser.statistics.total_product_views) ? separatorsWD(singleUser.statistics.total_product_views) : 0
			}
			Unit.find({}, {}, (err, unitData) => {
				Product.find({ user_id: req.session.user_id, expire_date: { $lt: new Date(moment().format('YYYY-MM-DD') + 'T23:59:59.000Z') } }, { _id: 0, product_id: 1, status: 1, total_orders: 1 }, (err, expireProducts) => {
					Product.find({ user_id: req.session.user_id }, { _id: 0, product_id: 1, status: 1, total_orders: 1, remaining_unit_value: 1, unit_type: 1 }, (err, products) => {
						let approvedProducts = _.where(products, { status: 'approved' });
						let notApprovedProducts = _.where(products, { status: 'not_approved' });
						let productArr = _.pluck(products, 'product_id');
						let unSoldProducts = products;
						Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] } }, (error, orders) => {
							if (error) {
								logger('Error: can not get ', dbConstants.dbSchema.orders);
								done(errors.internalServer(true), null);
								return;
							}
							let total_sales =0;
							let finalProducts = [];
							_.each(orders, data => {
								data.products = JSON.parse(JSON.stringify(data.products));
								_.each(data.products, singleProduct => {
									singleProduct.seller_id = singleProduct.user_info.user_id
								})
								if(data.payment_status == 'paid'){
									total_sales += 1;
								}
								finalProducts.push(_.where(data.products, { seller_id: req.session.user_id }))
							})

							finalProducts = _.flatten(finalProducts)
							finalProducts = _.groupBy(finalProducts, 'product_id');
							finalProducts = finalProducts || {};
							let soldCount = Object.keys(finalProducts).length || 0
							User.find({ favourite_product_id: { $in: productArr } }, { _id: 0, user_id: 1 }, (err, users) => {
								responseObj['total_active_products'] = separatorsWD(approvedProducts.length);
								responseObj['total_inactive_products'] = separatorsWD(notApprovedProducts.length);
								responseObj['total_expired_products'] = separatorsWD(expireProducts.length);
								responseObj['total_favourite_list'] = separatorsWD(users.length);
								responseObj['total_sold_products'] = separatorsWD(soldCount);
								responseObj['total_unsold_products'] = separatorsWD(unSoldProducts.length);
								responseObj['total_sales'] = separatorsWD(total_sales);

								res.send({ code: 200, response: responseObj })
								return false;
							})
							//console.log(Object.keys(finalProducts).length);
						});




					})
				})
			})
		}
	})
};

exports.totalOrders = (req, res) => {
	let matchObj = {
		"buyer_info.user_id": req.session.user_id
	};

	if (_.contains(['producers', 'aggregators'], req.session.user_type)) {
		matchObj = {
			"products.user_info.user_id": req.session.user_id
		}
	}

	let columnAndValues = [
		{
			$match: matchObj
		},
		{
			$group: {
				_id: { status: "$status" },
				count: { $sum: 1 }
			}
		}
	];

	Order.aggregate(columnAndValues, (error, orders) => {
		let open = 0, completed = 0, cancelled = 0;
		_.each(orders, (element, index, list) => {
			if (element._id.status == 'completed') {
				completed += element.count;
			} else if (element._id.status == 'cancelled') {
				cancelled += element.count;
			} else {
				open += element.count;
			}
		})

		res.send({ code: 200, response: { open: separatorsWD(open), completed: separatorsWD(completed), cancelled: separatorsWD(cancelled) } })
		return false;
	})
};

exports.recommendedProducts = async (req, res) => {
	let productArr = [];
	let cheapProducts = await Product.find({ product_type: { $in: ['available', 'forecast'] }, status: 'approved', expire_date: { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') } }, { _id: 0, product_id: 1 }).sort({ unit_price: 1 }).limit(4);
	productArr = _.pluck(cheapProducts, 'product_id');

	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1, statistics: 1 }, (err, singleUser) => {
		let matchObj = {
			"buyer_info.user_id": req.session.user_id
		};

		let columnAndValues = [
			{
				$match: matchObj
			},
			{
				$unwind: '$products'
			},
			{
				$unwind: '$products.product_id'
			},
			{
				$group: {
					_id: "$products.product_id",
					count: { $sum: 1 }
				}
			},
			{
				$sort: { "count": -1 }
			},
			{
				$limit: 4
			}
		];

		Order.aggregate(columnAndValues, (error, orders) => {
			if (orders.length > 0) {
				productArr = _.pluck(orders, '_id');
			}

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
						product_id: { $in: productArr },
						product_type: { $in: ['available', 'forecast'] },
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

				let overMargin = 0;
				if (req.session.user_type == 'trading') {
					overMargin = req.session.over_margin;
					recommendedProductsHelper(req, res, singleUser, products, productArr, overMargin)
				} else {
					recommendedProductsHelper(req, res, singleUser, products, productArr, overMargin)
				}

			})
		})
	})
};

function recommendedProductsHelper(req, res, singleUser, products, productArr, overMargin) {
	_.each(products, (element, index, list) => {
		products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
		products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
		products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
		products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
		products[index]['is_favourite'] = (_.contains(singleUser.favourite_product_id, element.product_id)) ? 'yes' : 'no';
		products[index]['unit_price'] = separators(element.unit_price + (element.unit_price * overMargin / 100));
		products[index]['remaining_unit_qty'] = separatorsWD(element.remaining_unit_value);
		products[index]['image'] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/item-placeholder.png');
	})

	products.sort(function (a, b) {
		return productArr.indexOf(a.product_id) - productArr.indexOf(b.product_id);
	});

	res.render(req.session.user_type + '/recommended', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		products,
		labels,
		layout: false,
		language: req.session.language || config.default_language_code,
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
}