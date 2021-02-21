let _ = require('underscore');
let Order = require('mongoose').model('Order');
let config = require('../../../config/config');
let moment = require('moment');
let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let Product = require('mongoose').model('Product');
let labels = require('../../utils/labels.json');
let { 
	convert_date,
	separators,
	separatorsWD
} = require('../../utils/formatter');

exports.list = function(req, res) {
	res.render('compradors/statistics/total_purchase', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || config.default_language_code,
		breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"compradors/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_COMPRADOR_DASHBOARD_STATISTICS_TOTAL_PURCHASE'][(req.session.language || config.default_language_code)]+"</li>",
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};

exports.totalPurchase = function(req, res) {
	Order.find({ 'buyer_info.user_id': {$in: [req.session.user_id]}, status: { $nin: ['cancelled'] } }, { _id: 0, updated_at: 0 }, (err, orders) => {
		let tbl_purchase_orders = "", className = '', total = 0;
		if(orders.length > 0){
			_.each(orders, (element, index, list) => {
				ordered_date = convert_date(element.created_at, req.session.language);
				shipped_date = convert_date(element.delivery_at, req.session.language);
				className = '';
				if(index % 2 != 0){
					className = 'tbl-row-color';
				}
				total+= element.total;

				tbl_purchase_orders+= "<tr class='"+className+"' onClick=orderDetails('"+config.base_url+"','compradors','"+element.order_id+"')><td>"+element.order_id+"</td><td>"+ordered_date+"</td><td>"+shipped_date+"</td><td>"+(element.address_info.locality+', '+element.address_info.city_district+', '+element.address_info.state)+"</td><td>Kz "+separators(element.total)+"</td><td style='text-transform:capitalize;'>"+element.status+"</td></tr>";
			})

			className = (!className) ? 'tbl-row-color' : '';
			tbl_purchase_orders+= "<tr class='"+className+"' ><td colspan='4'>&nbsp;</td><td colspan='2'>Kz "+separators(total)+"</td></tr>";
		} else {
			tbl_purchase_orders+= "<tr><td colspan='6'>"+(labels['LBL_COMPRADOR_DASHBOARD_ONGOING_ORDERS_NO_ORDERS'][(req.session.language || 'EN')])+"</td></tr>";
		}

		res.send(tbl_purchase_orders);
		return false;
	}).sort({ created_at:-1 })
};