let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
let s3Manager = require('../../utils/s3-manager');
let { generateRandom } = require('../../utils/id-generator');
let City = require('mongoose').model('City');
let Cart = require('mongoose').model('Cart');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let ProductVariety = require('mongoose').model('Product_variety');
let SubCategory = require('mongoose').model('Sub_category');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let labels = require('../../utils/labels.json');
let User = require('mongoose').model('User');
let Estimated_transportation = require('mongoose').model('Estimated_transportation');
let {
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');
const { forEach } = require('p-iteration');

exports.toDashboard = (req, res) => {
	return res.redirect('/compradors/dashboard');
} 
exports.list = async (req, res) => {
	let userInfo = await User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, email: 1, addresses: 1, phone_number: 1, wallet: 1, over_margin: 1 });

	
	let products = await Cart.aggregate([
		{
			$lookup:
			{
				from: 'products',
				localField: 'product_id',
				foreignField: 'product_id',
				as: 'productDetails'
			}
		}, {
			"$unwind": "$productDetails"
		}, {
			$lookup:
			{
				from: 'categories',
				localField: 'productDetails.category_id',
				foreignField: 'category_id',
				as: 'categoryDetails'
			}
		}, {
			"$unwind": "$categoryDetails"
		}, {
			$lookup:
			{
				from: 'sub_categories',
				localField: 'productDetails.sub_category_id',
				foreignField: 'sub_category_id',
				as: 'subCategoryDetails'
			}
		}, {
			"$unwind": "$subCategoryDetails"
		}, {
			$lookup:
			{
				from: 'states',
				localField: 'productDetails.state_id',
				foreignField: 'state_id',
				as: 'statesDetails'
			}
		}, {
			"$unwind": "$statesDetails"
		}, {
			$lookup:
			{
				from: 'units',
				localField: 'productDetails.unit_type',
				foreignField: 'unit_id',
				as: 'unitDetails'
			}
		}, {
			"$unwind": "$unitDetails"
		}, {
			$match: {
				user_id: req.session.user_id
			},
		}, {
			"$project": {
				_id: 0,
				category_title: "$categoryDetails.title",
				sub_category_title: "$subCategoryDetails.title",
				product_id: "$productDetails.product_id",
				product_type: "$productDetails.product_type",
				description: "$productDetails.description",
				unit_min_qty: "$unitDetails.min_qty",
				unit_plural_title: "$unitDetails.plural_title",
				unit_type: "$unitDetails.title",
				unit_value: "$productDetails.unit_value",
				unit_price: "$productDetails.unit_price",
				remaining_unit_value: "$productDetails.remaining_unit_value",
				expire_date: "$productDetails.expire_date",
				images: "$productDetails.images",
				state_id: "$statesDetails.state_id",
				state_name: "$statesDetails.name",
				qty: "$qty"
			}
		},
		{
			$sort: { 'productDetails.unit_price': -1 }
		}
	]);

	products = JSON.parse(JSON.stringify(products));
	let total = 0, transportFees = 0, productArr = [], to_state_id = '';

	if (userInfo && userInfo.addresses.length > 0) {
		let addresses = userInfo.addresses.reverse();
		to_state_id = addresses[0]['state'];
	}

	await forEach(products, async (product) => {
		let productObj = product;
		let unit_price = product.unit_price;

		productObj['item_total'] = separators(unit_price * product.qty);
		productObj['product_qty'] = separatorsWD(product.qty);
		productObj['product_unit_price'] = separators(unit_price);
		productObj['category_title'] = product.category_title[req.session.language || config.default_language_code];
		productObj['sub_category_title'] = product.sub_category_title[req.session.language || config.default_language_code];
		productObj['unit_type'] = product.unit_type[req.session.language || config.default_language_code];
		productObj['unit_plural_title'] = product.unit_plural_title[req.session.language || config.default_language_code];
		productObj['images'][0] = ((product.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + product.images[0] : '../../../images/item-placeholder.png');
		productArr.push(productObj);

		let transportFeesRes = await Estimated_transportation.findOne({ origin: product.state_id, to: to_state_id }, { _id: 0, estimated_transportation_id: 1, price: 1 });
		
		console.log(transportFeesRes)
		if (transportFeesRes) {
			transportFees += transportFeesRes.price;
		}

		total += (product.qty * unit_price);
	})

	res.render('compradors/cart/list', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		addresses: (userInfo.addresses.length > 0) ? userInfo.addresses.reverse() : [],
		products: productArr,
		format_transport_fees: separators(transportFees),
		format_subtotal: separators(total),
		format_total: separators(total + transportFees),
		wallet_formatted: (userInfo) ? separators(userInfo.wallet) : 0,
		wallet: (userInfo) ? userInfo.wallet : 0,
		transportFees,
		subtotal: total,
		total: (total + transportFees),
		labels,
		language: req.session.language || config.default_language_code,
		breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'><a href='" + config.base_url + "compradors/explore/list'>" + labels['LBL_EXPLORE'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_CART'][(req.session.language || config.default_language_code)] + "</li>",
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info'),
	});
};

exports.update = async (req, res) => {
	Cart.remove({ user_id: req.session.user_id }, (err, response) => {
		let cartArr = [];
		_.each(req.body.product_obj, (element, index, list) => {
			cartArr.push({
				cart_id: generateRandom('CAR'),
				product_id: element.product_id,
				user_id: req.session.user_id,
				qty: element.qty
			})
		})

		Cart.insertMany(cartArr, (err, response) => {
			res.send({ code: 200 });
		})
	})
};
