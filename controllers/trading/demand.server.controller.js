let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let s3Manager = require('../../utils/s3-manager');
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
let tradingHandler = require('./trading-company.server.controller');

exports.list = function(req, res) {
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
                expire_date: { $gte: new Date(moment().format('YYYY-MM-DD')+'T00:00:00.000Z') }
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
			$sort : { unit_price : 1 }
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
	                product_type: {$in: ['available', 'forecast']},
	                status: 'approved',
	                expire_date: { $gte: new Date(moment().format('YYYY-MM-DD')+'T00:00:00.000Z') }
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
				$sort : { unit_price : 1 }
			}
		], (err, products) => {
			products = JSON.parse(JSON.stringify(products));
			let categories = [], catids = [], unit_prices = [], demandArr = [];

			_.each(demands, (element_demand, index_demand, list_demand) => {
				element_demand = JSON.parse(JSON.stringify(element_demand));

				element_demand.unit_price = tradingHandler.getOverMargin(element_demand.unit_price, req.session.over_margin);

				element_demand['category_title'] = element_demand.category_title[req.session.language || config.default_language_code];
				element_demand['sub_category_title'] = element_demand.sub_category_title[req.session.language || config.default_language_code];

				let demandProducts = _.where(products, { sub_category_id: element_demand.sub_category_id });
				let demandQty = element_demand.unit_value;

				_.each(demandProducts, (element_product, index_product, list_product) => {
					demandProducts[index_product]['unit_price']  = tradingHandler.getOverMargin(element_product.unit_price, req.session.over_margin);
					demandProducts[index_product]['category_title'] = element_product.category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['sub_category_title'] = element_product.sub_category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_plural_title'] = element_product.unit_plural_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_type'] = element_product.unit_type[req.session.language || config.default_language_code];

					let is_highlighted = false;
					if(demandQty > 0){
						is_highlighted = true;
						demandQty = (demandQty > element_product.unit_value) ? (demandQty - element_product.unit_value) : 0;
					}

					demandProducts[index_product]['is_highlighted'] = is_highlighted;
					demandProducts[index_product]['images'][0] = ((element_product.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element_product.images[0] : '../../../images/item-placeholder.png');
				})

				let demandObj = element_demand;
				demandObj['products'] = demandProducts;
				demandArr.push(demandObj)
			})

			console.log(demandArr);

			res.render('trading/demand/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				demands: demandArr,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"trading/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_BREADCRUMB_DEMANDS'][(req.session.language || config.default_language_code)]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		})
	})
};