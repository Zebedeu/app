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
let Order = require('mongoose').model('Order');
let labels = require('../../utils/labels.json');
let {
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');

exports.list = function(req, res) {
	Order.findOne({ order_id: req.params.id }, { _id: 0, order_id: 1, address_info: 1, products: 1, buyer_info: 1, delivery_at: 1, payment_type: 1, atm_reference_response: 1 }, (err, singleOrder) => {
		if(!singleOrder){
			return res.redirect(config.base_url+'trading/dashboard');
		}

		let orderPlacedCaption = "";
		if(singleOrder.payment_type == 'wallet'){
			orderPlacedCaption = labels['LBL_WALLET_ORDER_PLACED'][(req.session.language || 'PT')];
			orderPlacedCaption = orderPlacedCaption.replace("#NAME#", singleOrder.buyer_info.name);
			orderPlacedCaption = orderPlacedCaption.replace("#ORDER_ID#", singleOrder.order_id);	
		} else if(singleOrder.payment_type == 'atm_reference'){
			orderPlacedCaption = labels['LBL_ATM_REFERENCE_ORDER_PLACED'][(req.session.language || 'PT')];
			orderPlacedCaption = orderPlacedCaption.replace("#NAME#", singleOrder.buyer_info.name);
			orderPlacedCaption = orderPlacedCaption.replace("#ORDER_ID#", singleOrder.order_id);
			orderPlacedCaption = orderPlacedCaption.replace("#ENTITY_ID#", singleOrder.atm_reference_response.ENTITY_ID);
			orderPlacedCaption = orderPlacedCaption.replace("#REFERENCE_CODE#", singleOrder.atm_reference_response.REFERENCE);
			orderPlacedCaption = orderPlacedCaption.replace("#AMOUNT#", separators(singleOrder.atm_reference_response.AMOUNT));
		} else if(singleOrder.payment_type == 'bank'){
			orderPlacedCaption = labels['LBL_ORDER_PLACED'][(req.session.language || 'PT')];
			orderPlacedCaption = orderPlacedCaption.replace("#NAME#", singleOrder.buyer_info.name);
			orderPlacedCaption = orderPlacedCaption.replace("#ORDER_ID#", singleOrder.order_id);	
		}

		res.render('trading/thanks/list', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			total_products: singleOrder.products.length,
			address: singleOrder.address_info,
			delivery_at: moment(singleOrder.delivery_at).format("Do MMM YYYY"),
			total_cart_products: 0,
			labels,
			order_caption: orderPlacedCaption,
			language: req.session.language || 'PT',
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	})
};