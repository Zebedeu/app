let labels = require('../../utils/labels.json');

exports.list = function(req, res) {
	res.render('aggregators/explore/list', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		language: req.session.language || 'PT',
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};