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
	res.render('aggregators/statistics/total_sales', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || config.default_language_code,
		breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+"aggregators/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_AGGREGATOR_DASHBOARD_STATISTICS_TOTAL_SALES'][(req.session.language || config.default_language_code)]+"</li>",
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};

exports.totalSales = function(req, res) {
	Order.find({ 'products.user_info.user_id': {$in: [req.session.user_id]}, status: { $nin: ['cancelled', 'delivered'] } }, { _id: 0, updated_at: 0 }, (err, orders) => {
		let tbl_sales_orders = "", userProducts = 0, userProductsSum = 0, ordered_date = '', shipped_date = '', className = '', total = 0;
		if(orders.length > 0){
			_.each(orders, (element, index, list) => {
				userProducts = 0, userProductsSum = 0;
				_.each(element.products, (inner_element, inner_index, inner_list) => {
					if(inner_element.user_info.user_id == req.session.user_id){
						userProducts+= 1;
						userProductsSum+= (inner_element.unit_price * inner_element.qty);
						total+= (inner_element.unit_price * inner_element.qty);
					}
				})
				
				ordered_date = convert_date(element.created_at, req.session.language);
				shipped_date = convert_date(element.delivery_at, req.session.language);
				className = '';
				if(index % 2 != 0){
					className = 'tbl-row-colorv';
				}

				_status ="";
				if (element.status == 'paid') {
					_status = (element.status == 'Paid') ? labels['LBL_PAID'][(req.session.language || config.default_language_code)] : labels['LBL_PAID'][(req.session.language || config.default_language_code)];
				}else if (element.status == 'packed') {
					_status = (element.status == 'packed') ? labels['LBL_PACKED'][(req.session.language || config.default_language_code)] : labels['LBL_PACKED'][(req.session.language || config.default_language_code)];
				}else if (element.status == 'shipped') {
					_status = (element.status == 'shipped') ? labels['LBL_SHIPPED'][(req.session.language || config.default_language_code)] : labels['LBL_SHIPPED'][(req.session.language || config.default_language_code)];
				}else if (element.status == 'delivered') {
					_status = (element.status == 'delivered') ? labels['LBL_DELIVERED'][(req.session.language || config.default_language_code)] : labels['LBL_DELIVERED'][(req.session.language || config.default_language_code)];
				}else if (element.status == 'waiting') {
					_status = (element.status == 'waiting') ? labels['LBL_WAITING'][(req.session.language || config.default_language_code)] : labels['LBL_WAITING'][(req.session.language || config.default_language_code)];
				}
				tbl_sales_orders+= "<tr class='"+className+"'><td class = 'column_order_table' onClick=orderDetails('"+config.base_url+"','aggregators','"+element.order_id+"')>"+element.order_id+"</td><td>"+element.buyer_info.user_id+"</td><td>"+ordered_date+"</td><td>"+shipped_date+"</td><td>"+(element.address_info.locality+', '+element.address_info.city_district+', '+element.address_info.state)+"</td><td>Kz "+separators(userProductsSum)+"</td><td style='text-transform:capitalize;'>"+_status+"</td></tr>";
			})
		} else {
			tbl_sales_orders+= "<tr><td colspan='7'>"+(labels['LBL_AGGREGATOR_DASHBOARD_ONGOING_ORDERS_NO_ORDERS'][(req.session.language || 'PT')])+"</td></tr>";
		}

		res.send(tbl_sales_orders);
		return false;
	}).sort({ created_at:-1 })
};