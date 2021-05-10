let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let User = require('mongoose').model('User');
let Farmer = require('mongoose').model('Farmer');
let State = require('mongoose').model('State');
let City = require('mongoose').model('City');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let labels = require('../../utils/labels.json');
let { 
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');


exports.toDashboard = (req, res) => {
	return res.redirect('/compradors/dashboard');
} 
exports.list = function(req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1 }, (err, singleUser) => {
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
	            $match: {
	                product_id: { $in: singleUser.favourite_product_id },
	                status: 'approved',
	                expire_date: { $gte: new Date(moment().format('YYYY-MM-DD')+'T00:00:00.000Z') }
	            },
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
		    	"$project": {
		    		_id: 0,
	                category_title: "$categoryDetails.title",
	                sub_category_title: "$subCategoryDetails.title",
	                product_variety_title: "$productVarietiesDetails.title",
	                product_id: "$product_id",
	                product_type: "$product_type",
	                description: "$description",
	                unit_plural_title: "$unitDetails.plural_title",
	                unit_type: "$unitDetails.title",
	                min_qty: "$unitDetails.min_qty",
	                unit_value: "$unit_value",
	                remaining_unit_value: "$remaining_unit_value",
	                size: "$sizeDetails.title",
	                unit_price: "$unit_price",
	                expire_date: "$expire_date",
	                images: "$images",
	                state_name: "$statesDetails.name",
	                created_at: "$created_at",
			  	}
			},
			{ 
				$sort : { created_at : -1 }
			}
		], (err, products) => {
			products = JSON.parse(JSON.stringify(products));
			_.each(products, (element, index, list) => {
				products[index]['unit_price'] = separators(element.unit_price);
				products[index]['remaining_unit_qty'] = separatorsWD(element.remaining_unit_value);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['product_variety_title'] = element.product_variety_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['size'] = element.size[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
	            products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/item-placeholder.png');  
	        })

	        console.log(products);

			res.render('compradors/favourite/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				moment,
				products,
				labels,
				language: req.session.language || 'PT',
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || 'PT')]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LIST_FAVOURITE'][(req.session.language || 'PT')]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		})
	})
};

exports.setUnset = function(req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1 }, (err, singleUser) => {
		if(!singleUser){
			return res.redirect('list');
		}
		
		let favouriteArr = [];
		_.each(req.body.product_obj, (element, index, list) => {
			if(element.type == 'set'){
				favouriteArr.push(element.product_id);
			}
        })


		User.update({ user_id: req.session.user_id }, { favourite_product_id: favouriteArr }, function(err, response) {
			res.send({ code: 200 });
		})
	})
};