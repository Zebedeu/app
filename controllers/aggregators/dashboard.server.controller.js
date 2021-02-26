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
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let labels = require('../../utils/labels.json');
let Order = require('mongoose').model('Order');
let Farmer = require('mongoose').model('Farmer');

exports.get_ongoing_orders = function (req, res) {
	Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] }, status: { $nin: ['cancelled', 'completed', 'shipped'] } }, { _id: 0, updated_at: 0 }, (err, orders) => {
		let tbl_ongoing_orders = "", userProducts = 0, userProductsSum = 0;
		if (orders.length > 0) {
			_.each(orders, (element, index, list) => {
				userProducts = 0, userProductsSum = 0;
				_.each(element.products, (inner_element, inner_index, inner_list) => {
					if (inner_element.user_info.user_id == req.session.user_id) {
						userProducts += 1;
						userProductsSum += (inner_element.unit_price * inner_element.qty);
					}
				})

				ordered_date = convert_date(element.created_at, req.session.language);
				shipped_date = convert_date(element.delivery_at, req.session.language);

				let className = '';
				if (index % 2 != 0) {
					className = 'tbl-row-color';
				}
				let address = "-";
				if (element.address_info.locality)
					address = element.address_info.locality + ', ' + element.address_info.city_district + ', ' + element.address_info.state;
				
				element.address_info.locality + ', ' + element.address_info.city_district + ', ' + element.address_info.state
        
				_status = (element.status == 'Paid') ? labels['LBL_PAID'][(req.session.language || config.default_language_code)] : labels['LBL_PAID'][(req.session.language || config.default_language_code)];
				
				tbl_ongoing_orders += "<tr><td class='column_order_table " + className + "' onClick=orderDetails('" + config.base_url + "','aggregators','" + element.order_id + "')>" + element.order_id + "</td><td>" + element.buyer_info.user_id + "</td><td>" + ordered_date + "</td><td>" + shipped_date + "</td><td>" + address + "</td><td>Kz " + separators(userProductsSum) + "</td><td style='text-transform:capitalize;'>" + _status + "</td></tr>";

			})
		} else {
			tbl_ongoing_orders += "<tr><td colspan='7'>" + (labels['LBL_AGGREGATOR_DASHBOARD_ONGOING_ORDERS_NO_ORDERS'][(req.session.language || 'EN')]) + "</td></tr>";
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

			res.render('aggregators/ajax_dashboard_top_destinations', {
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

exports.top_producers = function (req, res) {
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
				language: req.session.language || 'EN',
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

exports.list = function (req, res) {
	res.render('aggregators/dashboard', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || 'EN',
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

/*exports.list = function(req, res) {
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
	         	from: 'units',
	         	localField: 'unit_type',
	         	foreignField: 'unit_id',
	         	as: 'unitDetails'
	       	}
	    }, {
	    	"$unwind": "$unitDetails"
	    },{
            $match: {
                user_id: req.session.user_id,
                product_type: 'forecast',
                $and: [
                  {"expire_date": {$gte: new Date(moment().format('YYYY-MM-DD')+'T00:00:00.000Z')}},
                  {"expire_date": {$lte: new Date(moment().format('YYYY-MM-DD')+'T23:59:59.000Z')}}
                ],
            },
        }, {
	    	"$project": {
	    		_id: 0,
                category_id: "$category_id",
                category_title: "$categoryDetails.title",
                sub_category_id: "$sub_category_id",
                sub_category_title: "$subCategoryDetails.title",
                product_variety_id: "$product_variety_id",
                product_variety_title: "$productVarietiesDetails.title",
                product_id: "$product_id",
                product_type: "$product_type",
                description: "$description",
                grade: "$grade",
                unit_plural_title: "$unitDetails.plural_title",
                unit_type: "$unitDetails.title",
                unit_value: "$unit_value",
                size: "$size",
                unit_price: "$unit_price",
                total_unit_price: "$total_unit_price",
                lower_price_range: "$lower_price_range",
                higher_price_range: "$higher_price_range",
                expire_date: "$expire_date",
                images: "$images",
                location: "$location",
                created_at: "$created_at",
		  	}
		},
		{
			$sort : { created_at : -1 }
		}
	], (err, products) => {
		_.each(products, (element, index, list) => {
			products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
			products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
        	products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/forcast.png');
        	products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
        	products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
		})

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
	            $match: {
	                user_id: req.session.user_id
	            },
	        }, {
		    	"$project": {
		    		_id: 0,
	                category_id: "$category_id",
	                category_title: "$categoryDetails.title",
	                sub_category_id: "$sub_category_id",
	                sub_category_title: "$subCategoryDetails.title",
	                product_variety_id: "$product_variety_id",
	                product_variety_title: "$productVarietiesDetails.title",
	                product_id: "$product_id",
	                product_type: "$product_type",
	                description: "$description",
	                grade: "$grade",
	                unit_type: "$unit_type",
	                unit_value: "$unit_value",
	                remaining_unit_value: "$remaining_unit_value",
	                size: "$size",
	                reviews: "$reviews",
	                unit_price: "$unit_price",
	                total_unit_price: "$total_unit_price",
	                lower_price_range: "$lower_price_range",
	                higher_price_range: "$higher_price_range",
	                expire_date: "$expire_date",
	                images: "$images",
	                location: "$location",
	                created_at: "$created_at",
	                name: "$farmerDetails.name",
			  	}
			},
			{
				$sort : { created_at : -1 }
			}
		], (err, my_products) => {
			my_products = JSON.parse(JSON.stringify(my_products));

			let categories = [], categories_ids = [];
			_.each(my_products, (element, index, list) => {
				my_products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				my_products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
	            my_products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/forcast.png');
	            if(!_.contains(categories_ids, element.category_id)){
	            	categories_ids.push(element.category_id);
		            categories.push({
		            	category_id: element.category_id,
		            	category_title: element.category_title
		            })
	            }

	            let total_ratings = (element.reviews.length > 0) ? (element.reviews.reduce((a, b) => +a + +b.rating, 0)) : 0;
		        my_products[index]['average_ratings'] = (element.reviews.length > 0) ? (total_ratings / element.reviews.length).toFixed(2) : 0;
		        my_products[index]['to_sell'] = ((element.remaining_unit_value * 100) / element.unit_value).toFixed(2)+'%';
		        my_products[index]['already_sold'] = (100 - ((element.remaining_unit_value * 100) / element.unit_value)).toFixed(2)+'%';
	        })

			categories = _.sortBy( categories, function( item ) { return item.category_title; } )
	        res.render('aggregators/dashboard', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				moment,
				products,
				labels,
				my_products,
				categories,
				language: req.session.language || 'EN',
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		})
	})
};*/