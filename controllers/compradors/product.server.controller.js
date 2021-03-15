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
let ProductVariety = require('mongoose').model('Product_variety');
let SubCategory = require('mongoose').model('Sub_category');
let Product = require('mongoose').model('Product');
let Language = require('mongoose').model('Language');
let Setting = require('mongoose').model('Setting');
let Unit = require('mongoose').model('Unit');
let labels = require('../../utils/labels.json');


exports.toDashboard = (req, res) => {
	return res.redirect('/compradors/dashboard');
} 
exports.filterList = function(req, res) {
	let sortColumnAndValues = {}, filterColumnAndValues = { user_id: req.session.user_id };
	if(req.query.sort_by_price == 'min'){
		sortColumnAndValues['higher_price_range'] = 1;
	} else {
		sortColumnAndValues['higher_price_range'] = -1;
	}

	if(req.query.sort_by_qty == 'min'){
		sortColumnAndValues['unit_value'] = 1;
	} else {
		sortColumnAndValues['unit_value'] = -1;
	}

	if(req.query.category_id != 'all'){
		filterColumnAndValues['category_id'] = req.query.category_id;
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
            $match: filterColumnAndValues,
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
	    	"$project": {
	    		_id: 0,
                category_id: "$category_id",
                category_title: "$categoryDetails.title",
                sub_category_id: "$sub_category_id",
                sub_category_title: "$subCategoryDetails.title",
                product_id: "$product_id",
                product_type: "$product_type",
                description: "$description",
                grade: "$grade",
                unit_plural_title: "$unitDetails.plural_title",
                unit_type: "$unitDetails.title",
                unit_value: "$unit_value",
                unit_price: "$unit_price",
                total_unit_price: "$total_unit_price",
                lower_price_range: "$lower_price_range",
                higher_price_range: "$higher_price_range",
                expire_date: "$expire_date",
                images: "$images",
                location: "$location",
                status: "$status",
                created_at: "$created_at",
		  	}
		},
		{ 
			$sort : sortColumnAndValues
		}
	], (err, products) => {
		if(products.length == 0){
			res.render('compradors/product/filter-empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				layout: false,
				language: req.session.language || config.default_language_code
			});
		} else {
			products = JSON.parse(JSON.stringify(products));
			_.each(products, (element, index, list) => {
				products[index]['product_unit_value'] = separatorsWD(element.unit_value);
				products[index]['higher_price_range'] = separators(element.higher_price_range);
				products[index]['expire_date'] = convert_date(element.expire_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
	            products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/item-placeholder.png');
	        })

			res.render('compradors/product/filter-list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products,
				labels,
				layout: false,
				language: req.session.language || config.default_language_code
			});
		}
	})
};

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
            $match: {
                user_id: req.session.user_id
            },
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
	    	"$project": {
	    		_id: 0,
                category_id: "$category_id",
                category_title: "$categoryDetails.title",
                sub_category_id: "$sub_category_id",
                sub_category_title: "$subCategoryDetails.title",
                product_id: "$product_id",
                product_type: "$product_type",
                description: "$description",
                grade: "$grade",
                unit_plural_title: "$unitDetails.plural_title",
                unit_type: "$unitDetails.title",
                unit_value: "$unit_value",
                unit_price: "$unit_price",
                total_unit_price: "$total_unit_price",
                lower_price_range: "$lower_price_range",
                higher_price_range: "$higher_price_range",
                expire_date: "$expire_date",
                images: "$images",
                location: "$location",
                status: "$status",
                created_at: "$created_at",
		  	}
		},
		{ 
			$sort : { higher_price_range : 1, unit_value: 1 }
		}
	], (err, products) => {
		if(products.length == 0){
			res.render('compradors/product/empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_EMPTY_DEMAND'][(req.session.language || config.default_language_code)]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		} else {
			let categoryIds = [], categoryArr = [];
			products = JSON.parse(JSON.stringify(products));
			_.each(products, (element, index, list) => {
				if(!_.contains(categoryIds, element.category_id)){
					categoryIds.push(element.category_id)
					categoryArr.push({
						category_id: element.category_id,
						title: element.category_title[req.session.language || config.default_language_code]
					})
				}

				products[index]['product_unit_value'] = separatorsWD(element.unit_value);
				products[index]['higher_price_range'] = separators(element.higher_price_range);
				products[index]['expire_date'] = convert_date(element.expire_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
	            products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix+config.aws.s3.productBucket+'/'+element.images[0] : '../../../images/item-placeholder.png');
	        })

			res.render('compradors/product/list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products,
				categories: categoryArr,
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_LIST_COMPRADOR_PEDIDO'][(req.session.language || config.default_language_code)]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		}
	})
};

exports.add = function(req, res) {
	if(req.body.product_category && req.body.title && req.body.unit && req.body.unit_value && req.body.lower_price_range && req.body.higher_price_range && req.body.state_id && req.body.city_id && req.body.location){
		let columnAndValues = {
			user_id: req.session.user_id,
			category_id: req.body.product_category,
			sub_category_id: req.body.title,
			product_type: 'demand',
			unit_type: req.body.unit,
			unit_value: parseFloat(req.body.unit_value),
			remaining_unit_value: parseFloat(req.body.unit_value),
			lower_price_range: parseFloat(req.body.lower_price_range),
			higher_price_range: parseFloat(req.body.higher_price_range),
			expire_date: new Date(req.body.expire_date),
			period: req.body.period,
			where_to_deliver_id: req.body.where_to_deliver_id,
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			location: req.body.location,
			status: 'approved'
		}

		Language.find({ status: 'active' }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
			let descriptionObj = {};
			_.each(languages, (element, index, list) => {
				let desc = 'description_'+element.code;
				let descCode = (req.body[desc]) ? (req.body[desc]).trim() : '';
				descCode = descCode.replace(/[\t\n]+/g,' ');
				descriptionObj[element.code] = descCode;
	        })
			
			columnAndValues['description'] = descriptionObj;
			let productObj = new Product(columnAndValues);
			productObj.save((err, response) => {
				return res.redirect('list');
			})
		}).sort({ order_number : 1 })
	} else {
		Language.find({ status: 'active', code: (req.session.language || config.default_language_code) }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
			res.render('compradors/product/add', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				languages,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item'><a href='"+config.base_url+"compradors/product/list'>"+labels['LBL_LIST_COMPRADOR_PEDIDO'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_ADD_NEW_DEMAND'][(req.session.language || config.default_language_code)]+"</li>",
				messages : req.flash('error') || req.flash('info'),
				messages : req.flash('info'),
			});
		}).sort({ order_number : 1 })
	}
};

exports.remove = function(req, res) {
	Product.remove({ product_id: req.params.id }, (err, response) => {
		return res.redirect(config.base_url+'compradors/product/list');
	})
};

exports.display = function(req, res) {
	if(req.params.id) {
		Product.findOne({ product_id: req.params.id }, { _id: 0 }, (err, product) => {
			if(!product){
				return res.redirect('list');
			}

			product = JSON.parse(JSON.stringify(product));
			product.expire_date = moment(product.expire_date).format('YYYY-MM-DD');

			Unit.findOne({ unit_id: product.unit_type }, { _id: 0, unit_id: 1, max_price_range: 1 }, (err, units) => {
				console.log(units);
				Language.find({ status: 'active', code: (req.session.language || config.default_language_code) }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
					res.render('compradors/product/edit', {
						user: {
							user_id: req.session.user_id,
							name: req.session.name,
							user_type: req.session.user_type,
							login_type: req.session.login_type
						},
						product,
						labels,
						languages,
						language: req.session.language || config.default_language_code,
						max_price_range: (units) ? units.max_price_range : 0,
						breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item'><a href='"+config.base_url+"compradors/product/list'>"+labels['LBL_LIST_COMPRADOR_PEDIDO'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_EDIT_DEMAND'][(req.session.language || config.default_language_code)]+"</li>",
						messages : req.flash('error') || req.flash('info'),
						messages : req.flash('info'),
					});
				}).sort({ order_number : 1 })
			})
		})
	} else {
		return res.redirect('list');
	}
};

exports.edit = function(req, res) {
	if(req.body.product_id && req.body.product_category && req.body.title && req.body.unit && req.body.unit_value && req.body.state_id && req.body.city_id && req.body.location && req.body.lower_price_range && req.body.higher_price_range && req.body.expire_date){
		Product.findOne({ product_id: req.body.product_id }, { _id: 0, product_id: 1, higher_price_range: 1 }, (err, response) => {
			if(!response){
				return res.redirect('list');
			}

			let columnAndValues = {
				user_id: req.session.user_id,
				category_id: req.body.product_category,
				sub_category_id: req.body.title,
				unit_type: req.body.unit,
				unit_value: parseFloat(req.body.unit_value),
				remaining_unit_value: parseFloat(req.body.unit_value),
				lower_price_range: parseFloat(req.body.lower_price_range),
				higher_price_range: ((parseFloat(req.body.higher_price_range) > 0) ? parseFloat(req.body.higher_price_range) : response.higher_price_range),
				expire_date: new Date(req.body.expire_date),
				period: req.body.period,
				where_to_deliver_id: req.body.where_to_deliver_id,
				state_id: req.body.state_id,
				city_id: req.body.city_id,
				location: req.body.location
			}

			Language.find({ status: 'active' }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
				let descriptionObj = {};
				_.each(languages, (element, index, list) => {
					let desc = 'description_'+element.code;
					let descCode = (req.body[desc] ? ((req.body[desc]).trim()) : '');
					//let descCode = (req.body[desc]).trim() || '';
					descCode = descCode.replace(/[\t\n]+/g,' ');
					descriptionObj[element.code] = descCode;
		        })
				
				columnAndValues['description'] = descriptionObj;
				Product.update({ product_id: req.body.product_id }, columnAndValues, function(err, response) {
					return res.redirect('list');
				})
			}).sort({ order_number : 1 })
		})
	} else {
		return res.redirect('list');
	}
};