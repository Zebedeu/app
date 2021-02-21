let labels = require('../../utils/labels.json');

exports.list = function(req, res) {
	res.render('producers/explore/list', {
		labels,
		language: req.session.language || 'EN',
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};