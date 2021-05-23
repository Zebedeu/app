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
let cron = require("node-cron");

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
	         	from: 'cities',
	         	localField: 'city_id',
	         	foreignField: 'city_id',
	         	as: 'cityDetails'
	       	}
	    }, {
	    	"$unwind": "$cityDetails"
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
	            unit_id: "$unitDetails.unit_id",
                unit_value: "$unit_value",
                size: "$size",
                state_id: "$state_id",
                unit_price: "$unit_price",
                total_unit_price: "$total_unit_price",
                images: "$images",
                location: "$location",
                created_at: "$created_at",
	            remaining_unit_value: "$unit_value",
				lower_price_range: "$lower_price_range",
				higher_price_range: "$higher_price_range",
				where_to_deliver_id: "$where_to_deliver_id",
				expire_date: "$expire_date",
				period: "$period",
				city_id: "$cityDetails.city_id",                
				description: "$description",                
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
		         	from: 'cities',
		         	localField: 'city_id',
		         	foreignField: 'city_id',
		         	as: 'cityDetails'
		       	}
		    }, {
		    	"$unwind": "$cityDetails"
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
	                unit_id: "$unitDetails.unit_id",
	                unit_value: "$unit_value",
	                remaining_unit_value: "$remaining_unit_value",
	                size: "$size",
	                unit_price: "$unit_price",
	                total_unit_price: "$total_unit_price",
	                images: "$images",
	                location: "$location",
	                created_at: "$created_at",
	                remaining_unit_value: "$unit_value",
					lower_price_range: "$lower_price_range",
					higher_price_range: "$higher_price_range",
					where_to_deliver_id: "$where_to_deliver_id",
					expire_date: "$expire_date",
					period: "$period",
					city_id: "$cityDetails.city_id",
					description: "$description",                


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
				element_demand['category_title'] = element_demand.category_title[req.session.language || config.default_language_code];
				element_demand['sub_category_title'] = element_demand.sub_category_title[req.session.language || config.default_language_code];

				let demandProducts = _.where(products, { sub_category_id: element_demand.sub_category_id });
				let demandQty = element_demand.unit_value;

				_.each(demandProducts, (element_product, index_product, list_product) => {
					demandProducts[index_product]['product_id'] = element_product.product_id;
					demandProducts[index_product]['category_title'] = element_product.category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['sub_category_title'] = element_product.sub_category_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_plural_title'] = element_product.unit_plural_title[req.session.language || config.default_language_code];
					demandProducts[index_product]['unit_type'] = element_product.unit_type[req.session.language || config.default_language_code];
					demandProducts[index_product]['city_id'] = element_product.city_id;
					demandProducts[index_product]['state_id'] = element_product.state_id;


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
					// var currentDate = moment(demandObj.expire_date);


					//console.log("«««««««««««««««");
					// var dia = currentDate.format("DD");
					// var mes = currentDate.format("MM");
					// 	chandule_date = "";
					// if(demandObj.period == "none" ) {
					// 		chandule_date = '1 * * * *';
					// 		var futureMonth = currentDate;

					// }else if (demandObj.period == 'every_week' ) {
					// 		chandule_date = '1 * * * *';
					// 		var futureMonth = moment(currentDate).add(1, 'week');

					
					// } else if (demandObj.period == 'every_twice_week' ) {
					// 		chandule_date = '30 1 */15 * *';
					// 		var futureMonth = moment(currentDate).add(2, 'week');

					// } else if (demandObj.period == 'every_month' ) {
						
					// 	var futureMonth = moment(currentDate).add(1, 'M');
					// 	var futureMonthEnd = moment(futureMonth).endOf('month');

					// 	if(currentDate.date() != futureMonth.date() && futureMonth.isSame(futureMonthEnd.format('YYYY-MM-DD'))) {
					// 	    futureMonth = futureMonthEnd;
					// 	}
					// 		chandule_date = '1 1 2 * *';
					// }

					// 	console.log(currentDate.format('YYYY-MM-DD'));
					// 	console.log(chandule_date)
					// 	console.log(futureMonth.format('YYYY-MM-DD'));
					
					// let columnAndValues = {
					// 		user_id: req.session.user_id,
					// 		category_id: demandObj.category_id,
					// 		sub_category_id: demandObj.sub_category_id,
					// 		unit_type: demandObj.unit_id,
					// 		unit_value: (demandObj.unit_value),
					// 		remaining_unit_value: (demandObj.unit_value),
					// 		lower_price_range: (demandObj.lower_price_range),
					// 		higher_price_range: (((demandObj.higher_price_range) > 0) ? (demandObj.higher_price_range) : demandObj.higher_price_range),
					// 		expire_date: futureMonth.format('YYYY-MM-DD'),
					// 		period: demandObj.period,
					// 		where_to_deliver_id: demandObj.where_to_deliver_id,
					// 		state_id: demandObj.state_id,
					// 		city_id: demandObj.city_id,
					// 		location: demandObj.location,
					// 		status: 'approved',
					// 		product_type: 'demand',
					// 		description: demandObj.description,
					// 	}


					// console.log(columnAndValues);
					// if(demandObj.period != "none" ) {
					// 	cron.schedule(chandule_date, () => {
					// 			console.log("teste" + chandule_date);
					// 		let productObj = new Product(columnAndValues);
					// 		productObj.save((err, response) => {
					// 			console.log("«««««««««««««««");
					// 			console.log(response);
					// 			console.log("«««««««««««««««");
					// 		})
					// 	});
					// }
			})


			res.render('compradors/demand/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				demands: demandArr,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_BREADCRUMB_DEMANDS'][(req.session.language || config.default_language_code)]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		})
	})
};

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

//var currentDate = moment(randomDate(new Date(2021, 6, 6), new Date()));
