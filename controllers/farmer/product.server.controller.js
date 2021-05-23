let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let s3Manager = require('../../utils/s3-manager');
let {
	convert_date,
	separators,
	separatorsWD,
	removePointerInCurrence
} = require('../../utils/formatter');
let City = require('mongoose').model('City');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Unit = require('mongoose').model('Unit');
let Size = require('mongoose').model('Size');
let Language = require('mongoose').model('Language');
let Product = require('mongoose').model('Product');
let Order = require('mongoose').model('Order');
let User = require('mongoose').model('User');
let Farmer = require('mongoose').model('Farmer');
let labels = require('../../utils/labels.json');
let logger = require('../../utils/logger');
let imagemagick = require('imagemagick');
let path = require('path');
let fs = require('fs');
let __ = require('lodash');
let smsManager = require('../../utils/sms-manager');

exports.list = function (req, res) {
	
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
				from: 'farmers',
				localField: 'producer_id',
				foreignField: 'farmer_id',
				as: 'userDetails'
			}
		}, {
			"$unwind": "$userDetails"
		}, {
			$match: {
				producer_id: req.session.user_id
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
				producer_id: "$producer_id",
				producer_name: "$userDetails.name",
				product_id: "$product_id",
				product_type: "$product_type",
				description: "$description",
				unit_plural_title: "$unitDetails.plural_title",
				unit_type: "$unitDetails.title",
				unit_value: "$unit_value",
				remaining_unit_value: "$remaining_unit_value",
				size: "$sizeDetails.title",
				unit_price: "$unit_price",
				total_unit_price: "$total_unit_price",
				lower_price_range: "$lower_price_range",
				higher_price_range: "$higher_price_range",
				harvest_date: "$harvest_date",
				location: "$location",
				status: "$status",
				created_at: "$created_at",
				images: "$images",
				expire_date: "$expire_date",
			}
		},
		{
			$sort: { unit_price: 1, remaining_unit_value: 1 }
		}
	], (err, products) => {
		if (products.length == 0) {
			res.render('farmer/product/empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "farmer/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EMPTY_FORCAST'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		} else {
			let categoryIds = [], categoryArr = [];
			products = JSON.parse(JSON.stringify(products));
			_.each(products, (element, index, list) => {
				if (!_.contains(categoryIds, element.category_id)) {
					categoryIds.push(element.category_id)
					categoryArr.push({
						category_id: element.category_id,
						title: element.category_title[req.session.language || config.default_language_code]
					})
				}

				products[index]['unit_price'] = separators(element.unit_price);
				products[index]['remaining_unit_qty'] = separatorsWD(element.remaining_unit_value);
				products[index]['harvest_date'] = convert_date(element.harvest_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['product_variety_title'] = element.product_variety_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['size'] = element.size[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				
				if (moment(Date(moment().format('YYYY-MM-DD') + 'T23:00:00.000Z')).isAfter(element.expire_date)) {
					products[index]['status'] = labels['LBL_VENCIDO'][(req.session.language || config.default_language_code)];
				} else {
					products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
				}
				products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/forcast.png');
			})

			res.render('farmer/product/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products,
				categories: categoryArr,
				moment,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "farmer/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LIST_PRODUCTS_AGGREGATOR'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		}
	})
};
