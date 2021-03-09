let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let s3Manager = require('../../utils/s3-manager');
let s3Handler = require('../../utils/s3-handler');
let {
	convert_date,
	separators,
	separatorsWD,
	removePointerInCurrence
} = require('../../utils/formatter');
s3Handler = new s3Handler();
let City = require('mongoose').model('City');
let State = require('mongoose').model('State');
let Language = require('mongoose').model('Language');
let Category = require('mongoose').model('Category');
let Unit = require('mongoose').model('Unit');
let Order = require('mongoose').model('Order');
let Size = require('mongoose').model('Size');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let labels = require('../../utils/labels.json');
let imagemagick = require('imagemagick');
let path = require('path');
let fs = require('fs');
let __ = require('lodash');

// filter list
const filterList = (req, res) => {
	let sortColumnAndValues = {}, filterColumnAndValues = { user_id: req.session.user_id };
	if (req.query.sort_by_price == 'min') {
		sortColumnAndValues['unit_price'] = 1;
	} else {
		sortColumnAndValues['unit_price'] = -1;
	}

	if (req.query.sort_by_qty == 'min') {
		sortColumnAndValues['remaining_unit_value'] = 1;
	} else {
		sortColumnAndValues['remaining_unit_value'] = -1;
	}

	if (req.query.category_id != 'all') {
		filterColumnAndValues['category_id'] = req.query.category_id;
	}

	if (req.query.status != 'all') {
		filterColumnAndValues['status'] = req.query.status;
	}

	if (req.query.type == 'available') {
		filterColumnAndValues['expire_date'] = {
			$gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z')
		};
	} else if (req.query.type == 'expired') {
		filterColumnAndValues['expire_date'] = {
			$lt: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z')
		};
	} else if (req.query.type == 'out_of_stock') {
		filterColumnAndValues['remaining_unit_value'] = 0;
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
			$match: filterColumnAndValues,
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
				expire_date: "$expire_date",
				images: "$images",
				location: "$location",
				status: "$status",
				created_at: "$created_at",
			}
		},
		{
			$sort: sortColumnAndValues
		}
	], (err, products) => {
		if (products.length == 0) {
			res.render('producers/product/filter-empty', {
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
				products[index]['unit_price'] = separators(element.unit_price);
				products[index]['remaining_unit_value'] = separatorsWD(element.remaining_unit_value);
				products[index]['harvest_date'] = convert_date(element.harvest_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['product_variety_title'] = element.product_variety_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['size'] = element.size[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
				products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/forcast.png');
			})

			res.render('producers/product/filter-list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products,
				layout: false,
				moment,
				labels,
				language: req.session.language || config.default_language_code
			});
		}
	})
};

const list = (req, res) => {
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
				images: "$images",
				location: "$location",
				status: "$status",
				created_at: "$created_at",
			}
		},
		{
			$sort: { unit_price: 1, remaining_unit_value: 1 }
		}
	], (err, products) => {
		if (products.length == 0) {
			res.render('producers/product/empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EMPTY_PRODUCTS'][(req.session.language || config.default_language_code)] + "</li>",
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
				products[index]['remaining_unit_value'] = separatorsWD(element.remaining_unit_value);
				products[index]['harvest_date'] = convert_date(element.harvest_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['product_variety_title'] = element.product_variety_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['size'] = element.size[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
				products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/forcast.png');
			})

			res.render('producers/product/list', {
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
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_LIST_PRODUCTS'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		}
	})
};
const soldList = async (req, res) => {

	let categoryArr = [];
	Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] } }, (error, orders) => {
		if (error) {
			logger('Error: can not get ', dbConstants.dbSchema.orders);
			done(errors.internalServer(true), null);
			return;
		}
		let products = []
		// console.log("orders", orders[0].products);
		_.each(orders, data => {
			data.products = JSON.parse(JSON.stringify(data.products));
			_.each(data.products, singleProduct => {

				console.log(singleProduct)
				singleProduct.buyer_info = data.buyer_info
				singleProduct.order_id = data.order_id
				singleProduct.seller_id = singleProduct.user_info.user_id
				singleProduct.user_info.type = (singleProduct.user_info.type).slice(0, -1)
				singleProduct.total = singleProduct.unit_price * singleProduct.qty
				singleProduct['unit_type'] = singleProduct.unit_type[req.session.language || config.default_language_code];
				singleProduct['size'] = singleProduct.size[req.session.language || config.default_language_code];
				singleProduct['sub_category_title'] = singleProduct.sub_category_title[req.session.language || config.default_language_code];
				singleProduct['category_title'] = singleProduct.category_title[req.session.language || config.default_language_code];
				singleProduct.unit_price = separators(singleProduct.unit_price)
				singleProduct['images'][0] = ((singleProduct.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/forcast.png');

				// singleProduct.seller_amount = "Kz " + separatorsWD(singleProduct.seller_amount)
				// singleProduct.kepya_commission = "Kz " + separators(singleProduct.kepya_commission) + " (" + singleProduct.kepya_commission_percentage + "%)"
				singleProduct.delivery_at = data.delivery_at
				singleProduct.payment_status = data.payment_status
			})
			// console.log("Sigle order", data);
			products.push(_.where(data.products, { seller_id: req.session.user_id }))
			// return false;
		})
		products = _.flatten(products)
		// console.log("products", products);
		//console.log("befor length", products.length)
		products = _.groupBy(products, 'product_id')
		let finalData = []
		_.each(products, (singleProducts, key) => {
			console.log("singleProducts", singleProducts[0]);
			let singleProduct = singleProducts[0] || [];
			singleProduct.qty = __.sumBy(singleProducts, "qty");
			finalData.push(singleProduct);
		});
		//console.log("finalData.length oiii", finalData.length);
		if (finalData.length == 0) {
			res.render('producers/product/empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EMPTY_PRODUCTS'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		} else {
			res.render('producers/product/sold-list', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				products: finalData,
				categories: categoryArr,
				moment,
				labels,
				imageUrl: config.aws.prefix + config.aws.s3.productBucket,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_SOLD_PRODUCT'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		}
	});
};
const unsoldList = async (req, res) => {
	let unitData = await Unit.find({}, {});

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
				unit_plural_title: "$unitDetails.plural_title",
				unit_type: "$unitDetails.title",
				unit_id: "$unit_type",
				unit_value: "$unit_value",
				remaining_unit_value: "$remaining_unit_value",
				size: "$sizeDetails.title",
				unit_price: "$unit_price",
				total_unit_price: "$total_unit_price",
				lower_price_range: "$lower_price_range",
				higher_price_range: "$higher_price_range",
				harvest_date: "$harvest_date",
				images: "$images",
				location: "$location",
				status: "$status",
				created_at: "$created_at",
			}
		},
		{
			$sort: { unit_price: 1, remaining_unit_value: 1 }
		}
	], (err, finalProducts) => {

		let products = finalProducts;

		if (products.length == 0) {
			res.render('producers/product/empty', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EMPTY_PRODUCTS'][(req.session.language || config.default_language_code)] + "</li>",
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
				products[index]['remaining_unit_value'] = separatorsWD(element.remaining_unit_value);
				products[index]['harvest_date'] = convert_date(element.harvest_date, req.session.language);
				products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
				products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
				products[index]['product_variety_title'] = element.product_variety_title[req.session.language || config.default_language_code];
				products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
				products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
				products[index]['size'] = element.size[req.session.language || config.default_language_code];
				products[index]['description'] = element.description[req.session.language || config.default_language_code];
				products[index]['status'] = (element.status == 'approved') ? labels['LBL_APPROVED'][(req.session.language || config.default_language_code)] : labels['LBL_NOT_APPROVED'][(req.session.language || config.default_language_code)];
				products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/forcast.png');
			})

			res.render('producers/product/unsold-list', {
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
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_UNSOLD_PRODUCT'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		}
	})
};

const addResponse = (req, res, columnAndValues) => {
	let productObj = new Product(columnAndValues);
	productObj.save((err, response) => {
		return res.redirect('order/' + response.product_id);
	})
};

const add = (req, res) => {
	if (req.body.product_category && req.body.title && req.body.product_variety_id && req.body.unit && req.body.unit_value && req.body.size && req.body.state_id && req.body.city_id && req.body.location) {
		let dateIsAfter = moment(req.body.harvest_date).isAfter(moment());
		let total_unit_price = req.body.total_unit_price;

		console.log(req.body.unit_price + '-------')
		console.log(removePointerInCurrence(req.body.unit_price))
		let columnAndValues = {
			user_id: req.session.user_id,
			category_id: req.body.product_category,
			sub_category_id: req.body.title,
			product_variety_id: req.body.product_variety_id,
			unit_type: req.body.unit,
			unit_value: req.body.unit_value,
			remaining_unit_value: req.body.unit_value,
			size: req.body.size,
			state_id: req.body.state_id,
			city_id: req.body.city_id,
			location: req.body.location,
			unit_price: removePointerInCurrence(req.body.unit_price),
			total_unit_price: parseFloat(total_unit_price),
			harvest_date: new Date(req.body.harvest_date),
			product_type: (dateIsAfter) ? 'forecast' : 'available'
		}

		Language.find({ status: 'active' }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
			let descriptionObj = {};
			_.each(languages, (element, index, list) => {
				let desc = 'description_' + element.code;
				let descCode = (req.body[desc] ? ((req.body[desc]).trim()) : '');
				descCode = descCode.replace(/[\t\n]+/g, ' ');
				descriptionObj[element.code] = descCode;
			})

			columnAndValues['description'] = descriptionObj;

			if (!_.isEmpty(req.files)) {
				let imageArr = [];
				if (Array.isArray(req.files.images)) {
					async.forEachSeries(req.files.images, (singleFile, callbackSingleFile) => {
						if (_.contains(['jpeg', 'jpg', 'png'], singleFile.name.split('.').pop().toLowerCase())) {
							let fileObj = singleFile;
							let filePath = path.join(__dirname, "../../../upload/") + fileObj.name;
							let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + fileObj.name;

							fileObj.mv(filePath, function (err) {
								if (err) {
									console.log(err);
								}
								imagemagick.crop({
									srcPath: filePath,
									dstPath: dstFilePath,
									width: 500,
									height: 500,
									quality: 1,
									gravity: "North"
								}, function (err, stdout, stderr) {
									const fileContent = fs.readFileSync(dstFilePath);
									let fileObject = {
										name: fileObj.name,
										data: fileContent,
										encoding: fileObj.encoding,
										mimetype: fileObj.mimetype,
										mv: fileObj.mv
									}

									s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
										if (error) {
											logger('Error: upload photo from aws s3 bucket. ' + error);
											done(errors.internalServer(true), null);
											return;
										}

										fs.unlinkSync(filePath);
										fs.unlinkSync(dstFilePath);
										imageArr.push(url.substring(url.lastIndexOf('/') + 1));
										callbackSingleFile();
									});
								});
							});
						} else {
							callbackSingleFile();
						}
					}, function () {
						columnAndValues['images'] = imageArr;
						addResponse(req, res, columnAndValues);
					});
				} else {
					if (_.contains(['jpeg', 'jpg', 'png'], req.files.images.name.split('.').pop().toLowerCase())) {
						let fileObj = req.files.images;
						let filePath = path.join(__dirname, "../../../upload/") + req.files.images.name;
						let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + req.files.images.name;
						fileObj.mv(filePath, function (err) {
							if (err) {
								console.log(err);
							}

							imagemagick.crop({
								srcPath: filePath,
								dstPath: dstFilePath,
								width: 500,
								height: 500,
								quality: 1,
								gravity: "North"
							}, function (err, stdout, stderr) {
								const fileContent = fs.readFileSync(dstFilePath);
								let fileObject = {
									name: req.files.images.name,
									data: fileContent,
									encoding: req.files.images.encoding,
									mimetype: req.files.images.mimetype,
									mv: req.files.images.mv
								}

								s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
									if (error) {
										logger('Error: upload photo from aws s3 bucket. ' + error);
										done(errors.internalServer(true), null);
										return;
									}

									fs.unlinkSync(filePath);
									fs.unlinkSync(dstFilePath);

									imageArr.push(url.substring(url.lastIndexOf('/') + 1));
									columnAndValues['images'] = imageArr;
									addResponse(req, res, columnAndValues);
								});
							});
						});
					} else {
						columnAndValues['images'] = imageArr;
						addResponse(req, res, columnAndValues);
					}
				}
			} else {
				addResponse(req, res, columnAndValues);
			}
		}).sort({ order_number: 1 })
	} else {
		Language.find({ status: 'active', code: (req.session.language || config.default_language_code) }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
			res.render('producers/product/add', {
				user: {
					user_id: req.session.user_id,
					name: req.session.name,
					user_type: req.session.user_type,
					login_type: req.session.login_type
				},
				labels,
				languages,
				language: req.session.language || config.default_language_code,
				breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item'><a href='" + config.base_url + "producers/product/list'>" + labels['LBL_LIST_PRODUCTS'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_ADD_NEW_PRODUCT'][(req.session.language || config.default_language_code)] + "</li>",
				messages: req.flash('error') || req.flash('info'),
				messages: req.flash('info'),
			});
		}).sort({ order_number: 1 })
	}
};

const remove = (req, res) => {
	let columnsAndValue = { products: { $elemMatch: { product_id: req.params.id } } }
	Order.find(columnsAndValue, { _id: 0 }, (error, orders) => {
		if (orders.length > 0) {
			console.log("orders - ", orders.length);
			return res.end('0');
		} else {
			Product.findOne({ product_id: req.params.id }, { _id: 0, product_id: 1, images: 1 }, (err, singleProduct) => {
				if (!singleProduct) {
					return res.end('0');
				}
				Product.remove({ product_id: req.params.id }, (err, response) => {
					let fileArr = [];
					let productImagesArr = singleProduct.images;
					_.each(productImagesArr, (element, index, list) => {
						fileArr.push({
							Key: 'products/' + /[^/]*$/.exec(element)[0]
						})
					})
					s3Handler.deleteMultipleFiles(fileArr, config.aws.bucketName, (error, res) => { });
					return res.end('1');
				})
			})
		}

	});
};

const display = (req, res) => {
	if (req.params.id) {
		Product.findOne({ product_id: req.params.id }, { _id: 0, product_id: 1, producer_id: 1, product_type: 1, description: 1, category_id: 1, sub_category_id: 1, product_variety_id: 1, unit_type: 1, unit_value: 1, size: 1, unit_price: 1, total_unit_price: 1, images: 1, location: 1, state_id: 1, city_id: 1, harvest_date: 1 }, (err, product) => {
			if (!product) {
				return res.redirect('list');
			}

			product = JSON.parse(JSON.stringify(product));
			product.harvest_date = moment(product.harvest_date).format('YYYY-MM-DD');
			product.total_unit_price = separators(product.total_unit_price);
			_.each(product.images, (element, index, list) => {
				product.images[index] = ((element) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element : '../../../images/forcast.png');
			})

			Language.find({ status: 'active', code: (req.session.language || config.default_language_code) }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
				res.render('producers/product/edit', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					product,
					languages,
					labels,
					language: req.session.language || config.default_language_code,
					breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item'><a href='" + config.base_url + "producers/product/list'>" + labels['LBL_LIST_PRODUCTS'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_EDIT_PRODUCT'][(req.session.language || config.default_language_code)] + "</li>",
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),

				})
			}).sort({ order_number: 1 })
		})
	} else {
		return res.redirect('list');
	}
};

const editResponse = (req, res, columnAndValues, product_id) => {
	Product.update({ product_id }, columnAndValues, function (err, response) {
		return res.redirect('list');
	})
};

const edit = (req, res) => {
	if (req.body.product_id && req.body.product_category && req.body.title && req.body.product_variety_id && req.body.size && req.body.state_id && req.body.city_id && req.body.location) {
		let total_unit_price = req.body.total_unit_price;
		Product.findOne({ product_id: req.body.product_id }, { _id: 0, images: 1 }, (err, response) => {
			if (!response) {
				return res.redirect('list');
			}

			let imageArr = response.images;
			let dateIsAfter = moment(req.body.harvest_date).isAfter(moment());
			let columnAndValues = {
				user_id: req.session.user_id,
				category_id: req.body.product_category,
				sub_category_id: req.body.title,
				product_variety_id: req.body.product_variety_id,
				size: req.body.size,
				state_id: req.body.state_id,
				city_id: req.body.city_id,
				location: req.body.location,
				unit_price: parseFloat(req.body.unit_price),
				total_unit_price: removePointerInCurrence(total_unit_price),
				harvest_date: new Date(req.body.harvest_date),
				product_type: (dateIsAfter) ? 'forecast' : 'available'
			}

			Language.find({ status: 'active' }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
				let descriptionObj = {};
				_.each(languages, (element, index, list) => {
					let desc = 'description_' + element.code;
					let descCode = (req.body[desc] ? ((req.body[desc]).trim()) : '');
					descCode = descCode.replace(/[\t\n]+/g, ' ');
					descriptionObj[element.code] = descCode;
				})

				columnAndValues['description'] = descriptionObj;
				if (!_.isEmpty(req.files)) {
					console.log('File0: ', req.files);
					if (Array.isArray(req.files.images)) {
						console.log('File1: ', req.files);
						async.forEachSeries(req.files.images, (singleFile, callbackSingleFile) => {
							if (_.contains(['jpeg', 'jpg', 'png'], singleFile.name.split('.').pop().toLowerCase())) {
								let fileObj = singleFile;
								let filePath = path.join(__dirname, "../../../upload/") + fileObj.name;
								let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + fileObj.name;

								fileObj.mv(filePath, function (err) {
									console.log('File2: ', req.files);
									if (err) {
										console.log(err);
									}
									imagemagick.crop({
										srcPath: filePath,
										dstPath: dstFilePath,
										width: 500,
										height: 500,
										quality: 1,
										gravity: "North"
									}, function (err, stdout, stderr) {

										console.log('File3: ', req.files);
										const fileContent = fs.readFileSync(dstFilePath);
										let fileObject = {
											name: fileObj.name,
											data: fileContent,
											encoding: fileObj.encoding,
											mimetype: fileObj.mimetype,
											mv: fileObj.mv
										}

										s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
											if (error) {
												logger('Error: upload photo from aws s3 bucket. ' + error);
												done(errors.internalServer(true), null);
												return;
											}

											fs.unlinkSync(filePath);
											fs.unlinkSync(dstFilePath);
											imageArr.push(url.substring(url.lastIndexOf('/') + 1));
											callbackSingleFile();
										});
									});
								});
							} else {
								callbackSingleFile();
							}
						}, function () {
							columnAndValues['images'] = imageArr;
							editResponse(req, res, columnAndValues, req.body.product_id);
						});
					} else {
						console.log('File4: ', req.files);
						if (_.contains(['jpeg', 'jpg', 'png'], req.files.images.name.split('.').pop().toLowerCase())) {
							let fileObj = req.files.images;
							let filePath = path.join(__dirname, "../../../upload/") + req.files.images.name;
							let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + req.files.images.name;
							fileObj.mv(filePath, function (err) {
								if (err) {
									console.log('File5_1: ', req.files);
									console.log(err);
								}

								imagemagick.crop({
									srcPath: filePath,
									dstPath: dstFilePath,
									width: 500,
									height: 500,
									quality: 1,
									gravity: "North"
								}, function (err, stdout, stderr) {
									const fileContent = fs.readFileSync(dstFilePath);
									let fileObject = {
										name: req.files.images.name,
										data: fileContent,
										encoding: req.files.images.encoding,
										mimetype: req.files.images.mimetype,
										mv: req.files.images.mv
									}

									s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
										if (error) {
											logger('Error: upload photo from aws s3 bucket. ' + error);
											done(errors.internalServer(true), null);
											return;
										}

										fs.unlinkSync(filePath);
										fs.unlinkSync(dstFilePath);

										imageArr.push(url.substring(url.lastIndexOf('/') + 1));
										columnAndValues['images'] = imageArr;
										editResponse(req, res, columnAndValues, req.body.product_id);
									});
								});
							});
						} else {
							columnAndValues['images'] = imageArr;
							editResponse(req, res, columnAndValues, req.body.product_id);
						}
					}
				} else {
					console.log('File6: ', req.files);
					columnAndValues['images'] = imageArr;
					editResponse(req, res, columnAndValues, req.body.product_id);
				}
			}).sort({ order_number: 1 })
		})
	} else {
		return res.redirect('list');
	}
};
const order = function (req, res) {
	if (req.params.id) {
		console.log("req.params.id", req.params.id);
		let columnsAndValue = { products: { $elemMatch: { product_id: req.params.id } } }
		Order.find(columnsAndValue, { _id: 0 }, (error, orders) => {
			if (error) {
				logger('Error: can not get ', dbConstants.dbSchema.orders);
				done(errors.internalServer(true), null);
				return;
			}
			//console.log("orders", orders);
			if (orders.length === 0) {

				Product.findOne({ product_id: req.params.id }, { _id: 0, product_id: 1, producer_id: 1, product_type: 1, description: 1, category_id: 1, sub_category_id: 1, product_variety_id: 1, unit_type: 1, unit_value: 1, size: 1, unit_price: 1, total_unit_price: 1, images: 1, location: 1, state_id: 1, city_id: 1, harvest_date: 1 }, (err, product) => {
					if (!product) {
						return res.redirect('list');
					}

					product = JSON.parse(JSON.stringify(product));
					product.harvest_date = moment(product.harvest_date).format('YYYY-MM-DD');
					product.total_unit_price = separators(product.total_unit_price);
					_.each(product.images, (element, index, list) => {
						product.images[index] = ((element) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element : '../../../images/forcast.png');
					})

					Language.find({ status: 'active', code: (req.session.language || config.default_language_code) }, { _id: 0, language_id: 1, code: 1, title: 1 }, (err, languages) => {
						res.render('producers/product/publish', {
							user: {
								user_id: req.session.user_id,
								name: req.session.name,
								user_type: req.session.user_type,
								login_type: req.session.login_type
							},
							product: product,
							languages,
							labels,
							language: req.session.language || config.default_language_code,
							breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item'><a href='" + config.base_url + "producers/product/list'>" + labels['LBL_LIST_PRODUCTS'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_PRODUCT_DETAILS'][(req.session.language || config.default_language_code)] + "</li>",
							messages: req.flash('error') || req.flash('info'),
							messages: req.flash('info'),

						})
					}).sort({ order_number: 1 })
				})


			} else {
				let products = []
				_.each(orders, data => {
					data.products = JSON.parse(JSON.stringify(data.products));
					_.each(data.products, singleProduct => {
						singleProduct.buyer_info = data.buyer_info
						singleProduct.order_id = data.order_id
						singleProduct.user_info.type = (singleProduct.user_info.type).slice(0, -1)
						singleProduct.total = singleProduct.unit_price * singleProduct.qty
						singleProduct.unit_price = separatorsWD(singleProduct.unit_price)
						singleProduct.seller_amount = separatorsWD(singleProduct.seller_amount) + " Kz"
						singleProduct.kepya_commission = separators(singleProduct.kepya_commission) + " (" + singleProduct.kepya_commission_percentage + "%) KZ"
						singleProduct.delivery_at = data.delivery_at
						singleProduct.payment_status = data.payment_status
						// singleProduct.address_info = data.address_info.locality + ", " + data.address_info.city_district + " " + data.address_info.state
					})
					products.push(_.where(data.products, { product_id: req.params.id }))
				})
				products = _.flatten(products)
				// console.log("products", products);
				// return false;
				res.render('producers/product/product_order', {
					user: {
						user_id: req.session.user_id,
						name: req.session.name,
						user_type: req.session.user_type,
						login_type: req.session.login_type
					},
					products: products,
					labels,
					language: req.session.language || config.default_language_code,
					breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_PRODUCT_ORDER_DETAIL'][(req.session.language || config.default_language_code)] + "</li>",
					messages: req.flash('error') || req.flash('info'),
					messages: req.flash('info'),
				});
			}
		});
	} else {
		return res.redirect('list');
	}
};
module.exports = {
	add,
	addResponse,
	list,
	edit,
	editResponse,
	remove,
	display,
	filterList,
	soldList,
	unsoldList,
	order,
};