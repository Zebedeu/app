let User = require('mongoose').model('User');
let labels = require('../../utils/labels.json');

exports.list = function(req, res) {
	User.findOne({ user_id: req.session.user_id }, { _id: 0, favourite_product_id: 1, recent_search_product_id: 1, wallet: 1 }, (err, singleUser) => {
		res.render('transporters/dashboard', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			total_cart_products: 0,
			labels,
			language: req.session.language || 'EN',
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	});
};