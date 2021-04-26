exports.list = function(req, res) {
	res.render('producers/product/list', {
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};

exports.add = function(req, res) {
	res.render('producers/product/add', {
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};